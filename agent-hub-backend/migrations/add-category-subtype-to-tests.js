/**
 * Migration: Add category and subtype fields to test library
 * 
 * This migration transforms the test library from using combined category names
 * (e.g., "qe_test_case_creation") to separate category and subtype fields
 * (e.g., category: "QE", subtype: "test-case-creation")
 * 
 * This aligns tests with the agent structure for direct matching.
 */

const fs = require('fs');
const path = require('path');

// Category mapping from old format to new format
const CATEGORY_MAPPING = {
  // Universal tests (already in correct format)
  'Universal': { category: 'Universal', subtype: null },
  'universal': { category: 'Universal', subtype: null },
  
  // QE tests (already in correct format)
  'QE': { category: 'QE', subtype: null },
  'qe_test_case_creation': { category: 'QE', subtype: 'test-case-creation' },
  'qe_defect_reporting': { category: 'QE', subtype: 'defect-reporting' },
  'qe_automation': { category: 'QE', subtype: 'automation' },
  'qe_test_automation': { category: 'QE', subtype: 'test-automation' },
  'qe_api_testing': { category: 'QE', subtype: 'api-testing' },
  
  // Development tests (already in correct format)
  'Development': { category: 'Development', subtype: null },
  'development_documentation': { category: 'Development', subtype: 'documentation' },
  'development_code_generation': { category: 'Development', subtype: 'code-generation' },
  'development_code_review': { category: 'Development', subtype: 'code-review' },
  'development_bug_fixing': { category: 'Development', subtype: 'bug-fixing' },
  'development_refactoring': { category: 'Development', subtype: 'refactoring' },
  
  // Security tests (already in correct format)
  'Security': { category: 'Security', subtype: null },
  'security_vulnerability': { category: 'Security', subtype: 'vulnerability' },
  'security_audit': { category: 'Security', subtype: 'audit' },
  'security_threat': { category: 'Security', subtype: 'threat-detection' },
  'security_threat_detection': { category: 'Security', subtype: 'threat-detection' },
  'security_testing_pentest': { category: 'Security Testing', subtype: 'penetration-testing' },
  'security_testing_testgen': { category: 'Security Testing', subtype: 'test-generation' },
  'security_penetration_testing': { category: 'Security Testing', subtype: 'penetration-testing' },
  
  // DevOps tests (already in correct format)
  'DevOps': { category: 'DevOps', subtype: null },
  'devops_cicd': { category: 'DevOps', subtype: 'cicd' },
  'devops_iac': { category: 'DevOps', subtype: 'iac' },
  'devops_monitoring': { category: 'DevOps', subtype: 'monitoring' },
  'devops_container': { category: 'DevOps', subtype: 'container' },
  
  // SRE tests
  'SRE': { category: 'SRE', subtype: null },
  'sre_performance': { category: 'SRE', subtype: 'performance' },
  'sre_reliability': { category: 'SRE', subtype: 'reliability' },
  'sre_incident_response': { category: 'SRE', subtype: 'incident-response' },
  'sre_monitoring': { category: 'SRE', subtype: 'monitoring' },
  'sre_capacity': { category: 'SRE', subtype: 'capacity' },
  
  // Automated Testing
  'automated_testing_framework': { category: 'Automated Testing', subtype: 'framework' },
  'automated_testing_script': { category: 'Automated Testing', subtype: 'script' },
  
  // Business Analysis
  'business_analysis_requirements': { category: 'Business Analysis', subtype: 'requirements' },
  'business_analysis_user_story': { category: 'Business Analysis', subtype: 'user-story' },
  'business_analysis_process': { category: 'Business Analysis', subtype: 'process' },
  
  // Product Management
  'product_management_prioritization': { category: 'Product Management', subtype: 'prioritization' },
  'product_management_roadmap': { category: 'Product Management', subtype: 'roadmap' },
  'product_management_market': { category: 'Product Management', subtype: 'market-analysis' },
  
  // Project Management
  'project_management_planning': { category: 'Project Management', subtype: 'planning' },
  'project_management_risk': { category: 'Project Management', subtype: 'risk-management' },
  'project_management_status': { category: 'Project Management', subtype: 'status-reporting' },
  
  // Production Support
  'production_support_incident': { category: 'Production Support', subtype: 'incident-management' },
  'production_support_rca': { category: 'Production Support', subtype: 'root-cause-analysis' },
  'production_support_troubleshoot': { category: 'Production Support', subtype: 'troubleshooting' }
};

// Output format mapping based on category and subtype
const OUTPUT_FORMAT_MAPPING = {
  'Development_documentation': 'markdown',
  'Development_code-generation': 'code',
  'Development_code-review': 'analysis',
  'Development_bug-fixing': 'code',
  'Development_refactoring': 'code',
  'QE_test-case-creation': 'structured_text',
  'QE_defect-reporting': 'structured_text',
  'Security_vulnerability': 'json',
  'Security_audit': 'json',
  'DevOps_cicd': 'yaml',
  'DevOps_iac': 'code'
};

function migrateTest(test) {
  const oldCategory = test.category;
  
  // Get new category and subtype
  const mapping = CATEGORY_MAPPING[oldCategory];
  
  if (!mapping) {
    console.warn(`⚠️  No mapping found for category: ${oldCategory}, keeping as-is`);
    return {
      ...test,
      category: oldCategory,
      subtype: null
    };
  }
  
  const { category, subtype } = mapping;
  
  // Infer output format
  const formatKey = subtype ? `${category}_${subtype}` : category;
  const output_format = OUTPUT_FORMAT_MAPPING[formatKey] || 'plain_text';
  
  return {
    ...test,
    category,
    subtype,
    output_format
  };
}

function migrateTestFile(filePath) {
  console.log(`\n📄 Migrating: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    let tests;
    let isWrapped = false;
    
    // Handle both array and object formats
    if (Array.isArray(data)) {
      tests = data;
    } else if (data.tests && Array.isArray(data.tests)) {
      tests = data.tests;
      isWrapped = true;
    } else {
      console.error(`❌ Unknown format in ${filePath}`);
      return;
    }
    
    // Migrate each test
    const migratedTests = tests.map(test => migrateTest(test));
    
    // Count changes
    const changedCount = migratedTests.filter((test, i) => 
      test.category !== tests[i].category || test.subtype !== tests[i].subtype
    ).length;
    
    console.log(`   ✅ Migrated ${changedCount} of ${tests.length} tests`);
    
    // Write back
    const output = isWrapped ? { ...data, tests: migratedTests } : migratedTests;
    
    // Create backup
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    console.log(`   💾 Backup created: ${backupPath}`);
    
    // Write migrated data
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`   ✍️  Updated: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
  }
}

// Main execution
function main() {
  console.log('🚀 Starting test library migration...\n');
  console.log('This will add category and subtype fields to all tests\n');
  
  const testFiles = [
    path.join(__dirname, '../data/comprehensiveTests.json'),
    path.join(__dirname, '../src/data/testLibrary.json')
  ];
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      migrateTestFile(file);
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  console.log('\n✅ Migration complete!');
  console.log('\n📋 Summary:');
  console.log('   - Tests now have separate category and subtype fields');
  console.log('   - Output formats have been inferred and added');
  console.log('   - Backups created with .backup extension');
  console.log('\n💡 Next steps:');
  console.log('   1. Review the migrated files');
  console.log('   2. Test with a few test executions');
  console.log('   3. Delete .backup files once confirmed working');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { migrateTest, CATEGORY_MAPPING, OUTPUT_FORMAT_MAPPING };
