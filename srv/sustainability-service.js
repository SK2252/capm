const cds = require('@sap/cds');
const { AgenticRAGSystem } = require('./lib/agentic-rag');
const GenAIService = require('./lib/gen-ai-service');
const DataProcessor = require('./lib/data-processor');
const winston = require('winston');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Log to verify environment loading (remove in production)
console.log('Environment check:', {
  hasGeminiKey: !!process.env.GEMINI_API_KEY,
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  nodeEnv: process.env.NODE_ENV
});

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/sustainability-service.log' }),
    new winston.transports.Console()
  ]
});

class SustainabilityServiceHandler {
  constructor() {
    this.ragSystem = new AgenticRAGSystem();
    this.genAI = new GenAIService();
    this.dataProcessor = new DataProcessor();
    this.initialized = false;
  }

  async init() {
    try {
      await this.ragSystem.initialize();
      this.initialized = true;
      logger.info('Sustainability Service Handler initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Sustainability Service Handler:', error);
      throw error;
    }
  }

  // Entity Event Handlers
  async onPackagingMetrics(srv) {
    // Before read - add calculated fields
    srv.before('READ', 'PackagingMetrics', async (req) => {
      logger.info('Reading PackagingMetrics with calculated fields');
    });

    srv.after('READ', 'PackagingMetrics', async (data, req) => {
      if (Array.isArray(data)) {
        data.forEach(item => this.addPackagingCalculations(item));
      } else if (data) {
        this.addPackagingCalculations(data);
      }
    });

    // Action handlers
    srv.on('analyzePackaging', 'PackagingMetrics', async (req) => {
      try {
        const { ID } = req.params[0];
        const packaging = await srv.read('PackagingMetrics', ID);
        
        if (!packaging) {
          throw new Error('Packaging item not found');
        }

        const analysis = await this.ragSystem.processQuery(
          `Analyze packaging performance for ${packaging.material} in ${packaging.region}`,
          'packaging'
        );

        return analysis.response;
      } catch (error) {
        logger.error('Error in analyzePackaging action:', error);
        throw error;
      }
    });

    srv.on('optimizeRecyclability', 'PackagingMetrics', async (req) => {
      try {
        const { ID } = req.params[0];
        const packaging = await srv.read('PackagingMetrics', ID);
        
        const optimization = await this.genAI.generateInsight({
          material: packaging.material,
          currentRecyclability: packaging.recyclableContent,
          region: packaging.region
        }, 'optimization');

        return optimization.insight;
      } catch (error) {
        logger.error('Error in optimizeRecyclability action:', error);
        throw error;
      }
    });

    srv.on('calculateFootprint', 'PackagingMetrics', async (req) => {
      try {
        const { ID } = req.params[0];
        const packaging = await srv.read('PackagingMetrics', ID);
        
        const footprint = this.dataProcessor.calculatePackagingFootprint([packaging]);
        return footprint[0]?.calculatedFootprint || 0;
      } catch (error) {
        logger.error('Error in calculateFootprint action:', error);
        throw error;
      }
    });
  }

  async onEmissionData(srv) {
    srv.after('READ', 'EmissionData', async (data, req) => {
      if (Array.isArray(data)) {
        data.forEach(item => this.addEmissionCalculations(item));
      } else if (data) {
        this.addEmissionCalculations(data);
      }
    });

    srv.on('predictEmissions', 'EmissionData', async (req) => {
      try {
        const { scenario } = req.data;
        const { ID } = req.params[0];
        
        const emission = await srv.read('EmissionData', ID);
        const historicalData = await srv.read('EmissionData', { 
          source: emission.source,
          region: emission.region 
        });

        const prediction = await this.genAI.predictEmissions(
          { name: scenario, externalFactors: 'Standard conditions' },
          historicalData
        );

        return JSON.stringify(prediction);
      } catch (error) {
        logger.error('Error in predictEmissions action:', error);
        throw error;
      }
    });

    srv.on('analyzeReductionPath', 'EmissionData', async (req) => {
      try {
        const { ID } = req.params[0];
        const emission = await srv.read('EmissionData', ID);
        
        const analysis = await this.ragSystem.processQuery(
          `Analyze emission reduction path for ${emission.source} in ${emission.region}`,
          'emission'
        );

        return analysis.response;
      } catch (error) {
        logger.error('Error in analyzeReductionPath action:', error);
        throw error;
      }
    });
  }

