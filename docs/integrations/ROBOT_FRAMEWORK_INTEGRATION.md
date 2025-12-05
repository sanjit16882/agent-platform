# Robot Framework Integration

## Overview

Integrate DDTF with Robot Framework to add AI agent testing capabilities to your existing test suites.

## Integration Methods

### Method 1: REST API Calls (Recommended)

Use Robot Framework's RequestsLibrary to call DDTF API.

```robot
*** Settings ***
Library    RequestsLibrary
Library    Collections

*** Variables ***
${DDTF_API}    http://localhost:3002/api/testing
${AGENT_ID}    agent_chatbot_001

*** Test Cases ***
Test AI Agent Response Quality
    [Documentation]    Verify AI agent meets quality standards
    [Tags]    ai-testing    quality-gate
    
    # Execute DDTF test
    ${payload}=    Create Dictionary
    ...    agentId=${AGENT_ID}
    ...    testIds=@{TEST_IDS}
    ...    models=@{MODELS}
    
    ${response}=    POST    ${DDTF_API}/execute
    ...    json=${payload}
    ...    expected_status=200
    
    # Extract run ID
    ${run_id}=    Get From Dictionary    ${response.json()}    runId
    
    # Wait for completion
    Wait Until Test Completes    ${run_id}
    
    # Verify results
    ${results}=    GET    ${DDTF_API}/results/${run_id}
    ${pass_rate}=    Get From Dictionary    ${results.json()}    passRate
    
    Should Be True    ${pass_rate} >= 80
    ...    msg=AI agent quality below threshold: ${pass_rate}%

*** Keywords ***
Wait Until Test Completes
    [Arguments]    ${run_id}
    Wait Until Keyword Succeeds    5 min    10 sec
    ...    Check Test Status    ${run_id}

Check Test Status
    [Arguments]    ${run_id}
    ${response}=    GET    ${DDTF_API}/results/${run_id}
    ${status}=    Get From Dictionary    ${response.json()}    status
    Should Be Equal As Strings    ${status}    completed
```


### Method 2: DDTF Robot Library

Create a custom Robot Framework library for DDTF.

**DDTFLibrary.py:**
```python
from robot.api.deco import keyword
import requests
import time

class DDTFLibrary:
    """Robot Framework library for DDTF integration"""
    
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'
    
    def __init__(self, api_url='http://localhost:3002'):
        self.api_url = api_url
        self.api_base = f'{api_url}/api/testing'
    
    @keyword
    def run_ddtf_test(self, agent_id, test_ids, models=None):
        """Execute DDTF test and return run ID"""
        payload = {
            'agentId': agent_id,
            'testIds': test_ids if isinstance(test_ids, list) else [test_ids]
        }
        if models:
            payload['models'] = models if isinstance(models, list) else [models]
        
        response = requests.post(f'{self.api_base}/execute', json=payload)
        response.raise_for_status()
        return response.json()['runId']
    
    @keyword
    def wait_for_test_completion(self, run_id, timeout=300):
        """Wait for DDTF test to complete"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            response = requests.get(f'{self.api_base}/results/{run_id}')
            data = response.json()
            if data['status'] == 'completed':
                return data
            time.sleep(5)
        raise TimeoutError(f'Test {run_id} did not complete within {timeout}s')
    
    @keyword
    def verify_agent_quality(self, run_id, min_pass_rate=80):
        """Verify agent meets quality threshold"""
        response = requests.get(f'{self.api_base}/results/{run_id}')
        data = response.json()
        pass_rate = data['passRate']
        
        if pass_rate < min_pass_rate:
            raise AssertionError(
                f'Agent quality {pass_rate}% below threshold {min_pass_rate}%'
            )
        return pass_rate
```

**Usage:**
```robot
*** Settings ***
Library    DDTFLibrary    http://localhost:3002

*** Test Cases ***
AI Quality Gate
    ${run_id}=    Run DDTF Test    agent_001    test_hallucination_001
    Wait For Test Completion    ${run_id}
    Verify Agent Quality    ${run_id}    min_pass_rate=85
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Robot Framework + DDTF Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          pip install robotframework robotframework-requests
          npm install -g @agent-hub/testing-cli
      
      - name: Run Robot Framework tests
        run: robot --outputdir results tests/
      
      - name: Publish results
        uses: joonvena/robotframework-reporter-action@v2
        if: always()
```

## Best Practices

1. **Separate Test Suites**: Keep traditional Robot tests and DDTF tests in separate suites
2. **Quality Gates**: Use DDTF for AI quality validation in your pipeline
3. **Parallel Execution**: Run Robot and DDTF tests in parallel for faster feedback
4. **Unified Reporting**: Combine results using Robot Framework's rebot tool

## Example Project Structure

```
tests/
├── robot/
│   ├── functional/
│   ├── integration/
│   └── ai_quality_gates.robot  ← DDTF integration
├── ddtf/
│   └── agent_tests.json
└── resources/
    └── DDTFLibrary.py
```
