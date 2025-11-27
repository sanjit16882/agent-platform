# Agent Output Quality Improvements

## Problem
When testing the Code Review agent with a prompt like "Generate a Python function that calculates the factorial of a number", the agent produces:
- Explanatory text about how to calculate factorials
- Code mixed with documentation
- Not the clean, direct code output expected

## Root Cause
The agent's system prompt doesn't understand the **intent** of the request. It treats all inputs as "code to review" rather than recognizing different intents like:
- Code generation requests
- Code review requests  
- Code explanation requests
- Bug fixing requests

## Solution: Intent-Aware Prompting

### 1. Add Intent Detection Layer
Before invoking the agent, analyze the input to detect intent:

```javascript
function detectIntent(input) {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('generate') || lowerInput.includes('create') || lowerInput.includes('write')) {
    return 'code_generation';
  }
  if (lowerInput.includes('review') || lowerInput.includes('analyze') || lowerInput.includes('check')) {
    return 'code_review';
  }
  if (lowerInput.includes('explain') || lowerInput.includes('what does') || lowerInput.includes('how does')) {
    return 'code_explanation';
  }
  if (lowerInput.includes('fix') || lowerInput.includes('debug') || lowerInput.includes('error')) {
    return 'bug_fixing';
  }
  
  return 'general';
}
```

### 2. Intent-Specific System Prompts

**For Code Generation:**
```
You are a code generation assistant. When asked to generate code:
1. Provide ONLY the code, no explanations unless specifically requested
2. Include minimal inline comments for clarity
3. Follow best practices for the language
4. Make the code production-ready

Format: Return clean, executable code without markdown code blocks or explanatory text.
```

**For Code Review:**
```
You are a code review assistant. When reviewing code:
1. Identify issues, bugs, and improvements
2. Explain WHY each issue matters
3. Suggest specific fixes
4. Rate severity (critical/major/minor)

Format: Structured review with clear sections.
```

**For Code Explanation:**
```
You are a code explanation assistant. When explaining code:
1. Break down the logic step-by-step
2. Explain complex concepts in simple terms
3. Highlight key patterns and techniques
4. Provide context about why certain approaches are used

Format: Clear, educational explanation.
```

### 3. Implementation in bedrockService

Update `local_version/agent-hub-backend/src/services/bedrockService.js`:

```javascript
function buildSystemPrompt(agentType, intent, agentPurpose) {
  const basePrompts = {
    'code-quality': {
      'code_generation': `You are a ${agentPurpose || 'code generation'} assistant...`,
      'code_review': `You are a ${agentPurpose || 'code review'} assistant...`,
      'code_explanation': `You are a ${agentPurpose || 'code explanation'} assistant...`,
      'default': `You are a ${agentPurpose || 'code quality'} assistant...`
    },
    // ... other agent types
  };
  
  return basePrompts[agentType]?.[intent] || basePrompts[agentType]?.['default'] || 'You are a helpful assistant.';
}
```

### 4. Pass Agent Metadata

The agent's `purpose` and `capabilities` from S3 should be passed to the Bedrock service:

```javascript
async invokeAgent(agentId, input, options) {
  // Fetch agent metadata
  const agent = await this.getAgentMetadata(agentId);
  
  // Detect intent
  const intent = this.detectIntent(input);
  
  const context = {
    test_mode: true,
    agent_id: agentId,
    model_id: options.modelId,
    intent: intent,
    agent_purpose: agent.purpose,
    agent_capabilities: agent.capabilities,
    ...options.context
  };
  
  const response = await bedrockService.callBedrock(
    this.getAgentType(agentId),
    input,
    context
  );
  
  return response;
}
```

## Benefits

1. **Better Output Quality** - Agents produce output matching user intent
2. **Consistent Behavior** - Same agent can handle multiple use cases
3. **Improved Test Scores** - Tests will pass more reliably
4. **Better User Experience** - Users get what they expect

## Implementation Priority

1. **High Priority**: Add intent detection to testExecutionService
2. **High Priority**: Update bedrockService with intent-aware prompts
3. **Medium Priority**: Add agent metadata fetching
4. **Low Priority**: Fine-tune prompts based on test results

## Testing

After implementation, test with:
- "Generate a Python function for factorial" → Should return clean code
- "Review this code: [code]" → Should return structured review
- "Explain how this works: [code]" → Should return explanation
- "Fix the bug in: [code]" → Should return fixed code with explanation

## Files to Modify

1. `local_version/agent-hub-backend/services/testExecutionService.js`
   - Add `detectIntent()` method
   - Add `getAgentMetadata()` method
   - Update `invokeAgent()` to pass intent

2. `local_version/agent-hub-backend/src/services/bedrockService.js`
   - Add `buildSystemPrompt()` with intent support
   - Update `callBedrock()` to use intent-aware prompts

3. `local_version/agent-hub-backend/src/services/s3AgentService.js`
   - Ensure agent metadata (purpose, capabilities) is accessible