  // Function Implementations
  async analyzePackaging(material, region, analysisType) {
    try {
      if (!this.initialized) await this.init();

      const query = `Analyze ${material} packaging performance in ${region} for ${analysisType}`;
      const result = await this.ragSystem.processQuery(query, 'packaging');
      
      const recommendations = await this.genAI.generateInsight({
        material,
        region,
        analysisType
      }, 'packaging_analysis');

      return {
        analysis: result.response,
        recommendations: this.parseRecommendations(recommendations.insight),
        confidence: result.confidence,
        insights: recommendations.insight
      };
    } catch (error) {
      logger.error('Error in analyzePackaging function:', error);
      throw error;
    }
  }

  async predictEmissions(scenario, timeHorizon, region) {
    try {
      if (!this.initialized) await this.init();

      // Get historical emission data
      const db = await cds.connect.to('db');
      const historicalData = await db.read('ccep.sustainability.EmissionData')
        .where({ region });

      const prediction = await this.genAI.predictEmissions(
        { 
          name: scenario, 
          timeHorizon,
          externalFactors: 'Market conditions and regulatory changes'
        },
        historicalData
      );

      return {
        prediction: prediction.prediction.value || 0,
        confidence: prediction.confidence,
        methodology: prediction.methodology,
        assumptions: this.parseAssumptions(prediction.prediction),
        scenarios: this.generateScenarios(prediction.prediction)
      };
    } catch (error) {
      logger.error('Error in predictEmissions function:', error);
      throw error;
    }
  }

  async generateReport(reportType, period, region, includeAI) {
    try {
      if (!this.initialized) await this.init();

      // Gather data for the report
      const db = await cds.connect.to('db');
      const data = await this.gatherReportData(db, period, region);

      const report = await this.genAI.generateReport(reportType, data, period);

      return {
        report: report.report.content,
        reportId: uuidv4(),
        generatedAt: new Date().toISOString(),
        format: 'markdown',
        sections: report.report.sections || []
      };
    } catch (error) {
      logger.error('Error in generateReport function:', error);
      throw error;
    }
  }

  async queryInsights(question, context, agentType) {
    try {
      if (!this.initialized) await this.init();

      const result = await this.ragSystem.processQuery(question, agentType);
      const relatedQuestions = await this.generateRelatedQuestions(question);

      return {
        answer: result.response,
        confidence: result.confidence,
        sources: result.sources.map(s => s.source),
        relatedQuestions,
        agentUsed: result.agentType
      };
    } catch (error) {
      logger.error('Error in queryInsights function:', error);
      throw error;
    }
  }

  async getRecommendations(target, currentData, priority) {
    try {
      if (!this.initialized) await this.init();

      const recommendations = await this.genAI.generateInsight({
        target,
        currentData: JSON.parse(currentData || '{}'),
        priority
      }, 'recommendations');

      return this.parseRecommendationsList(recommendations.insight);
    } catch (error) {
      logger.error('Error in getRecommendations function:', error);
      throw error;
    }
  }

  async performScenarioAnalysis(baseScenario, variables, timeHorizon) {
    try {
      if (!this.initialized) await this.init();

      const analysis = await this.genAI.performScenarioAnalysis(
        JSON.parse(baseScenario),
        variables,
        timeHorizon
      );

      return {
        scenarios: analysis.scenarios,
        recommendations: this.parseRecommendations(analysis.scenarios),
        riskFactors: this.extractRiskFactors(analysis.scenarios)
      };
    } catch (error) {
      logger.error('Error in performScenarioAnalysis function:', error);
      throw error;
    }
  }

  async getDashboardData(region, period, kpis) {
    try {
      const db = await cds.connect.to('db');
      
      // Get packaging data
      const packagingData = await db.read('ccep.sustainability.PackagingMetrics')
        .where({ region });
      
      // Get emission data
      const emissionData = await db.read('ccep.sustainability.EmissionData')
        .where({ region });
      
      // Get KPI data
      const kpiData = await db.read('ccep.sustainability.KPITracking')
        .where({ region });

      const dashboard = this.dataProcessor.generateKPIDashboard(
        packagingData,
        emissionData,
        kpiData
      );

      return dashboard;
    } catch (error) {
      logger.error('Error in getDashboardData function:', error);
      throw error;
    }
  }

  // Helper Methods
  addPackagingCalculations(item) {
    if (!item) return;
    
    // Calculate carbon intensity
    item.carbonIntensity = item.carbonFootprint / (item.volume || 1);
    
    // Calculate recyclability score (0-10 scale)
    item.recyclabilityScore = (item.recyclableContent || 0) / 10;
    
    // Calculate target gap
    const target = item.material === 'PET' ? 50 : 100; // Different targets for different materials
    item.targetGap = target - (item.recycledContent || 0);
  }

