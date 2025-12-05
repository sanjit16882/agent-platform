/**
 * Migration: Fix test subtypes by inferring from tags
 * 
 * Many tests have category but no subtype. This script infers the subtype
 * from the tags field which contains the detailed category information.
 */

const fs = require('fs');
const path = require('path');

// Infer subtype from tags
function inferSubtypeFromTags(tags, category) {
  if (!tags) return null;
  
  // Parse tags if it's a string
  const tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
  
  // Look for category-specific tags
  const categoryTag = tagArray.find(tag => tag.includes('_'));
  
  if (!categoryTag) return null;
  
  // Extract subtype from tag like "qe_test_case_creation" -> "test-case-creation"
  const parts = categoryTag.split('_');
  
  if (parts.length < 2) return null;
  
  // Remove the category prefix and join the rest
  const categoryPrefix = category.toLowerCase().replace(/\s+/g, '_');
  
  if (categoryTag.startsWith(categoryPrefix + '_')) {
    const subtypeParts = categoryTag.substring(categoryPrefix.length + 1).split('_');
    return subtypeParts.join('-');
  }
  
  // Try other patterns
  if (categoryTag.includes('documentation')) return 'documentation';
  if (categoryTag.includes('code_generation')) return 'code-generation';
  if (categoryTag.includes('code_review')) return 'code-review';
  if (categoryTag.includes('bug_fixing')) return 'bug-fixing';
  if (categoryTag.includes('test_case_creation')) return 'test-case-creation';
  if (categoryTag.includes('defect_reporting')) return 'defect-reporting';
  if (categoryTag.includes('test_automation')) return 'test-automation';
  if (categoryTag.includes('vulnerability')) return 'vulnerability';
  if (categoryTag.includes('audit')) return 'audit';
  if (categoryTag.includes('cicd')) return 'cicd';
  if (categoryTag.includes('iac')) return 'iac';
  if (categoryTag.includes('container')) return 'container';
  if (categoryTag.includes('monitoring')) return 'monitoring';
  if (categoryTag.includes('capacity')) return 'capacity';
  if (categoryTag.includes('incident')) return 'incident-management';
  if (categoryTag.includes('rca')) return 'root-cause-analysis';
  if (categoryTag.includes('troubleshoot')) return 'troubleshooting';
  if (categoryTag.includes('pentest')) return 'penetration-testing';
  if (categoryTag.includes('testgen')) return 'test-generation';
  if (categoryTag.includes('framework')) return 'framework';
  if (categoryTag.includes('script')) return 'script';
  if (categoryTag.includes('requirements')) return 'requirements';
  if (categoryTag.includes('user_story')) return 'user-story';
  if (categoryTag.includes('process')) return 'process';
  if (categoryTag.includes('prioritization')) return 'prioritization';
  if (categoryTag.includes('roadmap')) return 'roadmap';
  if (categoryTag.includes('market')) return 'market-analysis';
  if (categoryTag.includes('planning')) return 'planning';
  if (categoryTag.includes('risk')) return 'risk-management';
  if (categoryTag.includes('status')) return 'status-reporting';
  
  return null;
}

// Output format mapping
const OUTPUT_FORMAT_MAPPING = {
  'Development_documentation': 'markdown',
  'Development_code-generation': 'code',
  'Development_code-review': 'analysis',
  'Development_bug-fixing': 'code',
  'Development_refactoring': 'code',
  'QE_test-case-creation': 'structured_text',
  'QE_defect-reporting': 'structured_text',
  'QE_test-automation': 'code',
  'Security_vulnerability': 'json',
  'Security_audit': 'json',
  'Security_threat-detection': 'json',
  'Security Testing_penetration-testing': 'structured_text',
  'Security Testing_test-generation': 'structured_text',
  'DevOps_cicd': 'yaml',
  'DevOps_iac': 'code',
  'DevOps_container': 'code',
  'DevOps_monitoring': 'yaml',
  'SRE_monitoring': 'yaml',
  'SRE_capacity': 'structured_text',
  'SRE_incident-management': 'structured_text',
  'SRE_root-cause-analysis': 'structured_text',
  'SRE_troubleshooting': 'structured_text',
  'Automated Testing_framework': 'code',
  'Automated Testing_script': 'code',
  'Business Analysis_requirements': 'structured_text',
  'Business Analysis_user-story': 'structured_text',
  'Business Analysis_process': 'structured_text',
  'Product Management_prioritization': 'structured_text',
  'Product Management_roadmap': 'structured_text',
  'Product Management_market-analysis': 'structured_text',
  'Project Management_planning': 'structured_text',
  'Project Management_risk-management': 'structured_text',
  'Project Management_status-reporting': 'structured_text',
  'Production Support_incident-management': 'structured_text',
  'Production Support_root-cause-analysis': 'structured_text',
  'Production Support_troubleshooting': 'structured_text'
};

function fixTest(test) {
  // If subtype is already set and not null, keep it
  if (test.subtype && test.subtype !== null) {
    return test;
  }
  
  // Infer subtype from tags
  const subtype = inferSubtypeFromTags(test.tags, test.category);
  
  // Infer output format
  const formatKey = subtype ? `${test.category}_${subtype}` : test.category;
  const output_format = OUTPUT_FORMAT_MAPPING[formatKey] || test.output_format || 'plain_text';
  
  return {
    ...test,
    subtype,
    output_format
  };
}

function fixTestFile(filePath) {
  console.log(`\n📄 Fixing: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const tests = JSON.parse(content);
    
    // Fix each test
    const fixedTests = tests.map(test => fixTest(test));
    
    // Count changes
    const changedCount = fixedTests.filter((test, i) => 
      test.subtype !== tests[i].subtype || test.output_format !== tests[i].output_format
    ).length;
    
    console.log(`   ✅ Fixed ${changedCount} of ${tests.length} tests`);
    
    // Show some examples
    const examples = fixedTests.filter(t => t.subtype).slice(0, 3);
    examples.forEach(t => {
      console.log(`      ${t.id}: ${t.category} / ${t.subtype} -> ${t.output_format}`);
    });
    
    // Write back
    fs.writeFileSync(filePath, JSON.stringify(fixedTests, null, 2), 'utf8');
    console.log(`   ✍️  Updated: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Main execution
function main() {
  console.log('🚀 Fixing test subtypes...\n');
  
  const testFile = path.join(__dirname, '../data/comprehensiveTests.json');
  
  if (fs.existsSync(testFile)) {
    fixTestFile(testFile);
  } else {
    console.log(`⚠️  File not found: ${testFile}`);
  }
  
  console.log('\n✅ Fix complete!');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixTest, inferSubtypeFromTags };
