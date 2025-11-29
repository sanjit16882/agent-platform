# Cost Display Locations in HybridAgentBuilder UI

## 📍 Where to Display Cost Information

### Location 1: Agent Configuration Card (PRIMARY - Most Visible)
**File**: `HybridAgentBuilder.tsx`
**Line**: After line ~1090 (after Agent Configuration card)

**Visual Location**:
```
┌─────────────────────────────────────────────────────────┐
│ Agent Configuration                                     │
├─────────────────────────────────────────────────────────┤
│ Agent Name: [___________]  Orchestration: [Sequential]  │
│ Description: [_____________________________________]     │
│ Bedrock Model: [Claude 3.5 Sonnet]                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐  ← ADD HERE
│ 💰 Cost & Performance Estimation                        │
├─────────────────────────────────────────────────────────┤
│ Cost Breakdown (per 1000 queries):                      │
│   Bedrock Model (Claude 3.5 Sonnet):        $3.000     │
│   Vector DB (RAG):                          $0.250     │
│   MCP Tools (2 servers):                    $0.100     │
│   ─────────────────────────────────────────────────     │
│   Total:                                    $3.350     │
│                                                          │
│ Performance:                                             │
│   Average Latency:                          800ms       │
│                                                          │
│ 💡 Tip: Disable Vector DB or MCP if not needed         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Choose from Templates                                    │
└─────────────────────────────────────────────────────────┘
```

**Code to Add**:
```typescript
{/* Cost & Performance Estimation Card - ADD AFTER Agent Configuration */}
<div className="aws-card mb-4" style={{ borderLeft: '4px solid #f59e0b' }}>
  <div className="aws-card-header" style={{ backgroundColor: '#fffbeb' }}>
    <strong>💰 Cost & Performance Estimation</strong>
  </div>
  <div className="aws-card-body">
    <Row>
      <Col md={8}>
        <h6 className="mb-3">Cost Breakdown (per 1000 queries)</h6>
        
        {/* Bedrock Cost */}
        <div className="d-flex justify-content-between mb-2">
          <span>
            Bedrock Model 
            {selectedBedrockModelName && (
              <small className="text-muted"> ({selectedBedrockModelName})</small>
            )}:
          </span>
          <strong>${getBedrockCost().toFixed(3)}</strong>
        </div>
        
        {/* Vector DB Cost */}
        {vectorDBConfig.enabled && (
          <div className="d-flex justify-content-between mb-2">
            <span>
              Vector DB (RAG)
              <small className="text-muted"> ({vectorDBConfig.knowledgeBases.length} knowledge bases)</small>:
            </span>
            <strong className="text-warning">${vectorDBCost.toFixed(3)}</strong>
          </div>
        )}
        
        {/* MCP Cost */}
        {mcpConfig.enabled && mcpConfig.selectedServers.length > 0 && (
          <div className="d-flex justify-content-between mb-2">
            <span>
              MCP Tools
              <small className="text-muted"> ({mcpConfig.selectedServers.length} servers)</small>:
            </span>
            <strong className="text-info">${getMCPCost().toFixed(3)}</strong>
          </div>
        )}
        
        <hr />
        
        {/* Total Cost */}
        <div className="d-flex justify-content-between">
          <strong style={{ fontSize: '1.1em' }}>Total:</strong>
          <strong className="text-primary" style={{ fontSize: '1.3em' }}>
            ${calculateTotalCost().toFixed(2)}
          </strong>
        </div>
      </Col>
      
      <Col md={4}>
        <h6 className="mb-3">Performance</h6>
        <div className="text-center p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#0066cc' }}>
            {calculateTotalLatency()}ms
          </div>
          <small className="text-muted">Average Latency</small>
        </div>
      </Col>
    </Row>
    
    <Alert variant="info" className="mt-3 mb-0" style={{ fontSize: '0.9em' }}>
      <strong>💡 Cost Optimization Tips:</strong>
      <ul className="mb-0 mt-2">
        <li>Use Claude Haiku ($0.25) instead of Sonnet ($3.00) for simple tasks</li>
        {vectorDBConfig.enabled && <li>Disable Vector DB if knowledge base search isn't needed</li>}
        {mcpConfig.enabled && <li>Reduce MCP servers to only those required</li>}
      </ul>
    </Alert>
  </div>
</div>
```

---

### Location 2: Agent Summary (SECONDARY - Validation Tab)
**File**: `HybridAgentBuilder.tsx`
**Line**: ~1427 (in Agent Summary section)

