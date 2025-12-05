# JUnit Integration

## Overview

Integrate DDTF with JUnit for Java-based AI agent testing.

## Maven Dependency

**pom.xml:**
```xml
<dependencies>
    <!-- JUnit 5 -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.9.0</version>
        <scope>test</scope>
    </dependency>
    
    <!-- DDTF Java Client -->
    <dependency>
        <groupId>com.agenthub</groupId>
        <artifactId>ddtf-client</artifactId>
        <version>1.0.0</version>
        <scope>test</scope>
    </dependency>
    
    <!-- HTTP Client -->
    <dependency>
        <groupId>com.squareup.okhttp3</groupId>
        <artifactId>okhttp</artifactId>
        <version>4.10.0</version>
    </dependency>
</dependencies>
```

## DDTF Client Wrapper

**DDTFClient.java:**
```java
package com.agenthub.testing;

import okhttp3.*;
import com.google.gson.*;
import java.io.IOException;
import java.util.*;

public class DDTFClient {
    
    private final String apiUrl;
    private final OkHttpClient client;
    private final Gson gson;
    
    public DDTFClient(String apiUrl) {
        this.apiUrl = apiUrl;
        this.client = new OkHttpClient();
        this.gson = new Gson();
    }
    
    public TestRun executeTest(TestRequest request) throws IOException {
        String json = gson.toJson(request);
        
        RequestBody body = RequestBody.create(
            json, MediaType.get("application/json")
        );
        
        Request httpRequest = new Request.Builder()
            .url(apiUrl + "/api/testing/execute")
            .post(body)
            .build();
        
        try (Response response = client.newCall(httpRequest).execute()) {
            String responseBody = response.body().string();
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);
            
            String runId = jsonResponse.get("runId").getAsString();
            return waitForCompletion(runId);
        }
    }
    
    private TestRun waitForCompletion(String runId) throws IOException {
        int maxAttempts = 60;
        int attempt = 0;
        
        while (attempt < maxAttempts) {
            Request request = new Request.Builder()
                .url(apiUrl + "/api/testing/results/" + runId)
                .get()
                .build();
            
            try (Response response = client.newCall(request).execute()) {
                String body = response.body().string();
                TestRun testRun = gson.fromJson(body, TestRun.class);
                
                if ("completed".equals(testRun.getStatus())) {
                    return testRun;
                }
            }
            
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Test execution interrupted", e);
            }
            
            attempt++;
        }
        
        throw new RuntimeException("Test execution timeout");
    }
}
```


## JUnit Test Examples

**AIAgentTest.java:**
```java
package com.myapp.tests;

import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import com.agenthub.testing.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class AIAgentTest {
    
    private DDTFClient ddtfClient;
    
    @BeforeAll
    public void setup() {
        ddtfClient = new DDTFClient("http://localhost:3002");
    }
    
    @Test
    @DisplayName("Chatbot should pass quality threshold")
    public void testChatbotQuality() throws Exception {
        // Arrange
        TestRequest request = TestRequest.builder()
            .agentId("chatbot_support")
            .testIds(Arrays.asList("accuracy_check", "hallucination_check"))
            .models(Arrays.asList("claude-3-5-sonnet"))
            .build();
        
        // Act
        TestRun result = ddtfClient.executeTest(request);
        
        // Assert
        assertTrue(result.getPassRate() >= 80, 
            "Chatbot quality below threshold: " + result.getPassRate() + "%");
        assertFalse(result.hasHallucination(), 
            "Hallucination detected in chatbot responses");
        assertEquals("completed", result.getStatus());
    }
    
    @Test
    @DisplayName("Search agent should provide relevant results")
    public void testSearchRelevance() throws Exception {
        TestRequest request = TestRequest.builder()
            .agentId("search_assistant")
            .testIds(Arrays.asList("relevance_check"))
            .customInput("best laptop for programming")
            .build();
        
        TestRun result = ddtfClient.executeTest(request);
        
        assertTrue(result.getPassRate() >= 75);
        assertTrue(result.getAverageScore() >= 70);
    }
    
    @Test
    @DisplayName("Content generator should meet quality standards")
    public void testContentQuality() throws Exception {
        TestRequest request = TestRequest.builder()
            .agentId("content_generator")
            .testIds(Arrays.asList("quality_check", "coherence_check"))
            .build();
        
        TestRun result = ddtfClient.executeTest(request);
        
        assertAll("Content Quality Checks",
            () -> assertTrue(result.getPassRate() >= 80),
            () -> assertFalse(result.hasHallucination()),
            () -> assertTrue(result.getQualityMetrics().getCoherence() >= 75)
        );
    }
    
    @RepeatedTest(5)
    @DisplayName("Agent should consistently pass quality checks")
    public void testConsistentQuality(RepetitionInfo repetitionInfo) throws Exception {
        TestRequest request = TestRequest.builder()
            .agentId("chatbot_support")
            .testIds(Arrays.asList("consistency_check"))
            .build();
        
        TestRun result = ddtfClient.executeTest(request);
        
        assertTrue(result.getPassRate() >= 75,
            "Iteration " + repetitionInfo.getCurrentRepetition() + " failed");
    }
}
```

## Parameterized Tests

```java
@ParameterizedTest
@CsvSource({
    "chatbot_support, 80",
    "search_assistant, 75",
    "content_generator, 85"
})
@DisplayName("All agents should meet minimum quality thresholds")
public void testMultipleAgents(String agentId, int minPassRate) throws Exception {
    TestRequest request = TestRequest.builder()
        .agentId(agentId)
        .testIds(Arrays.asList("quality_check"))
        .build();
    
    TestRun result = ddtfClient.executeTest(request);
    
    assertTrue(result.getPassRate() >= minPassRate,
        agentId + " quality below threshold: " + result.getPassRate() + "%");
}
```

## Test Suite

```java
@Suite
@SelectClasses({
    AIAgentTest.class,
    ChatbotQualityTest.class,
    SearchRelevanceTest.class
})
public class AITestSuite {
    // Test suite configuration
}
```

## Maven Surefire Configuration

**pom.xml:**
```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.0.0-M7</version>
            <configuration>
                <includes>
                    <include>**/*Test.java</include>
                </includes>
                <systemPropertyVariables>
                    <ddtf.api.url>http://localhost:3002</ddtf.api.url>
                    <ddtf.api.key>${env.DDTF_API_KEY}</ddtf.api.key>
                </systemPropertyVariables>
            </configuration>
        </plugin>
    </plugins>
</build>
```

## CI/CD Integration

**Jenkinsfile:**
```groovy
pipeline {
    agent any
    
    tools {
        maven 'Maven 3.8'
        jdk 'JDK 17'
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh 'mvn test -Dtest=*UnitTest'
            }
        }
        
        stage('AI Quality Tests') {
            steps {
                sh 'mvn test -Dtest=*AIAgentTest'
            }
        }
    }
    
    post {
        always {
            junit '**/target/surefire-reports/*.xml'
        }
    }
}
```

## Best Practices

1. **Test Organization**: Separate AI tests from unit/integration tests
2. **Timeouts**: Set appropriate timeouts for AI test execution
3. **Retry Logic**: Implement retry for transient failures
4. **Parallel Execution**: Use JUnit's parallel execution for faster tests
5. **Quality Gates**: Fail builds if AI quality drops below threshold
