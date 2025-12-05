# DDTF Integration Guide

## Overview

DDTF (Data-Driven Testing Framework) is designed to integrate seamlessly with your existing testing ecosystem. This guide demonstrates how DDTF complements popular testing frameworks and test management tools.

## Integration Philosophy

DDTF follows a **"Test Orchestration"** approach:
- **Coexist** with existing test frameworks
- **Extend** your testing capabilities with AI-specific validations
- **Integrate** via REST API, CLI, and SDKs
- **Report** to standard formats (JUnit XML, TAP, Allure)

## Quick Integration Matrix

| Tool/Framework | Integration Type | Complexity | Documentation |
|----------------|------------------|------------|---------------|
| Robot Framework | API + Library | Low | [View](#robot-framework) |
| Selenium WebDriver | Side-by-Side | Low | [View](#selenium-webdriver) |
| Cypress | API Calls | Low | [View](#cypress) |
| JUnit | Maven Plugin | Medium | [View](#junit) |
| Pytest | Plugin | Medium | [View](#pytest) |
| TestRail | Webhook + API | Medium | [View](#testrail) |
| Xray (Jira) | REST API | Medium | [View](#xray-jira) |
| qTest | API Integration | Medium | [View](#qtest) |

## Integration Approaches

### 1. Side-by-Side Execution
Run DDTF tests alongside your existing tests in CI/CD pipelines.

### 2. API Integration
Call DDTF REST API from any test framework.

### 3. CLI Integration
Execute DDTF tests via command-line interface.

### 4. SDK Integration
Use JavaScript/TypeScript SDK for programmatic access.

### 5. Plugin/Library
Framework-specific wrappers for native integration.

---

*See detailed integration guides in the following sections.*
