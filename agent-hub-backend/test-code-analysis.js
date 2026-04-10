/**
 * Test Code Analysis Service
 */

const CodeAnalysisService = require('./src/services/codeAnalysisService');

// Mock Bedrock Service
const mockBedrockService = {
  async callBedrock(category, prompt, options) {
    console.log('Mock Bedrock called for:', category);
    return {
      success: true,
      content: JSON.stringify({
        score: 65,
        metrics: {
          maintainabilityIndex: 58,
          commentRatio: 0
        },
        issues: [
          {
            id: 'ISS-001',
            severity: 'critical',
            category: 'validation',
            title: 'Missing Input Validation',
            description: 'No validation for price parameter',
            location: 'Line 1, parameter: price',
            impact: 'Can cause runtime errors with invalid inputs',
            suggestedFix: 'if (typeof price !== "number" || price < 0) throw new TypeError("Invalid price");',
            estimatedEffort: '30 minutes'
          },
          {
            id: 'ISS-002',
            severity: 'high',
            category: 'error-handling',
            title: 'No Error Handling',
            description: 'Invalid customerType not handled',
            location: 'Line 2-5',
            impact: 'Silent failures, returns NaN',
            suggestedFix: 'const validTypes = ["premium", "regular"]; if (!validTypes.includes(customerType)) throw new Error("Invalid type");',
            estimatedEffort: '20 minutes'
          }
        ]
      })
    };
  }
};

// Test code
const testCode = `function calculateDiscount(price, customerType) {
  if (customerType === 'premium') {
    return price * 0.8;
  }
  return price * 0.9;
}`;

async function test() {
  console.log('🧪 Testing Code Analysis Service\n');
  
  const service = new CodeAnalysisService(mockBedrockService);
  
  console.log('📝 Analyzing code...\n');
  const result = await service.analyzeCode(testCode);
  
  console.log('✅ Analysis complete!\n');
  console.log('Results:');
  console.log(JSON.stringify(result, null, 2));
  
  console.log('\n📊 Summary:');
  console.log(`- Input Type: ${result.inputAnalysis.type}`);
  console.log(`- Language: ${result.inputAnalysis.language}`);
  console.log(`- Complexity: ${result.inputAnalysis.complexity}`);
  console.log(`- Quality Score: ${result.qualityScore}/100 (Grade: ${result.grade})`);
  console.log(`- Issues Found: ${result.issues.length}`);
  console.log(`- Security Score: ${result.security.score}/100`);
}

test().catch(console.error);
