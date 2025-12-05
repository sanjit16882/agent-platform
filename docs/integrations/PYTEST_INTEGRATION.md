# Pytest Integration

## Overview

Integrate DDTF with Pytest for Python-based AI agent testing.

## Installation

```bash
pip install pytest pytest-ddtf requests
```

## Pytest Plugin

**conftest.py:**
```python
import pytest
import requests
import time
from typing import Dict, List, Optional

class DDTFClient:
    """DDTF client for Pytest integration"""
    
    def __init__(self, api_url: str = "http://localhost:3002"):
        self.api_url = api_url
        self.api_base = f"{api_url}/api/testing"
    
    def execute_test(
        self, 
        agent_id: str, 
        test_ids: List[str],
        models: Optional[List[str]] = None,
        custom_input: Optional[str] = None
    ) -> Dict:
        """Execute DDTF test and wait for completion"""
        payload = {
            "agentId": agent_id,
            "testIds": test_ids
        }
        
        if models:
            payload["models"] = models
        if custom_input:
            payload["customInput"] = custom_input
        
        response = requests.post(f"{self.api_base}/execute", json=payload)
        response.raise_for_status()
        
        run_id = response.json()["runId"]
        return self._wait_for_completion(run_id)
    
    def _wait_for_completion(self, run_id: str, timeout: int = 300) -> Dict:
        """Wait for test completion"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            response = requests.get(f"{self.api_base}/results/{run_id}")
            data = response.json()
            
            if data["status"] == "completed":
                return data
            
            time.sleep(2)
        
        raise TimeoutError(f"Test {run_id} did not complete within {timeout}s")

@pytest.fixture(scope="session")
def ddtf_client():
    """Provide DDTF client fixture"""
    return DDTFClient()

@pytest.fixture
def ddtf_quality_threshold():
    """Default quality threshold"""
    return 80

# Custom markers
def pytest_configure(config):
    config.addinivalue_line(
        "markers", "ai_test: mark test as AI quality test"
    )
    config.addinivalue_line(
        "markers", "ddtf: mark test as DDTF integration test"
    )
```


## Test Examples

**test_ai_agents.py:**
```python
import pytest

@pytest.mark.ai_test
@pytest.mark.ddtf
class TestChatbotQuality:
    """Test chatbot AI quality"""
    
    def test_chatbot_accuracy(self, ddtf_client, ddtf_quality_threshold):
        """Test chatbot accuracy meets threshold"""
        result = ddtf_client.execute_test(
            agent_id="chatbot_support",
            test_ids=["accuracy_check", "hallucination_check"],
            models=["claude-3-5-sonnet"]
        )
        
        assert result["passRate"] >= ddtf_quality_threshold, \
            f"Chatbot quality {result['passRate']}% below threshold"
        
        assert not result.get("hasHallucination", False), \
            "Hallucination detected in chatbot responses"
    
    def test_chatbot_response_time(self, ddtf_client):
        """Test chatbot response time"""
        result = ddtf_client.execute_test(
            agent_id="chatbot_support",
            test_ids=["performance_check"]
        )
        
        avg_duration = result.get("averageDuration", 0)
        assert avg_duration < 5000, \
            f"Response time {avg_duration}ms exceeds 5s threshold"
    
    @pytest.mark.parametrize("test_category,min_score", [
        ("accuracy", 80),
        ("relevance", 75),
        ("coherence", 85)
    ])
    def test_quality_metrics(self, ddtf_client, test_category, min_score):
        """Test various quality metrics"""
        result = ddtf_client.execute_test(
            agent_id="chatbot_support",
            test_ids=[f"{test_category}_check"]
        )
        
        assert result["averageScore"] >= min_score

@pytest.mark.ai_test
class TestSearchAgent:
    """Test search agent quality"""
    
    def test_search_relevance(self, ddtf_client):
        """Test search results relevance"""
        result = ddtf_client.execute_test(
            agent_id="search_assistant",
            test_ids=["relevance_check"],
            custom_input="best laptop for programming"
        )
        
        assert result["passRate"] >= 75
        assert result["averageScore"] >= 70
    
    @pytest.mark.slow
    def test_search_consistency(self, ddtf_client):
        """Test search consistency across multiple runs"""
        results = []
        
        for _ in range(5):
            result = ddtf_client.execute_test(
                agent_id="search_assistant",
                test_ids=["consistency_check"]
            )
            results.append(result["passRate"])
        
        # Check consistency (standard deviation)
        import statistics
        std_dev = statistics.stdev(results)
        assert std_dev < 10, f"Inconsistent results: std_dev={std_dev}"

@pytest.mark.ai_test
class TestContentGenerator:
    """Test content generation quality"""
    
    def test_content_quality(self, ddtf_client):
        """Test generated content quality"""
        result = ddtf_client.execute_test(
            agent_id="content_generator",
            test_ids=["quality_check", "coherence_check"]
        )
        
        assert result["passRate"] >= 80
        assert not result.get("hasHallucination", False)
        
        quality_metrics = result.get("qualityMetrics", {})
        assert quality_metrics.get("coherence", 0) >= 75
    
    def test_no_hallucination(self, ddtf_client):
        """Ensure no hallucinations in generated content"""
        result = ddtf_client.execute_test(
            agent_id="content_generator",
            test_ids=["hallucination_check"]
        )
        
        assert not result.get("hasHallucination", False)
        
        # Check individual test results
        for test_result in result.get("results", []):
            assert test_result.get("passed", False), \
                f"Test {test_result['test_name']} failed: {test_result.get('explanation')}"
```

