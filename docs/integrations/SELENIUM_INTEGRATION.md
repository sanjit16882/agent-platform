# Selenium WebDriver Integration

## Overview

Combine Selenium WebDriver for UI testing with DDTF for AI agent validation in end-to-end test scenarios.

## Use Case

Test AI-powered features in web applications:
- Chatbot interactions
- AI-generated content quality
- Recommendation engine accuracy
- Search result relevance

## Integration Pattern

```
Selenium Test → Trigger AI Feature → DDTF Validates AI Response
```

## Java + Selenium + DDTF

```java
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.junit.Test;
import static org.junit.Assert.*;
import java.net.http.*;
import com.google.gson.*;

public class ChatbotE2ETest {
    
    private static final String DDTF_API = "http://localhost:3002/api/testing";
    
    @Test
    public void testChatbotQuality() throws Exception {
        WebDriver driver = new ChromeDriver();
        
        try {
            // 1. Navigate to chatbot page
            driver.get("https://myapp.com/chatbot");
            
            // 2. Interact with chatbot UI
            driver.findElement(By.id("chat-input"))
                  .sendKeys("What is your refund policy?");
            driver.findElement(By.id("send-button")).click();
            
            // 3. Wait for response
            Thread.sleep(2000);
            String chatResponse = driver.findElement(By.className("bot-message"))
                                       .getText();
            
            // 4. Validate with DDTF
            String agentId = "chatbot_support_001";
            DDTFTestResult result = runDDTFValidation(agentId, chatResponse);
            
            // 5. Assert quality
            assertTrue("Chatbot quality below threshold", 
                      result.getPassRate() >= 80);
            assertFalse("Hallucination detected", 
                       result.hasHallucination());
            
        } finally {
            driver.quit();
        }
    }
    
    private DDTFTestResult runDDTFValidation(String agentId, String response) 
            throws Exception {
        // Call DDTF API to validate AI response
        HttpClient client = HttpClient.newHttpClient();
        
        String payload = String.format(
            "{\"agentId\":\"%s\",\"testIds\":[\"hallucination_check\"]," +
            "\"customInput\":\"%s\"}", 
            agentId, response
        );
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(DDTF_API + "/execute"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();
        
        HttpResponse<String> apiResponse = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        Gson gson = new Gson();
        return gson.fromJson(apiResponse.body(), DDTFTestResult.class);
    }
}
```


## Python + Selenium + DDTF

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import requests
import time

class AIFeatureTest:
    
    def __init__(self):
        self.driver = webdriver.Chrome()
        self.ddtf_api = "http://localhost:3002/api/testing"
    
    def test_ai_search_quality(self):
        """Test AI-powered search with quality validation"""
        try:
            # Navigate to search page
            self.driver.get("https://myapp.com/search")
            
            # Perform AI-powered search
            search_box = self.driver.find_element(By.ID, "ai-search")
            search_box.send_keys("best laptop for programming")
            search_box.submit()
            
            # Wait for AI results
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "ai-results"))
            )
            
            # Extract AI-generated summary
            ai_summary = self.driver.find_element(
                By.CLASS_NAME, "ai-summary"
            ).text
            
            # Validate with DDTF
            validation_result = self.validate_ai_response(
                agent_id="search_assistant",
                response=ai_summary,
                test_category="search_relevance"
            )
            
            # Assert quality metrics
            assert validation_result['passRate'] >= 85, \
                f"Search quality {validation_result['passRate']}% below threshold"
            
            assert not validation_result['hasHallucination'], \
                "AI search results contain hallucinated information"
            
            print(f"✅ AI Search Quality: {validation_result['passRate']}%")
            
        finally:
            self.driver.quit()
    
    def validate_ai_response(self, agent_id, response, test_category):
        """Validate AI response using DDTF"""
        # Execute DDTF test
        payload = {
            "agentId": agent_id,
            "testIds": [f"{test_category}_001"],
            "customInput": response
        }
        
        response = requests.post(
            f"{self.ddtf_api}/execute",
            json=payload
        )
        run_id = response.json()['runId']
        
        # Wait for completion
        for _ in range(30):
            result = requests.get(f"{self.ddtf_api}/results/{run_id}")
            data = result.json()
            if data['status'] == 'completed':
                return data
            time.sleep(2)
        
        raise TimeoutError("DDTF validation timeout")

if __name__ == "__main__":
    test = AIFeatureTest()
    test.test_ai_search_quality()
```

## JavaScript + WebDriverIO + DDTF

```javascript
const { remote } = require('webdriverio');
const axios = require('axios');

describe('AI Chatbot E2E Tests', () => {
    let browser;
    const DDTF_API = 'http://localhost:3002/api/testing';
    
    before(async () => {
        browser = await remote({
            capabilities: { browserName: 'chrome' }
        });
    });
    
    after(async () => {
        await browser.deleteSession();
    });
    
    it('should validate chatbot response quality', async () => {
        // Navigate to chatbot
        await browser.url('https://myapp.com/support');
        
        // Send message to chatbot
        const chatInput = await browser.$('#chat-input');
        await chatInput.setValue('How do I reset my password?');
        
        const sendBtn = await browser.$('#send-btn');
        await sendBtn.click();
        
        // Wait for bot response
        await browser.waitUntil(
            async () => (await browser.$$('.bot-message')).length > 0,
            { timeout: 5000 }
        );
        
        const botMessage = await browser.$('.bot-message');
        const responseText = await botMessage.getText();
        
        // Validate with DDTF
        const validation = await validateWithDDTF({
            agentId: 'support_chatbot',
            response: responseText,
            testCategory: 'customer_support'
        });
        
        // Assertions
        expect(validation.passRate).toBeGreaterThanOrEqual(80);
        expect(validation.hasHallucination).toBe(false);
        expect(validation.responseTime).toBeLessThan(3000);
    });
    
    async function validateWithDDTF({ agentId, response, testCategory }) {
        // Execute DDTF test
        const { data } = await axios.post(`${DDTF_API}/execute`, {
            agentId,
            testIds: [`${testCategory}_quality`],
            customInput: response
        });
        
        const runId = data.runId;
        
        // Poll for results
        let attempts = 0;
        while (attempts < 30) {
            const result = await axios.get(`${DDTF_API}/results/${runId}`);
            if (result.data.status === 'completed') {
                return result.data;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
        }
        
        throw new Error('DDTF validation timeout');
    }
});
```

## Best Practices

1. **Separate Concerns**: Use Selenium for UI interactions, DDTF for AI validation
2. **Async Validation**: Run DDTF tests asynchronously to avoid blocking UI tests
3. **Quality Gates**: Fail tests if AI quality drops below threshold
4. **Screenshot on Failure**: Capture UI state when DDTF validation fails

## Example Test Flow

```
1. Selenium: Navigate to page
2. Selenium: Interact with AI feature
3. Selenium: Capture AI response
4. DDTF: Validate response quality
5. Selenium: Assert based on DDTF results
6. Selenium: Continue or fail test
```
