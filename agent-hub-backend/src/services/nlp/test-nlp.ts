import { nlpProcessor } from './NaturalLanguageProcessor';

/**
 * Simple test script to verify NLP functionality
 */
async function testNLP() {
  console.log('Testing Natural Language Processor...\n');

  const testDescriptions = [
    "Build me an agent that syncs Jira and Slack daily at 5 PM",
    "Monitor GitHub repository for new pull requests and notify team in Slack",
    "Analyze S3 bucket files every hour and generate summary reports",
    "Copy files from GitHub to S3 when new releases are created"
  ];

  for (const description of testDescriptions) {
    console.log(`\n--- Testing: "${description}" ---`);
    
    try {
      const result = await nlpProcessor.processDescription(description, {
        includeValidation: true,
        includeSuggestions: true
      });

      console.log(`✅ Processing successful (${result.processingTime}ms)`);
      console.log(`📝 Intent: ${result.intent.action}`);
      console.log(`🔗 Sources: ${result.intent.sources.map(s => s.type).join(', ')}`);
      console.log(`🎯 Targets: ${result.intent.targets.map(t => t.type).join(', ')}`);
      console.log(`⏰ Schedule: ${result.intent.schedule ? result.intent.schedule.type : 'None'}`);
      console.log(`🎯 Confidence: ${(result.intent.confidence * 100).toFixed(1)}%`);
      console.log(`✅ Valid Config: ${result.validation.isValid}`);
      console.log(`💡 Suggestions: ${result.suggestions.length}`);
      
      if (result.validation.errors.length > 0) {
        console.log(`❌ Errors: ${result.validation.errors.length}`);
      }
      
      if (result.validation.warnings.length > 0) {
        console.log(`⚠️  Warnings: ${result.validation.warnings.length}`);
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n--- Testing Examples and Capabilities ---');
  
  try {
    const examples = nlpProcessor.getExamples();
    console.log(`📚 Examples available: ${examples.length}`);
    
    const actions = nlpProcessor.getSupportedActions();
    console.log(`🎬 Supported actions: ${Object.keys(actions).length}`);
    
    const connectors = nlpProcessor.getSupportedConnectors();
    console.log(`🔌 Supported connectors: ${Object.keys(connectors).length}`);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.log(`❌ Error testing capabilities: ${error.message}`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testNLP().catch(console.error);
}

export { testNLP };