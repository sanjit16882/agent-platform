import { Request, Response } from 'express';
import { nlpProcessor } from '../services/nlp/NaturalLanguageProcessor';
import { configEditor, ConfigEditRequest, ConfigRefinementRequest } from '../services/nlp/ConfigEditor';
import { AgentConfig } from '../models/Agent';

export class NLPController {
  /**
   * Process natural language description and generate agent configuration
   */
  async processDescription(req: Request, res: Response): Promise<void> {
    try {
      const { description, options = {} } = req.body;

      if (!description || typeof description !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Description is required and must be a string',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      if (description.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'EMPTY_DESCRIPTION',
            message: 'Description cannot be empty',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const result = await nlpProcessor.processDescription(description, options);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('NLP processing error:', error);
      res.status(500).json({
        error: {
          code: 'NLP_PROCESSING_ERROR',
          message: error.message || 'Failed to process natural language description',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Parse natural language intent only
   */
  async parseIntent(req: Request, res: Response): Promise<void> {
    try {
      const { description } = req.body;

      if (!description || typeof description !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Description is required and must be a string',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const intent = await nlpProcessor.parseIntent(description);

      res.status(200).json({
        success: true,
        data: { intent },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Intent parsing error:', error);
      res.status(500).json({
        error: {
          code: 'INTENT_PARSING_ERROR',
          message: error.message || 'Failed to parse intent from description',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Generate agent configuration from parsed intent
   */
  async generateConfig(req: Request, res: Response): Promise<void> {
    try {
      const { intent } = req.body;

      if (!intent) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Intent is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const config = await nlpProcessor.generateConfig(intent);

      res.status(200).json({
        success: true,
        data: { config },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Config generation error:', error);
      res.status(500).json({
        error: {
          code: 'CONFIG_GENERATION_ERROR',
          message: error.message || 'Failed to generate configuration from intent',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Validate agent configuration
   */
  async validateConfig(req: Request, res: Response): Promise<void> {
    try {
      const { config } = req.body;

      if (!config) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Configuration is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const validation = await nlpProcessor.validateConfig(config as AgentConfig);

      res.status(200).json({
        success: true,
        data: { validation },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Config validation error:', error);
      res.status(500).json({
        error: {
          code: 'CONFIG_VALIDATION_ERROR',
          message: error.message || 'Failed to validate configuration',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get improvement suggestions for configuration
   */
  async getSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { config } = req.body;

      if (!config) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Configuration is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const suggestions = await nlpProcessor.suggestImprovements(config as AgentConfig);

      res.status(200).json({
        success: true,
        data: { suggestions },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Suggestions error:', error);
      res.status(500).json({
        error: {
          code: 'SUGGESTIONS_ERROR',
          message: error.message || 'Failed to generate suggestions',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Refine existing configuration with additional natural language input
   */
  async refineConfig(req: Request, res: Response): Promise<void> {
    try {
      const { config, refinementDescription } = req.body;

      if (!config || !refinementDescription) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Both configuration and refinement description are required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const refinedConfig = await nlpProcessor.refineConfig(
        config as AgentConfig, 
        refinementDescription
      );

      res.status(200).json({
        success: true,
        data: { config: refinedConfig },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Config refinement error:', error);
      res.status(500).json({
        error: {
          code: 'CONFIG_REFINEMENT_ERROR',
          message: error.message || 'Failed to refine configuration',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get examples of natural language descriptions
   */
  async getExamples(req: Request, res: Response): Promise<void> {
    try {
      const examples = nlpProcessor.getExamples();

      res.status(200).json({
        success: true,
        data: { examples },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Get examples error:', error);
      res.status(500).json({
        error: {
          code: 'GET_EXAMPLES_ERROR',
          message: error.message || 'Failed to get examples',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get supported actions and connectors
   */
  async getCapabilities(req: Request, res: Response): Promise<void> {
    try {
      const actions = nlpProcessor.getSupportedActions();
      const connectors = nlpProcessor.getSupportedConnectors();

      res.status(200).json({
        success: true,
        data: { 
          actions,
          connectors
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Get capabilities error:', error);
      res.status(500).json({
        error: {
          code: 'GET_CAPABILITIES_ERROR',
          message: error.message || 'Failed to get capabilities',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Edit agent configuration
   */
  async editConfig(req: Request, res: Response): Promise<void> {
    try {
      const { config, editRequest } = req.body;

      if (!config || !editRequest) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Both config and editRequest are required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const editedConfig = await configEditor.editConfig(config as AgentConfig, editRequest as ConfigEditRequest);
      const validation = await configEditor.validateConfigDetailed(editedConfig);

      res.status(200).json({
        success: true,
        data: { 
          config: editedConfig,
          validation
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Config edit error:', error);
      res.status(500).json({
        error: {
          code: 'CONFIG_EDIT_ERROR',
          message: error.message || 'Failed to edit configuration',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Refine configuration with natural language
   */
  async refineConfigAdvanced(req: Request, res: Response): Promise<void> {
    try {
      const { originalConfig, refinementDescription, preserveExisting = true } = req.body;

      if (!originalConfig || !refinementDescription) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Both originalConfig and refinementDescription are required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const refinementRequest: ConfigRefinementRequest = {
        originalConfig: originalConfig as AgentConfig,
        refinementDescription,
        preserveExisting
      };

      const refinedConfig = await configEditor.refineConfig(refinementRequest);
      const validation = await configEditor.validateConfigDetailed(refinedConfig);

      res.status(200).json({
        success: true,
        data: { 
          config: refinedConfig,
          validation
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Config refinement error:', error);
      res.status(500).json({
        error: {
          code: 'CONFIG_REFINEMENT_ERROR',
          message: error.message || 'Failed to refine configuration',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get configuration templates
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      
      const templates = category 
        ? configEditor.getTemplatesByCategory(category as string)
        : configEditor.getTemplates();

      res.status(200).json({
        success: true,
        data: { templates },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({
        error: {
          code: 'GET_TEMPLATES_ERROR',
          message: error.message || 'Failed to get templates',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Generate configuration from template
   */
  async generateFromTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId, customizations = {} } = req.body;

      if (!templateId) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Template ID is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const config = await configEditor.generateFromTemplate(templateId, customizations);
      const validation = await configEditor.validateConfigDetailed(config);

      res.status(200).json({
        success: true,
        data: { 
          config,
          validation
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Template generation error:', error);
      res.status(500).json({
        error: {
          code: 'TEMPLATE_GENERATION_ERROR',
          message: error.message || 'Failed to generate from template',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Validate configuration with detailed feedback
   */
  async validateConfigDetailed(req: Request, res: Response): Promise<void> {
    try {
      const { config } = req.body;

      if (!config) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Configuration is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const validation = await configEditor.validateConfigDetailed(config as AgentConfig);

      res.status(200).json({
        success: true,
        data: { validation },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } catch (error) {
      console.error('Detailed validation error:', error);
      res.status(500).json({
        error: {
          code: 'DETAILED_VALIDATION_ERROR',
          message: error.message || 'Failed to validate configuration',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
}

export const nlpController = new NLPController();