## Fixtures and Helpers

**conftest.py (extended):**
```python
@pytest.fixture
def ai_agent_config():
    """Provide AI agent configuration"""
    return {
        "chatbot_support": {
            "min_pass_rate": 80,
            "max_response_time": 5000
        },
        "search_assistant": {
            "min_pass_rate": 75,
            "max_response_time": 3000
        },
        "content_generator": {
            "min_pass_rate": 85,
            "max_response_time": 10000
        }
    }

@pytest.fixture
def validate_ai_quality(ddtf_client):
    """Helper fixture for AI quality validation"""
    def _validate(agent_id, test_ids, min_pass_rate=80):
        result = ddtf_client.execute_test(agent_id, test_ids)
        assert result["passRate"] >= min_pass_rate
        return result
    return _validate
```

## Pytest Configuration

**pytest.ini:**
```ini
[pytest]
markers =
    ai_test: AI quality tests
    ddtf: DDTF integration tests
    slow: slow running tests
    
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

# Parallel execution
addopts = 
    -v
    --tb=short
    --strict-markers
    -n auto
    --dist loadscope

# DDTF configuration
ddtf_api_url = http://localhost:3002
ddtf_timeout = 300
```

## CI/CD Integration

**GitHub Actions:**
```yaml
name: Pytest + DDTF Tests

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
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-xdist
      
      - name: Start DDTF service
        run: |
          npm install -g @agent-hub/testing-cli
          agent-test serve &
      
      - name: Run tests
        run: |
          pytest tests/ \
            --cov=src \
            --cov-report=xml \
            --junitxml=junit.xml \
            -m "ai_test"
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
      
      - name: Publish test results
        uses: EnricoMi/publish-unit-test-result-action@v2
        if: always()
        with:
          files: junit.xml
```

## Advanced Usage

**Parametrized Agents:**
```python
@pytest.mark.parametrize("agent_config", [
    {"id": "chatbot_support", "threshold": 80},
    {"id": "search_assistant", "threshold": 75},
    {"id": "content_generator", "threshold": 85}
], ids=lambda x: x["id"])
def test_all_agents(ddtf_client, agent_config):
    """Test all agents meet their thresholds"""
    result = ddtf_client.execute_test(
        agent_id=agent_config["id"],
        test_ids=["quality_check"]
    )
    
    assert result["passRate"] >= agent_config["threshold"]
```

**Custom Assertions:**
```python
def assert_ai_quality(result, min_pass_rate=80, max_hallucination=0):
    """Custom assertion for AI quality"""
    assert result["passRate"] >= min_pass_rate, \
        f"Pass rate {result['passRate']}% below {min_pass_rate}%"
    
    hallucination_count = sum(
        1 for r in result.get("results", []) 
        if r.get("hasHallucination", False)
    )
    
    assert hallucination_count <= max_hallucination, \
        f"Found {hallucination_count} hallucinations"
```

## Best Practices

1. **Use Fixtures**: Leverage pytest fixtures for DDTF client and configuration
2. **Markers**: Use custom markers to organize AI tests
3. **Parallel Execution**: Use pytest-xdist for faster test execution
4. **Parametrization**: Test multiple agents/scenarios with parametrize
5. **Custom Assertions**: Create reusable assertion helpers
6. **Reporting**: Generate JUnit XML for CI/CD integration
