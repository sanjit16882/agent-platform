/**
 * Request Validation Schemas
 * Validates all incoming requests to catch breaking changes early
 */

import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string;
  message: string;
}

export class RequestValidator {
  static validateAgentExecution(req: Request, res: Response, next: NextFunction): void {
    const errors: ValidationError[] = [];
    const { taskDescription, inputs, context } = req.body;

    // Validate taskDescription
    if (!taskDescription || typeof taskDescription !== 'string') {
      errors.push({
        field: 'taskDescription',
        message: 'taskDescription is required and must be a string'
      });
    } else if (taskDescription.trim().length === 0) {
      errors.push({
        field: 'taskDescription',
        message: 'taskDescription cannot be empty'
      });
    }

    // Validate inputs
    if (!inputs || typeof inputs !== 'object') {
      errors.push({
        field: 'inputs',
        message: 'inputs is required and must be an object'
      });
    }

    // Validate context
    if (!context || typeof context !== 'object') {
      errors.push({
        field: 'context',
        message: 'context is required and must be an object'
      });
    } else {
      if (!context.executionMode || typeof context.executionMode !== 'string') {
        errors.push({
          field: 'context.executionMode',
          message: 'context.executionMode is required and must be a string'
        });
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    next();
  }

  static validateHybridAgentCreation(req: Request, res: Response, next: NextFunction): void {
    const errors: ValidationError[] = [];
    const { name, description, category } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'name is required and must be a non-empty string'
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'description is required and must be a non-empty string'
      });
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      errors.push({
        field: 'category',
        message: 'category is required and must be a non-empty string'
      });
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    next();
  }

  static validateAgentId(req: Request, res: Response, next: NextFunction): void {
    const { agentId } = req.params;

    if (!agentId || typeof agentId !== 'string' || agentId.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid agentId parameter'
      });
      return;
    }

    next();
  }

  static validateAPIKeyRequest(req: Request, res: Response, next: NextFunction): void {
    const errors: ValidationError[] = [];
    const { name, permissions, userId } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'name is required and must be a non-empty string'
      });
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      errors.push({
        field: 'permissions',
        message: 'permissions is required and must be a non-empty array'
      });
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      errors.push({
        field: 'userId',
        message: 'userId is required and must be a non-empty string'
      });
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    next();
  }
}
