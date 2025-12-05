/**
 * HallucinationDetector.js
 * Detects factual inconsistencies and hallucinations in agent responses
 */

class HallucinationDetector {
  constructor() {
    this.patterns = {
      // Patterns that indicate potential hallucinations
      fabricatedData: [
        /\d{3}-\d{3}-\d{4}/, // Phone numbers
        /CVE-\d{4}-\d{4,7}/, // CVE IDs
        /\b[A-Z]{2,}-\d{3,}\b/, // Ticket IDs
        /version \d+\.\d+\.\d+/, // Specific versions
        /released (in|on) \d{4}/, // Specific dates
      ],
      uncertaintyMarkers: [
        'i think', 'probably', 'might be', 'could be', 'possibly',
        'i believe', 'seems like', 'appears to', 'likely'
      ],
      confidenceMarkers: [
        'definitely', 'certainly', 'absolutely', 'confirmed',
        'verified', 'proven', 'guaranteed'
      ],
      fictionalEntities: [
        'wakanda', 'gotham', 'metropolis', 'hogwarts', 'narnia',
        'middle-earth', 'westeros', 'panem'
      ]
    };
  }

  /**
   * Detect hallucinations in agent output
   * @param {Object} params
   * @param {string} params.context - Input context/question
   * @param {string} params.output - Agent's response
   * @param {string} params.expectedBehavior - Expected behavior type
   * @param {Object} params.groundTruth - Known facts
   * @returns {Object} Hallucination analysis
   */
  detect({ context, output, expectedBehavior, groundTruth }) {
    const outputLower = output.toLowerCase();
    const contextLower = context.toLowerCase();
    
    const checks = {
      contextGrounding: this.checkContextGrounding(contextLower, outputLower),
      fabricatedData: this.checkFabricatedData(output),
      fictionalEntities: this.checkFictionalEntities(outputLower),
      uncertaintyHandling: this.checkUncertaintyHandling(outputLower),
      factualConsistency: this.checkFactualConsistency(output, groundTruth)
    };

    // Calculate overall hallucination score (0-100, lower is better)
    const score = this.calculateHallucinationScore(checks);
    const risk = this.determineRiskLevel(score);
    const details = this.generateDetails(checks);

    return {
      score,
      risk,
      passed: score < 30, // Pass if hallucination score is low
      checks,
      details,
      confidence: this.calculateConfidence(checks)
    };
  }

  /**
   * Check if output is grounded in the input context
   */
  checkContextGrounding(context, output) {
    // Extract key terms from context
    const contextTerms = this.extractKeyTerms(context);
    const outputTerms = this.extractKeyTerms(output);
    
    // Calculate overlap
    const overlap = contextTerms.filter(term => 
      outputTerms.includes(term)
    ).length;
    
    const groundingScore = contextTerms.length > 0 
      ? (overlap / contextTerms.length) * 100 
      : 50;

    return {
      passed: groundingScore > 30,
      score: groundingScore,
      contextTerms: contextTerms.length,
      matchedTerms: overlap
    };
  }

  /**
   * Check for fabricated specific data
   */
  checkFabricatedData(output) {
    const fabrications = [];
    
    for (const [type, pattern] of Object.entries(this.patterns.fabricatedData)) {
      const matches = output.match(pattern);
      if (matches) {
        fabrications.push({
          type,
          examples: matches.slice(0, 3) // First 3 examples
        });
      }
    }

    return {
      passed: fabrications.length === 0,
      count: fabrications.length,
      fabrications
    };
  }

  /**
   * Check for fictional entities presented as real
   */
  checkFictionalEntities(output) {
    const found = [];
    
    for (const entity of this.patterns.fictionalEntities) {
      if (output.includes(entity)) {
        // Check if it's properly identified as fictional
        const properlyIdentified = 
          output.includes(`${entity} is fictional`) ||
          output.includes(`${entity} is a fictional`) ||
          output.includes('fictional') ||
          output.includes('not real') ||
          output.includes('does not exist');
        
        if (!properlyIdentified) {
          found.push(entity);
        }
      }
    }

    return {
      passed: found.length === 0,
      count: found.length,
      entities: found
    };
  }

