/**
 * Result Aggregator
 * 
 * Aggregates test results across dimensions and models
 * Calculates overall scores, grades, and generates insights
 */

class ResultAggregator {
  constructor(db) {
    this.db = db;
  }

  /**
   * Aggregate results from multiple models and dimensions
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {Array} modelResults - Results for each model
   * @param {Array} dimensions - Dimension configurations
   * @returns {Promise<object>} - Aggregated results
   */
  async aggregate(runId, agentId, modelResults, dimensions) {
    // If single model, return simple aggregation
    if (modelResults.length === 1) {
      return this.aggregateSingleModel(runId, agentId, modelResults[0], dimensions);
    }

    // If multiple models, return comparison
    return this.aggregateModelComparison(runId, agentId, modelResults, dimensions);
  }

  /**
   * Aggregate results for a single model
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {object} modelResult - Model result
   * @param {Array} dimensions - Dimension configurations
   * @returns {object} - Aggregated result
   */
  aggregateSingleModel(runId, agentId, modelResult, dimensions) {
    const { model, dimensions: dimensionResults } = modelResult;

    // Calculate dimension scores
    const dimensionScores = dimensionResults.map(dr => ({
      dimension: dr.dimension,
      score: dr.score || 0,
      weight: dr.weight,
      status: dr.status,
      passed: dr.passed || 0,
      failed: dr.failed || 0,
      total: dr.total || 0,
      passRate: dr.total > 0 ? (dr.passed / dr.total) * 100 : 0
    }));

    // Calculate weighted overall score
    const overallScore = this.calculateWeightedScore(dimensionScores);

    // Determine grade
    const grade = this.calculateGrade(overallScore);

    // Calculate totals
    const totalTests = dimensionScores.reduce((sum, ds) => sum + ds.total, 0);
    const totalPassed = dimensionScores.reduce((sum, ds) => sum + ds.passed, 0);
    const totalFailed = dimensionScores.reduce((sum, ds) => sum + ds.failed, 0);
    const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    // Generate insights
    const insights = this.generateInsights(dimensionScores, overallScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(dimensionScores);

    const summary = {
      model,
      overallScore: Math.round(overallScore * 100) / 100,
      grade,
      totalTests,
      passed: totalPassed,
      failed: totalFailed,
      passRate: Math.round(passRate * 100) / 100,
      dimensionScores,
      insights,
      recommendations
    };

    return {
      summary,
      dimensions: dimensionResults,
      modelComparison: null
    };
  }

  /**
   * Aggregate results for model comparison
   * @param {string} runId - Test run ID
   * @param {string} agentId - Agent ID
   * @param {Array} modelResults - Results for each model
   * @param {Array} dimensions - Dimension configurations
   * @returns {object} - Aggregated comparison
   */
  aggregateModelComparison(runId, agentId, modelResults, dimensions) {
    const modelSummaries = modelResults.map(mr => {
      const result = this.aggregateSingleModel(runId, agentId, mr, dimensions);
      return result.summary;
    });

    // Determine winners for each metric
    const winners = this.determineWinners(modelSummaries);

    // Generate comparison insights
    const comparisonInsights = this.generateComparisonInsights(modelSummaries, winners);

    // Determine overall recommendation
    const recommendation = this.determineRecommendation(modelSummaries, winners);

    // Calculate overall summary (best model)
    const bestModel = modelSummaries.find(ms => ms.model === winners.overall);

    const summary = {
      ...bestModel,
      modelComparison: {
        modelsCompared: modelSummaries.length,
        models: modelSummaries.map(ms => ms.model),
        winners,
        recommendation
      }
    };

    return {
      summary,
      modelComparison: {
        models: modelSummaries,
        winners,
        insights: comparisonInsights,
        recommendation
      },
      dimensions: modelResults.map(mr => mr.dimensions)
    };
  }

  /**
   * Calculate weighted score from dimension scores
   * @param {Array} dimensionScores - Dimension scores with weights
   * @returns {number} - Weighted score (0-100)
   */
  calculateWeightedScore(dimensionScores) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const ds of dimensionScores) {
      if (ds.status === 'completed') {
        weightedSum += ds.score * ds.weight;
        totalWeight += ds.weight;
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate grade from score
   * @param {number} score - Score (0-100)
   * @returns {string} - Grade (A+, A, B, C, D, F)
   */
  calculateGrade(score) {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate insights from dimension scores
   * @param {Array} dimensionScores - Dimension scores
   * @param {number} overallScore - Overall score
   * @returns {Array} - Insights
   */
  generateInsights(dimensionScores, overallScore) {
    const insights = [];

    // Overall performance insight
    if (overallScore >= 95) {
      insights.push('Excellent performance across all dimensions');
    } else if (overallScore >= 85) {
      insights.push('Good performance with room for improvement');
    } else if (overallScore >= 70) {
      insights.push('Acceptable performance but needs attention');
    } else {
      insights.push('Performance below acceptable threshold');
    }

    // Dimension-specific insights
    const weakDimensions = dimensionScores
      .filter(ds => ds.status === 'completed' && ds.score < 80)
      .sort((a, b) => a.score - b.score);

    if (weakDimensions.length > 0) {
      const weakest = weakDimensions[0];
      insights.push(`${weakest.dimension} needs improvement (${Math.round(weakest.score)}%)`);
    }

    const strongDimensions = dimensionScores
      .filter(ds => ds.status === 'completed' && ds.score >= 95)
      .sort((a, b) => b.score - a.score);

    if (strongDimensions.length > 0) {
      insights.push(`Strong performance in ${strongDimensions.map(d => d.dimension).join(', ')}`);
    }

    return insights;
  }

  /**
   * Generate recommendations from dimension scores
   * @param {Array} dimensionScores - Dimension scores
   * @returns {Array} - Recommendations
   */
  generateRecommendations(dimensionScores) {
    const recommendations = [];

    // Check each dimension for issues
    for (const ds of dimensionScores) {
      if (ds.status === 'completed' && ds.score < 70) {
        recommendations.push({
          dimension: ds.dimension,
          priority: 'high',
          message: `Critical: ${ds.dimension} score is ${Math.round(ds.score)}%. Immediate attention required.`
        });
      } else if (ds.status === 'completed' && ds.score < 85) {
        recommendations.push({
          dimension: ds.dimension,
          priority: 'medium',
          message: `${ds.dimension} could be improved (currently ${Math.round(ds.score)}%)`
        });
      }

      if (ds.status === 'error') {
        recommendations.push({
          dimension: ds.dimension,
          priority: 'high',
          message: `${ds.dimension} tests failed to execute. Check configuration.`
        });
      }
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        dimension: 'Overall',
        priority: 'low',
        message: 'Agent is performing well. Continue monitoring.'
      });
    }

    return recommendations;
  }

  /**
   * Determine winners for each metric across models
   * @param {Array} modelSummaries - Model summaries
   * @returns {object} - Winners
   */
  determineWinners(modelSummaries) {
    const winners = {
      overall: null,
      accuracy: null,
      performance: null,
      value: null,
      dimensions: {}
    };

    // Overall winner (highest overall score)
    const sortedByScore = [...modelSummaries].sort((a, b) => b.overallScore - a.overallScore);
    winners.overall = sortedByScore[0].model;

    // Accuracy winner (highest pass rate)
    const sortedByPassRate = [...modelSummaries].sort((a, b) => b.passRate - a.passRate);
    winners.accuracy = sortedByPassRate[0].model;

    // Performance winner (fastest - would need latency data)
    // For now, use same as accuracy
    winners.performance = sortedByPassRate[0].model;

    // Value winner (best score per cost - simplified)
    // For demo, use model with good score and lower cost
    const haiku = modelSummaries.find(ms => ms.model.includes('haiku'));
    const sonnet = modelSummaries.find(ms => ms.model.includes('sonnet'));
    
    if (haiku && sonnet) {
      // If Haiku is within 10% of Sonnet, it's better value
      if (haiku.overallScore >= sonnet.overallScore * 0.9) {
        winners.value = haiku.model;
      } else {
        winners.value = sonnet.model;
      }
    } else {
      winners.value = sortedByScore[0].model;
    }

    // Dimension winners
    if (modelSummaries[0].dimensionScores) {
      const dimensionNames = modelSummaries[0].dimensionScores.map(ds => ds.dimension);
      
      for (const dimName of dimensionNames) {
        const bestForDim = modelSummaries
          .map(ms => ({
            model: ms.model,
            score: ms.dimensionScores.find(ds => ds.dimension === dimName)?.score || 0
          }))
          .sort((a, b) => b.score - a.score)[0];
        
        winners.dimensions[dimName] = bestForDim.model;
      }
    }

    return winners;
  }

  /**
   * Generate comparison insights
   * @param {Array} modelSummaries - Model summaries
   * @param {object} winners - Winners
   * @returns {Array} - Comparison insights
   */
  generateComparisonInsights(modelSummaries, winners) {
    const insights = [];

    const winnerModel = modelSummaries.find(ms => ms.model === winners.overall);
    const otherModels = modelSummaries.filter(ms => ms.model !== winners.overall);

    if (winnerModel && otherModels.length > 0) {
      const avgOtherScore = otherModels.reduce((sum, ms) => sum + ms.overallScore, 0) / otherModels.length;
      const scoreDiff = winnerModel.overallScore - avgOtherScore;

      if (scoreDiff > 10) {
        insights.push(`${winnerModel.model} significantly outperforms other models (+${Math.round(scoreDiff)}%)`);
      } else if (scoreDiff > 5) {
        insights.push(`${winnerModel.model} performs better than other models (+${Math.round(scoreDiff)}%)`);
      } else {
        insights.push(`Models show similar performance (within ${Math.round(scoreDiff)}%)`);
      }
    }

    // Value insight
    if (winners.value !== winners.overall) {
      const valueModel = modelSummaries.find(ms => ms.model === winners.value);
      insights.push(`${valueModel.model} offers best value (${Math.round(valueModel.overallScore)}% at lower cost)`);
    }

    return insights;
  }

  /**
   * Determine overall recommendation
   * @param {Array} modelSummaries - Model summaries
   * @param {object} winners - Winners
   * @returns {object} - Recommendation
   */
  determineRecommendation(modelSummaries, winners) {
    const winnerModel = modelSummaries.find(ms => ms.model === winners.overall);
    const valueModel = modelSummaries.find(ms => ms.model === winners.value);

    let recommendation = {
      model: winners.overall,
      reason: 'Best overall performance',
      confidence: 'high'
    };

    // If value model is close in performance, recommend it
    if (valueModel && valueModel.model !== winnerModel.model) {
      const scoreDiff = winnerModel.overallScore - valueModel.overallScore;
      
      if (scoreDiff < 5) {
        recommendation = {
          model: valueModel.model,
          reason: `Best value - only ${Math.round(scoreDiff)}% lower score at significantly lower cost`,
          confidence: 'high',
          alternative: {
            model: winnerModel.model,
            reason: 'Highest accuracy if cost is not a concern'
          }
        };
      }
    }

    return recommendation;
  }
}

module.exports = ResultAggregator;