**Visual Location**:
```
┌─────────────────────────────────────────────────────────┐
│ ✅ Agent Validation                    [Run Validation] │
├─────────────────────────────────────────────────────────┤
│ ✅ Validation Passed                                    │
│                                                          │
│ Agent Summary:                                           │
│   • Components: 3                                        │
│   • Connections: 2                                       │
│   • Estimated Runtime: 45s                               │
│   • Resource Usage: {...}                                │
│   • 💰 Estimated Cost: $3.35 per 1000 queries  ← ADD    │
│   • ⚡ Estimated Latency: 800ms                ← ADD    │
└─────────────────────────────────────────────────────────┘
```

**Code to Add**:
```typescript
{validationResults.isValid && (
  <div>
    <h6>Agent Summary:</h6>
    <ul>
      <li>Components: {components.length}</li>
      <li>Connections: {connections.length}</li>
      <li>Estimated Runtime: {agentCompositionService.estimateExecutionTime(components.map(c => c.component))}s</li>
      <li>Resource Usage: {JSON.stringify(agentCompositionService.estimateResourceUsage(components.map(c => c.component)))}</li>
      
      {/* ADD THESE TWO LINES */}
      <li>💰 Estimated Cost: <strong>${calculateTotalCost().toFixed(2)}</strong> per 1000 queries</li>
      <li>⚡ Estimated Latency: <strong>{calculateTotalLatency()}ms</strong> average</li>
    </ul>
  </div>
)}
```

---

### Location 3: Header Badge (TERTIARY - Always Visible)
**File**: `HybridAgentBuilder.tsx`
**Line**: ~945 (in header section)

**Visual Location**:
```
┌─────────────────────────────────────────────────────────┐
│ Hybrid Agent Builder                                     │
│ Create multi-domain agents...                            │
│                                                          │
│ [Components: 3] [Cost: $3.35/1K] ← ADD  [Save Agent]   │
└─────────────────────────────────────────────────────────┘
```

**Code to Add**:
```typescript
<div>
  <Badge bg="primary" className="me-2">
    Components: {components.length}
  </Badge>
  
  {/* ADD THIS BADGE */}
  {(vectorDBConfig.enabled || mcpConfig.enabled || selectedBedrockModel) && (
    <Badge bg="warning" text="dark" className="me-2">
      💰 ${calculateTotalCost().toFixed(2)}/1K queries
    </Badge>
  )}
  
  <Button variant="outline-primary" className="me-2" onClick={() => setShowTemplateModal(true)}>
    Add Component
  </Button>
  ...
</div>
```

---

### Location 4: Real-time Updates in Tabs (INTERACTIVE)

#### In Vector DB Tab:
**Visual Location**:
```
┌─────────────────────────────────────────────────────────┐
│ Knowledge Base (RAG)                                     │
├─────────────────────────────────────────────────────────┤
│ [✓] Enable Vector DB                                    │
│                                                          │
│ Provider: [OpenSearch ▼]                                │
│ Knowledge Bases: [Select...]                            │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💰 Cost Impact: +$0.25 per 1000 queries            │ │  ← ADD
│ │ ⚡ Latency Impact: +200ms                           │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Code to Add** (in VectorDBConfigSection.tsx):
```typescript
{config.enabled && (
  <Alert variant="warning" className="mt-3">
    <div className="d-flex justify-content-between">
      <div>
        <strong>💰 Cost Impact:</strong> +${cost.toFixed(2)} per 1000 queries
      </div>
      <div>
        <strong>⚡ Latency Impact:</strong> +{latency}ms
      </div>
    </div>
  </Alert>
)}
```

#### In MCP Tab:
**Visual Location**:
```
┌─────────────────────────────────────────────────────────┐
│ MCP Integration                                          │
├─────────────────────────────────────────────────────────┤
│ [✓] Enable MCP Tools                                    │
│                                                          │
│ Selected Servers:                                        │
│   [✓] GitHub MCP Server                                 │
│   [✓] Slack MCP Server                                  │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💰 Cost Impact: +$0.10 per 1000 queries            │ │  ← ADD
│ │    ($0.05 per server × 2 servers)                  │ │
│ │ ⚡ Latency Impact: +200ms                           │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Code to Add** (in MCPAgentCreationStep.tsx):
```typescript
{config.enabled && config.selectedServers.length > 0 && (
  <Alert variant="info" className="mt-3">
    <div className="d-flex justify-content-between">
      <div>
        <strong>💰 Cost Impact:</strong> +${(0.05 * config.selectedServers.length).toFixed(2)} per 1000 queries
        <br />
        <small className="text-muted">($0.05 per server × {config.selectedServers.length} servers)</small>
      </div>
      <div>
        <strong>⚡ Latency Impact:</strong> +{100 * config.selectedServers.length}ms
      </div>
    </div>
  </Alert>
)}
```

