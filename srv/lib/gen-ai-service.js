const winston = require('winston');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const GeminiService = require('./gemini-service');
const MLService = require('./ml-service');

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
    // Initialize Gemini service
    this.geminiService = new GeminiService();

    // Initialize ML service with Gemini 1.5 Flash
    this.mlService = new MLService();

    // Set Gemini as the only provider
    this.preferredProvider = 'gemini';

    // Rate limiting
    this.rateLimiter = new RateLimiterMemory({
      keyGenerator: () => 'gen-ai-service',
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
    });
  }

  getPreferredProvider() {
    if (this.geminiService) return 'gemini';
    throw new Error('No AI provider configured. Please set GEMINI_API_KEY');
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

      const result = await this.geminiService.generateInsight(data, analysisType);

      logger.info(`Generated insight for analysis type: ${analysisType} using Gemini`);
      return result;

    } catch (error) {
      logger.error('Error generating insight:', error);
      throw error;
    }
  }

  async predictEmissions(scenario, historicalData) {
    try {
      const result = await this.geminiService.predictEmissions(scenario, historicalData);

      logger.info('Generated emission prediction using Gemini');
      return result;
    } catch (error) {
      logger.error('Error predicting emissions:', error);
      throw error;
    }
  }

  async generateReport(reportType, data, period) {
    try {
      const result = await this.geminiService.generateReport(reportType, data, period);

      logger.info(`Generated ${reportType} report for period: ${period} using Gemini`);
      return result;
    } catch (error) {
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  async processNaturalLanguageQuery(query, context = {}) {
    try {
      const result = await this.geminiService.processNaturalLanguageQuery(query, context);

      logger.info(`Processed natural language query using Gemini: ${query.substring(0, 50)}...`);
      return result;
    } catch (error) {
      logger.error('Error processing natural language query:', error);
      throw error;
    }
  }

  async performScenarioAnalysis(baseScenario, variables, timeHorizon = '2030') {
    try {
      // Use Gemini for scenario analysis
      const result = await this.geminiService.performScenarioAnalysis(baseScenario, variables, timeHorizon);

      logger.info('Performed scenario analysis using Gemini');
      return result;
    } catch (error) {
      logger.error('Error performing scenario analysis:', error);
      throw error;
    }
  }

  // ===== MACHINE LEARNING METHODS =====

  /**
   * Advanced Emission Prediction using ML
   */
  async predictEmissionsML(historicalData, scenario, timeHorizon = '2030') {
    try {
      const result = await this.mlService.predictEmissionsAdvanced(historicalData, scenario, timeHorizon);
      logger.info(`Generated ML-based emission prediction for scenario: ${scenario.name}`);
      return result;
    } catch (error) {
      logger.error('Error in ML emission prediction:', error);
      throw error;
    }
  }

  /**
   * Packaging Material Optimization using ML
   */
  async optimizePackagingML(currentPackaging, constraints, objectives) {
    try {
      const result = await this.mlService.optimizePackagingMaterials(currentPackaging, constraints, objectives);
      logger.info('Generated ML-based packaging optimization');
      return result;
    } catch (error) {
      logger.error('Error in ML packaging optimization:', error);
      throw error;
    }
  }

  /**
   * Supply Chain Risk Assessment using ML
   */
  async assessSupplyChainRiskML(supplyChainData, riskFactors) {
    try {
      const result = await this.mlService.assessSupplyChainRisk(supplyChainData, riskFactors);
      logger.info('Generated ML-based supply chain risk assessment');
      return result;
    } catch (error) {
      logger.error('Error in ML supply chain risk assessment:', error);
      throw error;
    }
  }

  /**
   * Regulatory Compliance Classification using ML
   */
  async classifyRegulatoryComplianceML(regulationText, region, context) {
    try {
      const result = await this.mlService.classifyRegulatoryCompliance(regulationText, region, context);
      logger.info(`Generated ML-based regulatory compliance classification for region: ${region}`);
      return result;
    } catch (error) {
      logger.error('Error in ML regulatory compliance classification:', error);
      throw error;
    }
  }

  /**
   * Get ML Service Status
   */
  async getMLServiceStatus() {
    try {
      return await this.mlService.getMLServiceStatus();
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }















  async getModelStatus() {
    try {
      return await this.geminiService.getModelStatus();
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
