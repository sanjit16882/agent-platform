/**
 * AgentCatalog Endpoint Lock Test
 * 
 * This test ensures the critical S3 endpoint is not accidentally changed.
 * If this test fails, it means someone modified the endpoint and broke agent sync.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('AgentCatalog Endpoint Lock', () => {
  it('CRITICAL: Must use /api/v1/agents/s3 endpoint', () => {
    const filePath = join(__dirname, 'AgentCatalog.tsx');
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // Check that the correct endpoint is used
    expect(fileContent).toContain('/api/v1/agents/s3');
    
    // Ensure the wrong endpoint is NOT used
    const wrongEndpointPattern = /axios\.get\([^)]*\/api\/v1\/agents[^/s3)]/;
    expect(fileContent).not.toMatch(wrongEndpointPattern);
  });

  it('CRITICAL: Must map S3 agent format correctly', () => {
    const filePath = join(__dirname, 'AgentCatalog.tsx');
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // Check for S3-specific field mappings
    expect(fileContent).toContain('agent.metrics?.totalExecutions');
    expect(fileContent).toContain('agent.createdAt');
    expect(fileContent).toContain('agent.type || agent.agent_type');
  });

  it('CRITICAL: Must log S3 agent usage', () => {
    const filePath = join(__dirname, 'AgentCatalog.tsx');
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // Check for correct logging
    expect(fileContent).toContain('Using real S3 agents');
  });
});

/**
 * If any of these tests fail:
 * 
 * 1. STOP - Do not merge the changes
 * 2. READ - local_version/AGENT_COUNT_SYNC_FIX.md
 * 3. REVERT - The endpoint change
 * 4. TEST - Verify all pages show 15 agents
 * 5. DOCUMENT - Why you needed to change it
 * 
 * Contact: Platform Team before modifying
 */
