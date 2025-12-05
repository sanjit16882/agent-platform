/**
 * QualityScorer.js
 * Evaluates response quality: coherence, relevance, completeness, fluency
 */

class QualityScorer {
  constructor() {
    this.metrics = {
      coherence: {
        transitionWords: ['however', 'therefore', 'furthermore', 'additionally', 'moreover', 'consequently'],
        pronounReferences: ['it', 'this', 'that', 'these', 'those', 'they']
      },
      relevance: {
        // Will be calculated based on context overlap
      },
      completeness: {
        minLength: 50,
        expectedElements: ['explanation', 'example', 'conclusion']
      }
    };
  }

  /**
   * Score response quality
   * @param {Object} params
   * @param {string} params.input - User input
   * @param {string} params.output - Agent response
   * @param {string} params.expectedOutput - Expected response (optional)
   * @returns {Object} Quality scores
   */
  score({ input, output, expectedOutput }) {
    const scores = {
      coherence: this.scoreCoherence(output),
      relevance: this.scoreRelevance(input, output),
      completeness: this.scoreCompleteness(output, expectedOutput),
      fluency: this.scoreFluency(output)
    };

    const overallScore = this.calculateOverallScore(scores);
    const grade = this.assignGrade(overallScore);

    return {
      overallScore,
      grade,
      scores,
      details: this.generateDetails(scores),
      strengths: this.identifyStrengths(scores),
      weaknesses: this.identifyWeaknesses(scores)
    };
  }

  /**
   * Score coherence (logical flow and structure)
   */
  scoreCoherence(output) {
    let score = 50; // Base score

    // Check for transition words
    const transitionCount = this.metrics.coherence.transitionWords.filter(
      word => output.toLowerCase().includes(word)
    ).length;
    score += Math.min(transitionCount * 5, 20);

    // Check for proper pronoun references
    const pronounCount = this.metrics.coherence.pronounReferences.filter(
      pronoun => output.toLowerCase().includes(` ${pronoun} `)
    ).length;
    score += Math.min(pronounCount * 2, 10);

    // Check for paragraph structure
    const paragraphs = output.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) {
      score += 10;
    }

    // Check for logical sentence structure
    const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = output.length / sentences.length;
    if (avgSentenceLength > 10 && avgSentenceLength < 50) {
      score += 10; // Good sentence length
    }