---

## 🎯 Recommended Implementation Order

### Phase 1: Quick Win (30 minutes)
**Add to Agent Summary** (Location 2)
- Just 2 lines of code
- Satisfies spec requirement
- Visible during validation

### Phase 2: Primary Display (1 hour)
**Add Cost Card** (Location 1)
- Most visible location
- Detailed breakdown
- Always visible

### Phase 3: Real-time Feedback (1 hour)
**Add to Vector DB and MCP tabs** (Location 4)
- Shows impact when toggling
- Helps users make decisions
- Interactive feedback

### Phase 4: Polish (30 minutes)
**Add Header Badge** (Location 3)
- Always visible
- Quick reference
- Professional look

---

## 📊 Visual Mockup

Here's what the final UI would look like:

```
┌──────────────────────────────────────────────────────────────────┐
│ Hybrid Agent Builder                                              │
│ Create multi-domain agents...                                     │
│                                                                    │
│ [Components: 3] [💰 $3.35/1K] [Add Component] [Save Agent]       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ Agent Configuration                                               │
├──────────────────────────────────────────────────────────────────┤
│ Name: [Customer Support Agent]  Mode: [Sequential ▼]            │
│ Description: [Handles customer inquiries...]                      │
│ Model: [Claude 3.5 Sonnet ▼]                                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 💰 Cost & Performance Estimation                                 │
├──────────────────────────────────────────────────────────────────┤
│ Cost Breakdown (per 1000 queries):          Performance:         │
│   Bedrock Model (Claude 3.5):    $3.000        ┌──────────┐     │
│   Vector DB (RAG):                $0.250        │  800ms   │     │
│   MCP Tools (2 servers):          $0.100        │ Latency  │     │
│   ────────────────────────────────────          └──────────┘     │
│   Total:                          $3.350                          │
│                                                                    │
│ 💡 Tips: Use Haiku for simple tasks, disable unused features     │
└──────────────────────────────────────────────────────────────────┘

[Design] [Knowledge Base (RAG)] [MCP Integration] [Test & Validate]
```

---

## 🔧 Helper Functions Needed

Add these functions to HybridAgentBuilder.tsx:

```typescript
// Calculate Bedrock cost based on selected model
const getBedrockCost = (): number => {
  if (!selectedBedrockModel) return 0;
  
  if (selectedBedrockModel.includes('haiku')) return 0.25;
  if (selectedBedrockModel.includes('sonnet-3-5')) return 3.00;
  if (selectedBedrockModel.includes('sonnet')) return 15.00;
  if (selectedBedrockModel.includes('opus')) return 75.00;
  
  return 1.00; // Default
};

// Calculate MCP cost based on selected servers
const getMCPCost = (): number => {
  if (!mcpConfig.enabled || mcpConfig.selectedServers.length === 0) return 0;
  return 0.05 * mcpConfig.selectedServers.length;
};

// Calculate total cost
const calculateTotalCost = (): number => {
  return getBedrockCost() + vectorDBCost + getMCPCost();
};

// Calculate total latency
const calculateTotalLatency = (): number => {
  let total = 500; // Base Bedrock latency
  
  if (vectorDBConfig.enabled) {
    total += vectorDBLatency;
  }
  
  if (mcpConfig.enabled && mcpConfig.selectedServers.length > 0) {
    total += 100 * mcpConfig.selectedServers.length;
  }
  
  return total;
};
```

---

## 🎯 Summary

**Where to display cost:**
1. ✅ **Primary**: Cost Card after Agent Configuration (most visible)
2. ✅ **Secondary**: Agent Summary in validation tab
3. ✅ **Tertiary**: Header badge (always visible)
4. ✅ **Interactive**: Real-time updates in Vector DB and MCP tabs

**Total effort**: ~3 hours for all locations

**Quick win**: Just add to Agent Summary (30 minutes)

Want me to implement these changes? 🚀
