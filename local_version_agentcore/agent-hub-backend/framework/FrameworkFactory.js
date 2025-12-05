/**
 * Framework Factory
 * 
 * Factory for creating and initializing the DDATF framework components
 */

const DimensionOrchestrator = require('./core/DimensionOrchestrator');
const ResultAggregator = require('./core/ResultAggregator');

const {
  FunctionalExecutor,
  IntegrationExecutor,
  ConversationalExecutor,
  PerformanceExecutor,
  GovernanceExecutor,
  SecurityExecutor,
  AdvancedExecutor
} = require('./dimensions');

const {
  HallucinationDetector,
  SafetyEvaluator,
  QualityScorer
} = require('./evaluators');

const {
  VectorDBAdapter,
  MCPAdapter
} = require('./adapters');

class FrameworkFactory {
  /**
   * Create a fully initialized DDATF framework
   * @param {object} db - Database connection
   * @param {object} options - Configuration options
   * @returns {object} - Framework components
   */
  static create(db, options = {}) {
    const {
      evaluator = null,
      hallucinationDetector = options.hallucinationDetector || new HallucinationDetector(),
      safetyEvaluator = options.safetyEvaluator || new SafetyEvaluator(),
      qualityScorer = options.qualityScorer || new QualityScorer(),
      vectorDBAdapter = options.vectorDBAdapter || new VectorDBAdapter(),
      mcpAdapter = options.mcpAdapter || new MCPAdapter()
    } = options;

    // Create dimension executors with evaluators
    const dimensionExecutors = {
      functional: new FunctionalExecutor(db, evaluator, qualityScorer),
      integration: new IntegrationExecutor(db, evaluator, vectorDBAdapter, mcpAdapter),
      conversational: new ConversationalExecutor(db, evaluator, qualityScorer),
      performance: new PerformanceExecutor(db, evaluator),
      governance: new GovernanceExecutor(db, evaluator, safetyEvaluator),
      security: new SecurityExecutor(db, evaluator, safetyEvaluator),
      advanced: new AdvancedExecutor(db, evaluator, hallucinationDetector)
    };

    // Create result aggregator
    const resultAggregator = new ResultAggregator(db);

    // Create orchestrator
    const orchestrator = new DimensionOrchestrator(
      db,
      dimensionExecutors,
      resultAggregator
    );

    console.log('✓ DDATF Framework initialized');
    console.log(`  Dimensions: ${Object.keys(dimensionExecutors).length}`);
    console.log(`  Evaluator: ${evaluator ? 'Custom' : 'Basic'}`);
    console.log(`  Hallucination Detector: Enabled`);
    console.log(`  Safety Evaluator: Enabled`);
    console.log(`  Quality Scorer: Enabled`);
    console.log(`  Vector DB: Enabled (Mock)`);
    console.log(`  MCP: Enabled (Mock)`);

    return {
      orchestrator,
      dimensionExecutors,
      resultAggregator,
      evaluators: {
        hallucinationDetector,
        safetyEvaluator,
        qualityScorer
      },
      adapters: {
        vectorDBAdapter,
        mcpAdapter
      }
    };
  }

  /**
   * Get default dimension configuration
   * @returns {Array} - Default dimensions
   */
  static getDefaultDimensions() {
    return [
      {
        name: 'Functional Validation',
        enabled: true,
        weight: 0.15,
        executor: 'functional',
        description: 'Tests basic understanding, multi-step instructions, and domain expertise'
      },
      {
        name: 'Integration Testing',
        enabled: true,
        weight: 0.25,
        executor: 'integration',
        description: 'Tests Vector DB (RAG), MCP server integration, and tool usage'
      },
      {
        name: 'Conversational Behavior',
        enabled: true,
        weight: 0.10,
        executor: 'conversational',
        description: 'Tests ambiguity handling, emotion detection, and tone'
      },
      {
        name: 'Performance & Reliability',
        enabled: true,
        weight: 0.15,
        executor: 'performance',
        description: 'Tests response time, token efficiency, and failure handling'
      },
      {
        name: 'Governance & Safety',
        enabled: true,
        weight: 0.15,
        executor: 'governance',
        description: 'Tests ethical judgment and responsible AI behavior'
      },
      {
        name: 'Security Testing',
        enabled: true,
        weight: 0.10,
        executor: 'security',
        description: 'Tests prompt injection resistance and safety compliance'
      },
      {
        name: 'Advanced Evaluation',
        enabled: true,
        weight: 0.10,
        executor: 'advanced',
        description: 'Tests complex reasoning, hallucination detection, and analytical ability'
      }
    ];
  }

  /**
   * Validate framework configuration
   * @param {object} config - Configuration to validate
   * @returns {object} - Validation result
   */
  static validateConfig(config) {
    const errors = [];
    const warnings = [];

    // Check dimensions
    if (config.dimensions) {
      const totalWeight = config.dimensions.reduce((sum, d) => sum + (d.weight || 0), 0);
      
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        warnings.push(`Dimension weights sum to ${totalWeight}, expected 1.0`);
      }

      const enabledDimensions = config.dimensions.filter(d => d.enabled);
      if (enabledDimensions.length === 0) {
        errors.push('At least one dimension must be enabled');
      }
    }

    // Check models
    if (config.models && config.models.length === 0) {
      errors.push('At least one model must be specified');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = FrameworkFactory;