  addEmissionCalculations(item) {
    if (!item) return;
    
    // Calculate reduction from baseline
    if (item.baseline && item.baseline > 0) {
      item.reductionFromBaseline = ((item.baseline - item.value) / item.baseline) * 100;
    } else {
      item.reductionFromBaseline = 0;
    }
    
    // Calculate target progress
    if (item.target && item.baseline && item.baseline > 0) {
      const targetReduction = ((item.baseline - item.target) / item.baseline) * 100;
      item.targetProgress = (item.reductionFromBaseline / targetReduction) * 100;
    } else {
      item.targetProgress = 0;
    }
    
    // Calculate emission intensity (emissions per unit)
    item.emissionIntensity = item.value / 1000; // Normalize to per 1000 units
  }

  parseRecommendations(text) {
    // Simple parsing - in production, use more sophisticated NLP
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines.filter(line => 
      line.includes('recommend') || 
      line.includes('suggest') || 
      line.includes('should')
    );
  }

  parseAssumptions(prediction) {
    // Extract assumptions from prediction text
    if (typeof prediction === 'string') {
      return prediction.split('\n')
        .filter(line => line.includes('assume') || line.includes('based on'))
        .slice(0, 5); // Limit to 5 assumptions
    }
    return ['Standard market conditions', 'Current regulatory environment'];
  }

  generateScenarios(prediction) {
    // Generate scenario variations
    const baseValue = typeof prediction === 'object' ? prediction.value : parseFloat(prediction) || 0;
    
    return [
      {
        name: 'Optimistic',
        value: baseValue * 0.85, // 15% better
        probability: 0.25
      },
      {
        name: 'Most Likely',
        value: baseValue,
        probability: 0.50
      },
      {
        name: 'Pessimistic',
        value: baseValue * 1.15, // 15% worse
        probability: 0.25
      }
    ];
  }

  async generateRelatedQuestions(question) {
    // Generate related questions based on the original query
    const keywords = question.toLowerCase().split(' ')
      .filter(word => word.length > 3);
    
    const relatedQuestions = [
      `What are the trends for ${keywords[0]}?`,
      `How does ${keywords[0]} compare across regions?`,
      `What factors influence ${keywords[0]}?`
    ];
    
    return relatedQuestions.slice(0, 3);
  }

  parseRecommendationsList(text) {
    // Parse recommendations into structured format
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    return lines.map((line, index) => ({
      recommendation: line.trim(),
      priority: index < 3 ? 'High' : 'Medium',
      impact: 'To be assessed',
      effort: 'Medium',
      timeline: '3-6 months',
      kpiImpact: ['Sustainability Score', 'Emission Reduction']
    }));
  }

  extractRiskFactors(scenarios) {
    // Extract risk factors from scenario analysis
    const riskFactors = [
      'Regulatory changes',
      'Market volatility',
      'Technology adoption rates',
      'Supply chain disruptions',
      'Consumer behavior changes'
    ];
    
    return riskFactors.slice(0, 3);
  }

  async gatherReportData(db, period, region) {
    try {
      const data = {
        metrics: {},
        kpis: {},
        regionalData: {}
      };

      // Get packaging metrics
      const packaging = await db.read('ccep.sustainability.PackagingMetrics')
        .where({ region });
      data.metrics.packaging = packaging;

      // Get emission data
      const emissions = await db.read('ccep.sustainability.EmissionData')
        .where({ region });
      data.metrics.emissions = emissions;

      // Get KPI data
      const kpis = await db.read('ccep.sustainability.KPITracking')
        .where({ region });
      data.kpis = kpis;

      // Regional comparison data
      if (region !== 'Global') {
        const otherRegions = await db.read('ccep.sustainability.PackagingMetrics')
          .where({ region: { '!=': region } });
        data.regionalData.comparison = otherRegions;
      }

      return data;
    } catch (error) {
      logger.error('Error gathering report data:', error);
      throw error;
    }
  }
}

// Service Implementation
module.exports = cds.service.impl(async function() {
  const handler = new SustainabilityServiceHandler();
  
  // Initialize the handler
  await handler.init();

  // Set up entity handlers
  await handler.onPackagingMetrics(this);
  await handler.onEmissionData(this);

  // Function implementations
  this.on('analyzePackaging', handler.analyzePackaging.bind(handler));
  this.on('predictEmissions', handler.predictEmissions.bind(handler));
  this.on('generateReport', handler.generateReport.bind(handler));
  this.on('queryInsights', handler.queryInsights.bind(handler));
  this.on('getRecommendations', handler.getRecommendations.bind(handler));
  this.on('performScenarioAnalysis', handler.performScenarioAnalysis.bind(handler));
  this.on('getDashboardData', handler.getDashboardData.bind(handler));

  logger.info('Sustainability Service initialized successfully');
});
