const { GoogleGenerativeAI } = require('@google/generative-ai');
const winston = require('winston');
const { config } = require('../../config/app-config');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/gemini-service.log' }),
    new winston.transports.Console()
  ]
});

class GeminiService {
  constructor() {
    const apiKey = config?.gemini?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // Updated to use Gemini 1.5 Flash
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent results
        topK: config.gemini.topK,
        topP: config.gemini.topP,
        maxOutputTokens: 8192, // Increased token limit for Flash model
      }
    });

    this.promptTemplates = this.initializePromptTemplates();
  }

  initializePromptTemplates() {
    return {
      sustainability_analysis: `
        You are a sustainability expert analyzing CCEP (Coca-Cola EuroPacific Partners) data.
        
        Context: CCEP aims for 30% GHG emission reduction, 100% recyclable packaging by 2025, 
        and 50% recycled content in PET bottles. Packaging accounts for 38% of carbon footprint.
        
        Current data: {data}
        
        Provide analysis including:
        1. Current performance assessment
        2. Gap analysis against targets
        3. Key insights and trends
        4. Actionable recommendations
        5. Risk assessment
        
        Format as structured JSON with clear metrics and recommendations.
      `,
      
      predictive_analytics: `
        As a data scientist specializing in sustainability forecasting for CCEP:
        
        Historical data: {historicalData}
        Current trends: {trends}
        External factors: {externalFactors}
        
        Predict future performance for:
        1. GHG emission reduction trajectory
        2. Packaging recyclability progress
        3. Collection rate improvements
        4. Recycled content adoption
        
        Include confidence intervals and key assumptions.
        Provide scenario analysis (best case, worst case, most likely).
      `,
      
      natural_language_query: `
        You are CCEP's sustainability AI assistant. Answer questions about:
        - Sustainability performance and metrics
        - Packaging and recycling data
        - Emission reduction progress
        - Regulatory compliance
        - Industry best practices
        
        User question: {query}
        Relevant data: {context}
        
        Provide accurate, actionable answers with specific data points and recommendations.
        If uncertain, clearly state limitations and suggest additional data needs.
      `,
      
      report_generation: `
        Generate a comprehensive sustainability report for CCEP based on:
        
        Data period: {period}
        Metrics: {metrics}
        KPIs: {kpis}
        Regional data: {regionalData}
        
        Structure the report with:
        1. Executive Summary
        2. Key Performance Indicators
        3. Regional Analysis
        4. Progress Against Targets
        5. Challenges and Opportunities
        6. Recommendations
        7. Next Steps
        
        Use professional business language suitable for executive presentation.
      `
    };
  }

  async generateInsight(data, analysisType = 'sustainability_analysis') {
    try {
      const prompt = this.buildPrompt(analysisType, data);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Generated insight for analysis type: ${analysisType}`);
      
      return {
        insight: text,
        confidence: this.calculateConfidence(text),
        analysisType,
        timestamp: new Date().toISOString(),
        model: config.gemini.model
      };
    } catch (error) {
      logger.error('Error generating insight with Gemini:', error);
      throw error;
    }
  }

  async predictEmissions(scenario, historicalData) {
    try {
      const prompt = this.buildPrompt('predictive_analytics', {
        historicalData: JSON.stringify(historicalData),
        trends: this.analyzeTrends(historicalData),
        externalFactors: scenario.externalFactors || 'Standard market conditions'
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const prediction = this.parsePredictionResponse(text);
      
      logger.info('Generated emission prediction with Gemini');
      
      return {
        prediction,
        confidence: this.calculateConfidence(text),
        scenario: scenario.name,
        timeHorizon: scenario.timeHorizon || '2030',
        methodology: 'Gemini AI-powered predictive modeling',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error predicting emissions with Gemini:', error);
      throw error;
    }
  }

  async generateReport(reportType, data, period) {
    try {
      const prompt = this.buildPrompt('report_generation', {
        period,
        metrics: JSON.stringify(data.metrics || {}),
        kpis: JSON.stringify(data.kpis || {}),
        regionalData: JSON.stringify(data.regionalData || {})
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Generated ${reportType} report for period: ${period} with Gemini`);
      
      return {
        report: {
          title: `CCEP Sustainability Report - ${reportType}`,
          content: text,
          format: 'markdown'
        },
        reportType,
        period,
        generatedAt: new Date().toISOString(),
        wordCount: this.countWords(text),
        model: config.gemini.model
      };
    } catch (error) {
      logger.error('Error generating report with Gemini:', error);
      throw error;
    }
  }

  async processNaturalLanguageQuery(query, context = {}) {
    try {
      const prompt = this.buildPrompt('natural_language_query', {
        query,
        context: JSON.stringify(context)
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Processed natural language query with Gemini: ${query.substring(0, 50)}...`);
      
      return {
        answer: text,
        confidence: this.calculateConfidence(text),
        query,
        sources: context.sources || [],
        timestamp: new Date().toISOString(),
        model: config.gemini.model
      };
    } catch (error) {
      logger.error('Error processing natural language query with Gemini:', error);
      throw error;
    }
  }

  buildPrompt(templateName, data) {
    let template = this.promptTemplates[templateName];
    if (!template) {
      throw new Error(`Unknown prompt template: ${templateName}`);
    }

    // Replace placeholders with actual data
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{${key}}`;
      template = template.replace(new RegExp(placeholder, 'g'), value);
    }

    return template;
  }

  calculateConfidence(text) {
    // Simple confidence calculation based on response characteristics
    const hasNumbers = /\d+/.test(text);
    const hasSpecificTerms = /target|goal|metric|kpi|performance/i.test(text);
    const length = text.length;
    
    let confidence = 0.5;
    if (hasNumbers) confidence += 0.2;
    if (hasSpecificTerms) confidence += 0.2;
    if (length > 500) confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }

  analyzeTrends(historicalData) {
    if (!Array.isArray(historicalData) || historicalData.length < 2) {
      return 'Insufficient data for trend analysis';
    }

    const trends = [];
    const latest = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];
    
    for (const key in latest) {
      if (typeof latest[key] === 'number' && typeof previous[key] === 'number') {
        const change = ((latest[key] - previous[key]) / previous[key]) * 100;
        trends.push(`${key}: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`);
      }
    }
    
    return trends.join(', ');
  }

  parsePredictionResponse(content) {
    try {
      // Try to parse as JSON first
      return JSON.parse(content);
    } catch {
      // If not JSON, return structured text
      return {
        prediction: content,
        format: 'text'
      };
    }
  }

  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  async getModelStatus() {
    try {
      const testPrompt = 'Test connection to Gemini API';
      const result = await this.model.generateContent(testPrompt);
      const response = await result.response;
      
      return {
        status: 'healthy',
        provider: 'Google Gemini',
        model: config.gemini.model,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  // Chat conversation support
  async startChat(history = []) {
    try {
      const chat = this.model.startChat({
        history: history,
        generationConfig: {
          temperature: config.gemini.temperature,
          topK: config.gemini.topK,
          topP: config.gemini.topP,
          maxOutputTokens: config.gemini.maxTokens,
        }
      });
      
      return chat;
    } catch (error) {
      logger.error('Error starting Gemini chat:', error);
      throw error;
    }
  }

  async sendMessage(chat, message) {
    try {
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      
      return {
        message: text,
        timestamp: new Date().toISOString(),
        model: config.gemini.model
      };
    } catch (error) {
      logger.error('Error sending message to Gemini chat:', error);
      throw error;
    }
  }
}

module.exports = GeminiService;
