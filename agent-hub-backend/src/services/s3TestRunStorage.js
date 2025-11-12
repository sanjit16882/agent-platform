const AWS = require('aws-sdk');

class S3TestRunStorage {
  constructor() {
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.bucketName = process.env.S3_AGENTS_BUCKET || 'agenthub-agents-storage';
    this.testRunsPrefix = 'test-runs/';
    this.testResultsPrefix = 'test-results/';
  }

  /**
   * Save test run to S3
   */
  async saveTestRun(testRun) {
    try {
      const key = `${this.testRunsPrefix}${testRun.id}.json`;
      
      await this.s3.putObject({
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(testRun, null, 2),
        ContentType: 'application/json'
      }).promise();
      
      console.log(`✅ Test run saved to S3: ${testRun.id}`);
      return testRun;
    } catch (error) {
      console.error('❌ Failed to save test run to S3:', error);
      throw error;
    }
  }

  /**
   * Get test run from S3
   */
  async getTestRun(runId) {
    try {
      const key = `${this.testRunsPrefix}${runId}.json`;
      
      const result = await this.s3.getObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      
      return JSON.parse(result.Body.toString());
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return null;
      }
      console.error('❌ Failed to get test run from S3:', error);
      throw error;
    }
  }

  /**
   * List all test runs from S3
   */
  async listTestRuns() {
    try {
      const result = await this.s3.listObjectsV2({
        Bucket: this.bucketName,
        Prefix: this.testRunsPrefix
      }).promise();
      
      if (!result.Contents || result.Contents.length === 0) {
        return [];
      }
      
      // Fetch all test runs in parallel
      const testRuns = await Promise.all(
        result.Contents.map(async (item) => {
          try {
            const obj = await this.s3.getObject({
              Bucket: this.bucketName,
              Key: item.Key
            }).promise();
            
            return JSON.parse(obj.Body.toString());
          } catch (error) {
            console.error(`Failed to fetch test run ${item.Key}:`, error);
            return null;
          }
        })
      );
      
      return testRuns.filter(run => run !== null);
    } catch (error) {
      console.error('❌ Failed to list test runs from S3:', error);
      return [];
    }
  }

  /**
   * Update test run in S3
   */
  async updateTestRun(testRun) {
    return this.saveTestRun(testRun);
  }

  /**
   * Delete test run from S3
   */
  async deleteTestRun(runId) {
    try {
      const key = `${this.testRunsPrefix}${runId}.json`;
      
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      
      console.log(`✅ Test run deleted from S3: ${runId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete test run from S3:', error);
      throw error;
    }
  }

  /**
   * Save test results for a run
   */
  async saveTestResults(runId, results) {
    try {
      const key = `${this.testResultsPrefix}${runId}.json`;
      
      await this.s3.putObject({
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(results, null, 2),
        ContentType: 'application/json'
      }).promise();
      
      console.log(`✅ Test results saved to S3 for run: ${runId}`);
      return results;
    } catch (error) {
      console.error('❌ Failed to save test results to S3:', error);
      throw error;
    }
  }

  /**
   * Get test results for a run
   */
  async getTestResults(runId) {
    try {
      const key = `${this.testResultsPrefix}${runId}.json`;
      
      const result = await this.s3.getObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      
      return JSON.parse(result.Body.toString());
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return [];
      }
      console.error('❌ Failed to get test results from S3:', error);
      throw error;
    }
  }
}

module.exports = S3TestRunStorage;
