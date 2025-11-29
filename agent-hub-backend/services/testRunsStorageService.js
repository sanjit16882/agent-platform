/**
 * Test Runs Storage Service
 * Handles persistent storage of test runs and results in S3
 */

const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');

class TestRunsStorageService {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      } : undefined
    });
    
    this.bucket = process.env.S3_AGENTS_BUCKET || 'agenthub-agents-storage';
    this.testRunsPrefix = 'test-runs/';
  }

  /**
   * Save a test run to S3
   * @param {Object} testRun - Test run data
   * @returns {Promise<Object>} Saved test run with S3 metadata
   */
  async saveTestRun(testRun) {
    try {
      const runId = testRun.id || `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const key = `${this.testRunsPrefix}${runId}.json`;
      
      const testRunData = {
        ...testRun,
        id: runId,
        savedAt: new Date().toISOString(),
        version: '1.0'
      };

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(testRunData, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'test-run-id': runId,
          'agent-ids': JSON.stringify(testRun.agentIds || []),
          'status': testRun.status || 'unknown',
          'created-at': testRunData.savedAt
        }
      });

      await this.s3Client.send(command);
      
      console.log(`✅ Saved test run ${runId} to S3`);
      
      return {
        success: true,
        runId: runId,
        s3Key: key,
        data: testRunData
      };
    } catch (error) {
      console.error('❌ Error saving test run to S3:', error);
      throw new Error(`Failed to save test run: ${error.message}`);
    }
  }

  /**
   * Get a specific test run from S3
   * @param {string} runId - Test run ID
   * @returns {Promise<Object>} Test run data
   */
  async getTestRun(runId) {
    try {
      const key = `${this.testRunsPrefix}${runId}.json`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const response = await this.s3Client.send(command);
      const bodyContents = await this.streamToString(response.Body);
      const testRun = JSON.parse(bodyContents);
      
      return {
        success: true,
        data: testRun
      };
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return {
          success: false,
          error: 'Test run not found'
        };
      }
      console.error('❌ Error getting test run from S3:', error);
      throw new Error(`Failed to get test run: ${error.message}`);
    }
  }

  /**
   * List all test runs from S3
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of test runs
   */
  async listTestRuns(options = {}) {
    try {
      const { 
        agentId = null, 
        status = null, 
        limit = 100,
        startDate = null,
        endDate = null
      } = options;

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: this.testRunsPrefix,
        MaxKeys: limit
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Contents || response.Contents.length === 0) {
        return {
          success: true,
          data: [],
          count: 0
        };
      }

      // Fetch all test run files
      const testRuns = await Promise.all(
        response.Contents.map(async (item) => {
          try {
            const getCommand = new GetObjectCommand({
              Bucket: this.bucket,
              Key: item.Key
            });
            const fileResponse = await this.s3Client.send(getCommand);
            const bodyContents = await this.streamToString(fileResponse.Body);
            return JSON.parse(bodyContents);
          } catch (error) {
            console.error(`Error reading test run ${item.Key}:`, error);
            return null;
          }
        })
      );

      // Filter out nulls and apply filters
      let filteredRuns = testRuns.filter(run => run !== null);

      // Filter by agent ID
      if (agentId) {
        filteredRuns = filteredRuns.filter(run => 
          run.agentIds && run.agentIds.includes(agentId)
        );
      }

      // Filter by status
      if (status) {
        filteredRuns = filteredRuns.filter(run => run.status === status);
      }

      // Filter by date range
      if (startDate) {
        filteredRuns = filteredRuns.filter(run => 
          new Date(run.startTime) >= new Date(startDate)
        );
      }

      if (endDate) {
        filteredRuns = filteredRuns.filter(run => 
          new Date(run.startTime) <= new Date(endDate)
        );
      }

      // Sort by start time, newest first
      filteredRuns.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      return {
        success: true,
        data: filteredRuns,
        count: filteredRuns.length
      };
    } catch (error) {
      console.error('❌ Error listing test runs from S3:', error);
      throw new Error(`Failed to list test runs: ${error.message}`);
    }
  }

  /**
   * Delete a test run from S3
   * @param {string} runId - Test run ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteTestRun(runId) {
    try {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const key = `${this.testRunsPrefix}${runId}.json`;
      
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.s3Client.send(command);
      
      console.log(`✅ Deleted test run ${runId} from S3`);
      
      return {
        success: true,
        runId: runId
      };
    } catch (error) {
      console.error('❌ Error deleting test run from S3:', error);
      throw new Error(`Failed to delete test run: ${error.message}`);
    }
  }

  /**
   * Helper function to convert stream to string
   */
  async streamToString(stream) {
    if (stream instanceof Readable) {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks).toString('utf-8');
    }
    return stream;
  }

  /**
   * Get test runs for a specific agent
   * @param {string} agentId - Agent ID
   * @returns {Promise<Array>} Array of test runs for the agent
   */
  async getAgentTestRuns(agentId) {
    return this.listTestRuns({ agentId });
  }

  /**
   * Get latest test run for an agent
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object|null>} Latest test run or null
   */
  async getLatestTestRun(agentId) {
    const result = await this.listTestRuns({ agentId, limit: 1 });
    return result.data && result.data.length > 0 ? result.data[0] : null;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  TestRunsStorageService,
  getInstance: () => {
    if (!instance) {
      instance = new TestRunsStorageService();
    }
    return instance;
  }
};
