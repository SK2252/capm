const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/agents.log' }),
    new winston.transports.Console()
  ]
});

/**
 * Base Agent Class for CCEP Sustainability Analytics
 * Provides common functionality for all specialized agents
 */
class BaseAgent {
  constructor(ragSystem) {
    this.ragSystem = ragSystem;
    this.geminiService = ragSystem.geminiService;
    this.specialization = 'general';
    this.logger = logger;
  }

  /**
   * Process a query using the agent's specialization
   * @param {string} query - The user query
   * @param {Object} knowledge - Retrieved knowledge context
   * @returns {Object} - Response with answer and confidence
   */
  async processQuery(query, knowledge) {
    const prompt = this.buildPrompt(query, knowledge.context);

    try {
      if (!this.geminiService) {
        throw new Error('Gemini service not available');
      }

      const response = await this.geminiService.processNaturalLanguageQuery(prompt, {
        systemPrompt: this.getSystemPrompt(),
        sources: knowledge.sources || []
      });

      this.logger.info(`${this.specialization} agent processed query successfully`);

      return {
        answer: response.answer,
        confidence: knowledge.confidence,
        agent: this.specialization,
        model: response.model
      };
    } catch (error) {
      this.logger.error(`Error in ${this.specialization} agent:`, error);
      throw error;
    }
  }

  /**
   * Build a prompt for the AI model
   * @param {string} query - User query
   * @param {string} context - Knowledge context
   * @returns {string} - Formatted prompt
   */
  buildPrompt(query, context) {
    return `
Context Information:
${context}

User Query: ${query}

Please provide a comprehensive answer based on the context information above. 
Focus on CCEP's sustainability goals and provide actionable insights.
Use specific data points and metrics where available.
`;
  }

  /**
   * Get the system prompt for this agent
   * Should be overridden by specialized agents
   * @returns {string} - System prompt
   */
  getSystemPrompt() {
    return `You are a specialized AI agent for CCEP (Coca-Cola EuroPacific Partners) sustainability analytics.
Your role is to provide expert analysis and recommendations based on sustainability data and industry best practices.
Always consider CCEP's specific targets: 30% GHG reduction, 100% recyclable packaging by 2025, and 50% recycled content in PET bottles.

Key Context:
- CCEP operates in Europe and Asia Pacific regions
- Packaging accounts for 38% of carbon footprint
- Current collection rates: Europe 76.7%, Asia Pacific 53%
- Focus on circular economy principles and regulatory compliance`;
  }

  /**
   * Generate insights based on data analysis
   * Base implementation - should be overridden by specialized agents
   * @param {Object} data - Data to analyze
   * @returns {Object} - Insights and recommendations
   */
  async generateInsights(data) {
    return {
      insights: ['General sustainability insights based on provided data.'],
      recommendations: [
        'Review current performance against targets',
        'Identify improvement opportunities',
        'Implement best practices from industry leaders'
      ],
      confidence: 0.7,
      agent: this.specialization,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate input data
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - Required field names
   * @returns {boolean} - Validation result
   */
  validateData(data, requiredFields = []) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    return requiredFields.every(field => {
      const hasField = data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined;
      if (!hasField) {
        this.logger.warn(`Missing required field: ${field}`);
      }
      return hasField;
    });
  }

  /**
   * Calculate confidence score based on data quality and completeness
   * @param {Object} data - Input data
   * @param {Object} response - AI response
   * @returns {number} - Confidence score (0-1)
   */
  calculateConfidence(data, response) {
    let confidence = 0.5; // Base confidence

    // Data quality factors
    if (data && Object.keys(data).length > 0) {
      confidence += 0.1;
    }

    // Response quality factors
    if (response && response.length > 100) {
      confidence += 0.1;
    }

    // Specific metrics presence
    const hasMetrics = /\d+%|\d+\.\d+|\$\d+|target|goal/i.test(response || '');
    if (hasMetrics) {
      confidence += 0.2;
    }

    // Agent specialization bonus
    if (this.specialization !== 'general') {
      confidence += 0.1;
    }

    return Math.min(0.95, confidence);
  }

  /**
   * Format recommendations for consistent output
   * @param {Array} recommendations - Raw recommendations
   * @returns {Array} - Formatted recommendations
   */
  formatRecommendations(recommendations) {
    return recommendations.map((rec, index) => ({
      id: `${this.specialization}_rec_${index + 1}`,
      recommendation: rec,
      priority: this.getPriority(rec),
      category: this.specialization,
      estimatedImpact: this.estimateImpact(rec),
      timeframe: this.estimateTimeframe(rec)
    }));
  }

  /**
   * Estimate priority level for a recommendation
   * @param {string} recommendation - Recommendation text
   * @returns {string} - Priority level
   */
  getPriority(recommendation) {
    const highPriorityKeywords = ['urgent', 'critical', 'immediate', 'compliance', 'risk'];
    const mediumPriorityKeywords = ['improve', 'optimize', 'enhance', 'target'];
    
    const text = recommendation.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => text.includes(keyword))) {
      return 'High';
    } else if (mediumPriorityKeywords.some(keyword => text.includes(keyword))) {
      return 'Medium';
    }
    
    return 'Low';
  }

  /**
   * Estimate impact level for a recommendation
   * @param {string} recommendation - Recommendation text
   * @returns {string} - Impact level
   */
  estimateImpact(recommendation) {
    const highImpactKeywords = ['reduce', 'increase', 'target', 'goal', 'significant'];
    const text = recommendation.toLowerCase();
    
    if (highImpactKeywords.some(keyword => text.includes(keyword))) {
      return 'High';
    }
    
    return 'Medium';
  }

  /**
   * Estimate timeframe for a recommendation
   * @param {string} recommendation - Recommendation text
   * @returns {string} - Timeframe estimate
   */
  estimateTimeframe(recommendation) {
    const text = recommendation.toLowerCase();
    
    if (text.includes('immediate') || text.includes('urgent')) {
      return '1-3 months';
    } else if (text.includes('short') || text.includes('quick')) {
      return '3-6 months';
    } else if (text.includes('long') || text.includes('strategic')) {
      return '12+ months';
    }
    
    return '6-12 months';
  }

  /**
   * Get agent metadata
   * @returns {Object} - Agent information
   */
  getMetadata() {
    return {
      name: this.constructor.name,
      specialization: this.specialization,
      version: '1.0.0',
      capabilities: this.getCapabilities(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get agent capabilities
   * Should be overridden by specialized agents
   * @returns {Array} - List of capabilities
   */
  getCapabilities() {
    return [
      'Query processing',
      'Data analysis',
      'Insight generation',
      'Recommendation formatting'
    ];
  }
}

module.exports = BaseAgent;