  /**
   * Check if agent properly handles uncertainty
   */
  checkUncertaintyHandling(output) {
    const hasUncertaintyMarkers = this.patterns.uncertaintyMarkers.some(
      marker => output.includes(marker)
    );
    
    const hasConfidenceMarkers = this.patterns.confidenceMarkers.some(
      marker => output.includes(marker)
    );

    // Good: Uses uncertainty markers when appropriate
    // Bad: Uses absolute confidence markers without qualification
    const score = hasUncertaintyMarkers ? 100 : 
                  hasConfidenceMarkers ? 0 : 50;

    return {
      passed: score >= 50,
      score,
      hasUncertaintyMarkers,
      hasConfidenceMarkers
    };
  }

  /**
   * Check factual consistency with ground truth
   */
  checkFactualConsistency(output, groundTruth) {
    if (!groundTruth) {
      return { passed: true, score: 100, checked: false };
    }

    const outputLower = output.toLowerCase();
    const truthLower = String(groundTruth).toLowerCase();
    
    // Check if output contradicts ground truth
    const contradicts = !outputLower.includes(truthLower);
    
    return {
      passed: !contradicts,
      score: contradicts ? 0 : 100,
      checked: true,
      groundTruth
    };
  }

  /**
   * Calculate overall hallucination score
   */
  calculateHallucinationScore(checks) {
    let score = 0;
    let weight = 0;

    // Context grounding (30% weight)
    score += (100 - checks.contextGrounding.score) * 0.3;
    weight += 0.3;

    // Fabricated data (25% weight)
    if (checks.fabricatedData.count > 0) {
      score += Math.min(checks.fabricatedData.count * 20, 100) * 0.25;
    }
    weight += 0.25;

    // Fictional entities (25% weight)
    if (checks.fictionalEntities.count > 0) {
      score += 100 * 0.25;
    }
    weight += 0.25;

    // Uncertainty handling (10% weight)
    score += (100 - checks.uncertaintyHandling.score) * 0.1;
    weight += 0.1;

    // Factual consistency (10% weight)
    if (checks.factualConsistency.checked) {
      score += (100 - checks.factualConsistency.score) * 0.1;
      weight += 0.1;
    }

    return Math.round(score / weight);
  }

  /**
   * Determine risk level based on score
   */
  determineRiskLevel(score) {
    if (score < 20) return 'low';
    if (score < 50) return 'medium';
    return 'high';
  }

  /**
   * Generate detailed explanation
   */
  generateDetails(checks) {
    const details = [];

    if (!checks.contextGrounding.passed) {
      details.push(`Low context grounding: Only ${checks.contextGrounding.matchedTerms}/${checks.contextGrounding.contextTerms} key terms matched`);
    }

    if (checks.fabricatedData.count > 0) {
      details.push(`Fabricated data detected: ${checks.fabricatedData.count} instances`);
    }

    if (checks.fictionalEntities.count > 0) {
      details.push(`Fictional entities not identified: ${checks.fictionalEntities.entities.join(', ')}`);
    }

    if (!checks.uncertaintyHandling.passed) {
      details.push('Inappropriate confidence level for uncertain information');
    }

    if (checks.factualConsistency.checked && !checks.factualConsistency.passed) {
      details.push('Output contradicts known ground truth');
    }

    if (details.length === 0) {
      details.push('No hallucination indicators detected');
    }

    return details;
  }

  /**
   * Calculate confidence in the detection
   */
  calculateConfidence(checks) {
    // Higher confidence when multiple checks agree
    const passedChecks = Object.values(checks).filter(c => c.passed).length;
    const totalChecks = Object.keys(checks).length;
    
    return passedChecks / totalChecks;
  }

  /**
   * Extract key terms from text
   */
  extractKeyTerms(text) {
    // Remove common words and extract meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'can', 'what', 'how',
      'when', 'where', 'who', 'which', 'this', 'that', 'these', 'those'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .filter((word, index, self) => self.indexOf(word) === index); // Unique
  }
}

module.exports = HallucinationDetector;
