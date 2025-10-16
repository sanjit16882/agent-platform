#!/usr/bin/env python3
"""
QE Failure Analysis Agent
Analyzes test failures and provides actionable insights for QE teams
"""

import os
import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai

app = FastAPI(title="QE Failure Analyzer", version="1.0.0")

class TestFailure(BaseModel):
    test_name: str
    error_message: str
    stack_trace: str
    test_file: str
    line_number: Optional[int] = None
    execution_time: Optional[float] = None

class AnalysisRequest(BaseModel):
    failures: List[TestFailure]
    test_framework: str = "jest"
    project_context: Optional[str] = None
    previous_runs: Optional[List[Dict]] = None

class FailureAnalysis(BaseModel):
    failure_category: str
    root_cause: str
    confidence_score: float
    suggested_fixes: List[str]
    related_failures: List[str]
    priority: str  # high, medium, low

class AnalysisResponse(BaseModel):
    summary: str
    total_failures: int
    categories: Dict[str, int]
    analyses: List[FailureAnalysis]
    recommendations: List[str]
    estimated_fix_time: str

class QEFailureAnalyzer:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY", "demo-key"))
        
    def categorize_failure(self, failure: TestFailure) -> str:
        """Categorize the type of test failure"""
        error_msg = failure.error_message.lower()
        stack_trace = failure.stack_trace.lower()
        
        # Pattern matching for common failure types
        if any(keyword in error_msg for keyword in ['timeout', 'timed out', 'exceeded']):
            return "timeout"
        elif any(keyword in error_msg for keyword in ['network', 'connection', 'fetch', 'request']):
            return "network"
        elif any(keyword in error_msg for keyword in ['assertion', 'expected', 'actual']):
            return "assertion"
        elif any(keyword in error_msg for keyword in ['null', 'undefined', 'reference']):
            return "null_reference"
        elif any(keyword in error_msg for keyword in ['permission', 'access', 'forbidden']):
            return "permission"
        elif any(keyword in stack_trace for keyword in ['async', 'promise', 'await']):
            return "async"
        else:
            return "unknown"
    
    def analyze_failure(self, failure: TestFailure, context: str = "") -> FailureAnalysis:
        """Analyze a single test failure"""
        category = self.categorize_failure(failure)
        
        # Generate analysis based on category
        analysis_map = {
            "timeout": {
                "root_cause": "Test execution exceeded time limit, likely due to slow operations or infinite loops",
                "suggested_fixes": [
                    "Increase timeout threshold for slow operations",
                    "Optimize database queries or API calls",
                    "Add proper wait conditions for async operations",
                    "Check for infinite loops in test logic"
                ],
                "confidence_score": 0.85,
                "priority": "high"
            },
            "network": {
                "root_cause": "Network-related failure, possibly due to API unavailability or connectivity issues",
                "suggested_fixes": [
                    "Add retry logic for network requests",
                    "Mock external API calls in tests",
                    "Verify test environment network configuration",
                    "Add proper error handling for network failures"
                ],
                "confidence_score": 0.80,
                "priority": "medium"
            },
            "assertion": {
                "root_cause": "Test assertion failed - actual result doesn't match expected outcome",
                "suggested_fixes": [
                    "Review test expectations and update if business logic changed",
                    "Check for race conditions in async operations",
                    "Verify test data setup and cleanup",
                    "Update test assertions to match current requirements"
                ],
                "confidence_score": 0.90,
                "priority": "high"
            },
            "null_reference": {
                "root_cause": "Null or undefined reference error, indicating missing data or improper initialization",
                "suggested_fixes": [
                    "Add null checks and proper error handling",
                    "Verify test data initialization",
                    "Check object lifecycle and cleanup",
                    "Add defensive programming practices"
                ],
                "confidence_score": 0.88,
                "priority": "high"
            },
            "async": {
                "root_cause": "Asynchronous operation handling issue, likely timing or promise resolution problems",
                "suggested_fixes": [
                    "Add proper await statements for async operations",
                    "Use waitFor or similar utilities for DOM updates",
                    "Check promise chain handling",
                    "Add timeout handling for async operations"
                ],
                "confidence_score": 0.82,
                "priority": "medium"
            }
        }
        
        analysis_data = analysis_map.get(category, {
            "root_cause": "Unknown failure type requiring manual investigation",
            "suggested_fixes": ["Manual code review required", "Check logs for additional context"],
            "confidence_score": 0.50,
            "priority": "medium"
        })
        
        return FailureAnalysis(
            failure_category=category,
            root_cause=analysis_data["root_cause"],
            confidence_score=analysis_data["confidence_score"],
            suggested_fixes=analysis_data["suggested_fixes"],
            related_failures=[],
            priority=analysis_data["priority"]
        )
    
    def generate_recommendations(self, analyses: List[FailureAnalysis]) -> List[str]:
        """Generate overall recommendations based on failure patterns"""
        categories = {}
        high_priority_count = 0
        
        for analysis in analyses:
            categories[analysis.failure_category] = categories.get(analysis.failure_category, 0) + 1
            if analysis.priority == "high":
                high_priority_count += 1
        
        recommendations = []
        
        # Pattern-based recommendations
        if categories.get("timeout", 0) > 2:
            recommendations.append("Consider implementing a comprehensive timeout strategy across your test suite")
        
        if categories.get("network", 0) > 1:
            recommendations.append("Implement network mocking to reduce test flakiness and improve reliability")
        
        if categories.get("assertion", 0) > 3:
            recommendations.append("Review and update test expectations - possible business logic changes detected")
        
        if high_priority_count > len(analyses) * 0.6:
            recommendations.append("High number of critical failures detected - consider immediate team review")
        
        if len(categories) > 4:
            recommendations.append("Diverse failure types suggest need for comprehensive test suite review")
        
        return recommendations or ["Continue monitoring test patterns and maintain good testing practices"]

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_failures(request: AnalysisRequest):
    """Main endpoint for analyzing test failures"""
    try:
        analyzer = QEFailureAnalyzer()
        analyses = []
        categories = {}
        
        # Analyze each failure
        for failure in request.failures:
            analysis = analyzer.analyze_failure(failure, request.project_context or "")
            analyses.append(analysis)
            
            # Count categories
            category = analysis.failure_category
            categories[category] = categories.get(category, 0) + 1
        
        # Generate recommendations
        recommendations = analyzer.generate_recommendations(analyses)
        
        # Calculate estimated fix time
        high_priority = sum(1 for a in analyses if a.priority == "high")
        medium_priority = sum(1 for a in analyses if a.priority == "medium")
        estimated_hours = (high_priority * 2) + (medium_priority * 1) + (len(analyses) - high_priority - medium_priority) * 0.5
        
        # Generate summary
        total_failures = len(request.failures)
        most_common_category = max(categories.items(), key=lambda x: x[1])[0] if categories else "unknown"
        
        summary = f"Analyzed {total_failures} test failures. Most common issue: {most_common_category.replace('_', ' ').title()}. "
        summary += f"Found {high_priority} high-priority issues requiring immediate attention."
        
        return AnalysisResponse(
            summary=summary,
            total_failures=total_failures,
            categories=categories,
            analyses=analyses,
            recommendations=recommendations,
            estimated_fix_time=f"{estimated_hours:.1f} hours"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent": "QE Failure Analyzer",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/info")
async def agent_info():
    """Agent information endpoint"""
    return {
        "name": "QE Failure Analyzer",
        "version": "1.0.0",
        "description": "Analyzes test failures and provides actionable insights for QE teams",
        "category": "qa",
        "framework": "openai",
        "capabilities": [
            "failure_categorization",
            "root_cause_analysis", 
            "fix_recommendations",
            "pattern_detection"
        ],
        "input_schema": {
            "failures": "array of test failure objects",
            "test_framework": "string (jest, pytest, etc.)",
            "project_context": "optional string"
        },
        "output_schema": {
            "summary": "string",
            "analyses": "array of failure analysis objects",
            "recommendations": "array of strings"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)