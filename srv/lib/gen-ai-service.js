const { OpenAI } = require('openai');
const axios = require('axios');
const winston = require('winston');
const moment = require('moment');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/gen-ai-service.log' }),
    new winston.transports.Console()
  ]
});

class GenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.azureOpenAI = process.env.AZURE_OPENAI_ENDPOINT ? {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION
    } : null;

    // Rate limiting
    this.rateLimiter = new RateLimiterMemory({
      keyGenerator: () => 'gen-ai-service',
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
    });

    this.promptTemplates = this.initializePromptTemplates();
    this.reportTemplates = this.initializeReportTemplates();
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
      
      scenario_planning: `
        Perform scenario analysis for CCEP sustainability strategy:

        Base scenario: {baseScenario}
        Variables to analyze: {variables}
        Time horizon: {timeHorizon}

        Generate 3 scenarios:
        1. Optimistic: Accelerated progress
        2. Realistic: Current trajectory
        3. Pessimistic: Challenges and setbacks

        For each scenario, provide:
        - Key assumptions
        - Expected outcomes
        - Risk factors
        - Mitigation strategies
      `,

      advanced_forecasting: `
        Perform advanced forecasting for CCEP sustainability metrics using multiple methodologies.

        Input data: {inputData}
        Forecast horizon: {horizon}
        Seasonality factors: {seasonality}
        External variables: {externalVars}

        Apply the following forecasting approaches:
        1. Trend extrapolation with confidence intervals
        2. Regression analysis with key drivers
        3. Scenario-based modeling (best/worst/likely cases)
        4. Monte Carlo simulation for uncertainty quantification

        Provide:
        - Point forecasts with 80% and 95% confidence intervals
        - Key assumptions and limitations
        - Sensitivity analysis for critical variables
        - Recommended monitoring indicators

        Format as JSON with forecasts, methodology, and validation metrics.
      `,

      multi_criteria_optimization: `
        Perform multi-criteria optimization for CCEP sustainability decisions.

        Decision context: {context}
        Criteria: {criteria}
        Alternatives: {alternatives}
        Constraints: {constraints}
        Stakeholder preferences: {preferences}

        Apply optimization methods:
        1. Weighted scoring model
        2. Analytic Hierarchy Process (AHP)
        3. TOPSIS (Technique for Order Preference by Similarity)
        4. Pareto frontier analysis

        Provide:
        - Ranked alternatives with scores
        - Trade-off analysis between criteria
        - Sensitivity analysis for weights
        - Implementation roadmap for top alternatives

        Format as structured JSON with rankings, analysis, and recommendations.
      `,

      intelligent_insights: `
        Generate intelligent insights from CCEP sustainability data using advanced analytics.

        Data context: {dataContext}
        Analysis focus: {focus}
        Stakeholder perspective: {stakeholder}

        Perform the following analyses:
        1. Anomaly detection and outlier identification
        2. Correlation analysis between key variables
        3. Trend decomposition (trend, seasonal, cyclical)
        4. Causal inference and driver identification
        5. Benchmarking against industry standards

        Provide:
        - Key insights with statistical significance
        - Actionable recommendations with priority levels
        - Risk assessment and mitigation strategies
        - Performance improvement opportunities
        - Data quality assessment and recommendations

        Format as comprehensive JSON with insights, evidence, and recommendations.
      `
    };
  }

  initializeReportTemplates() {
    return {
      executive_summary: {
        title: "CCEP Sustainability Performance Report",
        sections: [
          "Key Achievements",
          "Performance Against Targets",
          "Regional Highlights",
          "Strategic Priorities",
          "Investment Requirements"
        ]
      },
      
      detailed_analysis: {
        title: "Detailed Sustainability Analysis",
        sections: [
          "Packaging Performance",
          "Emission Reduction Progress",
          "Supply Chain Sustainability",
          "Regulatory Compliance",
          "Innovation Pipeline"
        ]
      },
      
      quarterly_review: {
        title: "Quarterly Sustainability Review",
        sections: [
          "Quarter Highlights",
          "KPI Dashboard",
          "Regional Performance",
          "Action Items",
          "Next Quarter Focus"
        ]
      }
    };
  }

  async generateInsight(data, analysisType = 'sustainability_analysis') {
    try {
      await this.rateLimiter.consume('gen-ai-service');
      
      const prompt = this.buildPrompt(analysisType, data);
      const response = await this.callOpenAI(prompt);
      
      logger.info(`Generated insight for analysis type: ${analysisType}`);
      
      return {
        insight: response.content,
        confidence: this.calculateConfidence(response),
        analysisType,
        timestamp: new Date().toISOString(),
        usage: response.usage
      };
    } catch (error) {
      logger.error('Error generating insight:', error);
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

      const response = await this.callOpenAI(prompt);
      const prediction = this.parsePredictionResponse(response.content);
      
      logger.info('Generated emission prediction');
      
      return {
        prediction,
        confidence: this.calculateConfidence(response),
        scenario: scenario.name,
        timeHorizon: scenario.timeHorizon || '2030',
        methodology: 'AI-powered predictive modeling',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error predicting emissions:', error);
      throw error;
    }
  }

  async generateReport(reportType, data, period) {
    try {
      const template = this.reportTemplates[reportType] || this.reportTemplates.executive_summary;
      
      const prompt = this.buildPrompt('report_generation', {
        period,
        metrics: JSON.stringify(data.metrics || {}),
        kpis: JSON.stringify(data.kpis || {}),
        regionalData: JSON.stringify(data.regionalData || {})
      });

      const response = await this.callOpenAI(prompt, 'gpt-4-turbo-preview');
      const formattedReport = this.formatReport(response.content, template);
      
      logger.info(`Generated ${reportType} report for period: ${period}`);
      
      return {
        report: formattedReport,
        reportType,
        period,
        generatedAt: new Date().toISOString(),
        template: template.title,
        wordCount: this.countWords(formattedReport)
      };
    } catch (error) {
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  async processNaturalLanguageQuery(query, context = {}) {
    try {
      const prompt = this.buildPrompt('natural_language_query', {
        query,
        context: JSON.stringify(context)
      });

      const response = await this.callOpenAI(prompt);
      
      logger.info(`Processed natural language query: ${query.substring(0, 50)}...`);
      
      return {
        answer: response.content,
        confidence: this.calculateConfidence(response),
        query,
        sources: context.sources || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error processing natural language query:', error);
      throw error;
    }
  }

  async performScenarioAnalysis(baseScenario, variables, timeHorizon = '2030') {
    try {
      const prompt = this.buildPrompt('scenario_planning', {
        baseScenario: JSON.stringify(baseScenario),
        variables: JSON.stringify(variables),
        timeHorizon
      });

      const response = await this.callOpenAI(prompt, 'gpt-4-turbo-preview');
      const scenarios = this.parseScenarioResponse(response.content);

      logger.info('Performed scenario analysis');

      return {
        scenarios,
        baseScenario,
        variables,
        timeHorizon,
        analysisDate: new Date().toISOString(),
        methodology: 'AI-powered scenario modeling'
      };
    } catch (error) {
      logger.error('Error performing scenario analysis:', error);
      throw error;
    }
  }

  async performAdvancedForecasting(inputData, horizon = '2030', options = {}) {
    try {
      const prompt = this.buildPrompt('advanced_forecasting', {
        inputData: JSON.stringify(inputData),
        horizon,
        seasonality: JSON.stringify(options.seasonality || {}),
        externalVars: JSON.stringify(options.externalVariables || {})
      });

      const response = await this.callOpenAI(prompt, 'gpt-4-turbo-preview');
      const forecast = this.parseForecastResponse(response.content);

      logger.info(`Generated advanced forecast for horizon: ${horizon}`);

      return {
        forecast,
        inputData,
        horizon,
        methodology: 'Multi-method AI forecasting',
        confidence: this.calculateForecastConfidence(forecast),
        generatedAt: new Date().toISOString(),
        options
      };
    } catch (error) {
      logger.error('Error performing advanced forecasting:', error);
      throw error;
    }
  }

  async performMultiCriteriaOptimization(context, criteria, alternatives, constraints = {}) {
    try {
      const prompt = this.buildPrompt('multi_criteria_optimization', {
        context: JSON.stringify(context),
        criteria: JSON.stringify(criteria),
        alternatives: JSON.stringify(alternatives),
        constraints: JSON.stringify(constraints),
        preferences: JSON.stringify(context.stakeholderPreferences || {})
      });

      const response = await this.callOpenAI(prompt, 'gpt-4-turbo-preview');
      const optimization = this.parseOptimizationResponse(response.content);

      logger.info('Performed multi-criteria optimization');

      return {
        optimization,
        context,
        criteria,
        alternatives,
        constraints,
        methodology: 'Multi-criteria decision analysis',
        analysisDate: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error performing multi-criteria optimization:', error);
      throw error;
    }
  }

  async generateIntelligentInsights(dataContext, focus = 'general', stakeholder = 'management') {
    try {
      const prompt = this.buildPrompt('intelligent_insights', {
        dataContext: JSON.stringify(dataContext),
        focus,
        stakeholder
      });

      const response = await this.callOpenAI(prompt, 'gpt-4-turbo-preview');
      const insights = this.parseInsightsResponse(response.content);

      logger.info(`Generated intelligent insights for focus: ${focus}`);

      return {
        insights,
        dataContext,
        focus,
        stakeholder,
        methodology: 'AI-powered advanced analytics',
        confidence: this.calculateInsightsConfidence(insights),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error generating intelligent insights:', error);
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

  async callOpenAI(prompt, model = null) {
    const modelToUse = model || process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    
    try {
      if (this.azureOpenAI && !model) {
        return await this.callAzureOpenAI(prompt);
      }

      const response = await this.openai.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: 'You are an expert sustainability analyst for CCEP with deep knowledge of packaging, emissions, and environmental regulations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: modelToUse
      };
    } catch (error) {
      logger.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  async callAzureOpenAI(prompt) {
    try {
      const response = await axios.post(
        `${this.azureOpenAI.endpoint}/openai/deployments/${this.azureOpenAI.deploymentName}/chat/completions?api-version=${this.azureOpenAI.apiVersion}`,
        {
          messages: [
            {
              role: 'system',
              content: 'You are an expert sustainability analyst for CCEP.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureOpenAI.apiKey
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: this.azureOpenAI.deploymentName
      };
    } catch (error) {
      logger.error('Azure OpenAI API call failed:', error);
      throw error;
    }
  }

  calculateConfidence(response) {
    // Simple confidence calculation based on response characteristics
    const content = response.content || '';
    const hasNumbers = /\d+/.test(content);
    const hasSpecificTerms = /target|goal|metric|kpi|performance/i.test(content);
    const length = content.length;
    
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

  parseScenarioResponse(content) {
    try {
      return JSON.parse(content);
    } catch {
      // Parse text-based scenarios
      const scenarios = content.split(/Scenario \d+:|Optimistic:|Realistic:|Pessimistic:/)
        .filter(s => s.trim().length > 0)
        .map((scenario, index) => ({
          name: ['Optimistic', 'Realistic', 'Pessimistic'][index] || `Scenario ${index + 1}`,
          description: scenario.trim()
        }));

      return scenarios;
    }
  }

  parseForecastResponse(content) {
    try {
      return JSON.parse(content);
    } catch {
      // Parse text-based forecast
      return {
        forecast: content,
        format: 'text',
        confidence: 0.7,
        methodology: 'AI-generated forecast'
      };
    }
  }

  parseOptimizationResponse(content) {
    try {
      return JSON.parse(content);
    } catch {
      // Parse text-based optimization results
      return {
        rankings: content,
        format: 'text',
        methodology: 'Multi-criteria analysis'
      };
    }
  }

  parseInsightsResponse(content) {
    try {
      return JSON.parse(content);
    } catch {
      // Parse text-based insights
      return {
        insights: content,
        format: 'text',
        analysisType: 'intelligent_insights'
      };
    }
  }

  calculateForecastConfidence(forecast) {
    // Calculate confidence based on forecast characteristics
    if (typeof forecast === 'object' && forecast.confidence) {
      return forecast.confidence;
    }

    // Default confidence calculation
    return 0.75;
  }

  calculateInsightsConfidence(insights) {
    // Calculate confidence based on insights characteristics
    if (typeof insights === 'object' && insights.confidence) {
      return insights.confidence;
    }

    // Default confidence calculation
    return 0.8;
  }

  formatReport(content, template) {
    return {
      title: template.title,
      content,
      sections: template.sections,
      generatedAt: new Date().toISOString(),
      format: 'markdown'
    };
  }

  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  async getModelStatus() {
    try {
      const testPrompt = 'Test connection';
      await this.callOpenAI(testPrompt);
      
      return {
        status: 'healthy',
        provider: this.azureOpenAI ? 'Azure OpenAI' : 'OpenAI',
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
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
}

module.exports = GenAIService;