    return Math.min(score, 100);
  }

  /**
   * Score relevance (how well it addresses the input)
   */
  scoreRelevance(input, output) {
    const inputLower = input.toLowerCase();
    const outputLower = output.toLowerCase();

    // Extract key terms from input
    const inputTerms = this.extractKeyTerms(inputLower);
    const outputTerms = this.extractKeyTerms(outputLower);

    // Calculate term overlap
    const matchedTerms = inputTerms.filter(term => 
      outputTerms.includes(term)
    );
    
    const overlapRatio = inputTerms.length > 0 
      ? matchedTerms.length / inputTerms.length 
      : 0;

    // Base score on overlap
    let score = overlapRatio * 70;

    // Bonus for addressing question words
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who'];
    const hasQuestionWord = questionWords.some(word => inputLower.includes(word));
    
    if (hasQuestionWord) {
      // Check if output provides an answer
      const hasAnswer = 
        outputLower.includes('because') ||
        outputLower.includes('the reason') ||
        outputLower.includes('this is') ||
        outputLower.includes('it is') ||
        outputLower.length > 100;
      
      if (hasAnswer) {
        score += 20;
      }
    } else {
      score += 10; // Not a question, easier to be relevant
    }

    // Bonus for staying on topic
    if (output.length > 50 && overlapRatio > 0.3) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Score completeness (thoroughness of response)
   */
  scoreCompleteness(output, expectedOutput) {
    let score = 0;

    // Length check
    if (output.length >= this.metrics.completeness.minLength) {
      score += 30;
    } else {
      score += (output.length / this.metrics.completeness.minLength) * 30;
    }

    // Structure check
    const hasMultipleSentences = output.split(/[.!?]+/).length > 2;
    if (hasMultipleSentences) {
      score += 20;
    }

    // Detail check
    const hasExamples = 
      output.toLowerCase().includes('example') ||
      output.toLowerCase().includes('for instance') ||
      output.toLowerCase().includes('such as');
    if (hasExamples) {
      score += 15;
    }

    // Explanation check
    const hasExplanation = 
      output.toLowerCase().includes('because') ||
      output.toLowerCase().includes('reason') ||
      output.toLowerCase().includes('this means');
    if (hasExplanation) {
      score += 15;
    }

    // Expected output comparison
    if (expectedOutput) {
      const similarity = this.calculateSimilarity(output, expectedOutput);
      score += similarity * 20;
    } else {
      score += 20; // No expected output to compare
    }

    return Math.min(score, 100);
  }

  /**
   * Score fluency (readability and natural language)
   */
  scoreFluency(output) {
    let score = 50; // Base score

    // Check for grammatical markers
    const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Sentence variety
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    
    if (variance > 10) {
      score += 15; // Good sentence variety
    }

    // Proper capitalization
    const properlyCapitalized = sentences.filter(s => 
      s.trim()[0] === s.trim()[0].toUpperCase()
    ).length;
    score += (properlyCapitalized / sentences.length) * 15;

    // No excessive repetition
    const words = output.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    score += repetitionRatio * 20;

    return Math.min(score, 100);
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallScore(scores) {
    // Weighted average
    const weights = {
      coherence: 0.25,
      relevance: 0.35,
      completeness: 0.25,
      fluency: 0.15
    };

    const weighted = 
      scores.coherence * weights.coherence +
      scores.relevance * weights.relevance +
      scores.completeness * weights.completeness +
      scores.fluency * weights.fluency;

    return Math.round(weighted);
  }

  /**
   * Assign letter grade
   */
  assignGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
  }

  /**
   * Generate detailed explanation
   */
  generateDetails(scores) {
    const details = [];

    details.push(`Coherence: ${Math.round(scores.coherence)}% - ${this.getCoherenceDescription(scores.coherence)}`);
    details.push(`Relevance: ${Math.round(scores.relevance)}% - ${this.getRelevanceDescription(scores.relevance)}`);
    details.push(`Completeness: ${Math.round(scores.completeness)}% - ${this.getCompletenessDescription(scores.completeness)}`);
    details.push(`Fluency: ${Math.round(scores.fluency)}% - ${this.getFluencyDescription(scores.fluency)}`);

    return details;
  }

  /**
   * Identify strengths
   */
  identifyStrengths(scores) {
    const strengths = [];
    
    if (scores.coherence >= 80) strengths.push('Well-structured and logical');
    if (scores.relevance >= 80) strengths.push('Highly relevant to the question');
    if (scores.completeness >= 80) strengths.push('Thorough and complete');
    if (scores.fluency >= 80) strengths.push('Natural and fluent language');

    return strengths.length > 0 ? strengths : ['Meets basic quality standards'];
  }

  /**
   * Identify weaknesses
   */
  identifyWeaknesses(scores) {
    const weaknesses = [];
    
    if (scores.coherence < 60) weaknesses.push('Lacks logical flow');
    if (scores.relevance < 60) weaknesses.push('Not fully addressing the question');
    if (scores.completeness < 60) weaknesses.push('Incomplete or too brief');
    if (scores.fluency < 60) weaknesses.push('Awkward or unnatural phrasing');

    return weaknesses;
  }

  // Description helpers
  getCoherenceDescription(score) {
    if (score >= 80) return 'Excellent logical flow';
    if (score >= 60) return 'Good structure';
    return 'Needs better organization';
  }

  getRelevanceDescription(score) {
    if (score >= 80) return 'Directly addresses the question';
    if (score >= 60) return 'Mostly on topic';
    return 'Partially off-topic';
  }

  getCompletenessDescription(score) {
    if (score >= 80) return 'Comprehensive answer';
    if (score >= 60) return 'Adequate detail';
    return 'Too brief or missing key points';
  }

  getFluencyDescription(score) {
    if (score >= 80) return 'Natural and readable';
    if (score >= 60) return 'Acceptable fluency';
    return 'Awkward phrasing';
  }

  /**
   * Extract key terms from text
   */
  extractKeyTerms(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'can', 'what', 'how'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .filter((word, index, self) => self.indexOf(word) === index);
  }

  /**
   * Calculate text similarity
   */
  calculateSimilarity(text1, text2) {
    const terms1 = new Set(this.extractKeyTerms(text1.toLowerCase()));
    const terms2 = new Set(this.extractKeyTerms(text2.toLowerCase()));
    
    const intersection = new Set([...terms1].filter(x => terms2.has(x)));
    const union = new Set([...terms1, ...terms2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

module.exports = QualityScorer;
