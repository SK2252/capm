const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config/app-config');
const winston = require('winston');
const _ = require('lodash');

// Configure logger
const logger = winston.createLogger({
  level: config?.app?.logLevel || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/ml-service.log' })
  ]
});

/**
 * Machine Learning Service using Gemini 1.5 Flash
 * Provides advanced ML capabilities for sustainability analytics
 */
class MLService {
  constructor() {
    const apiKey = config?.gemini?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for ML Service');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent ML predictions
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    this.mlModels = this.initializeMLModels();
    this.featureEngineering = this.initializeFeatureEngineering();
  }

  initializeMLModels() {
    return {
      emissionPrediction: {
        type: 'time_series_forecasting',
        features: ['historical_emissions', 'seasonal_patterns', 'external_factors'],
        targetVariable: 'future_emissions',
        confidenceThreshold: 0.75
      },
      packagingOptimization: {
        type: 'multi_objective_optimization',
        features: ['material_type', 'recyclability', 'cost', 'carbon_footprint'],
        targetVariable: 'optimization_score',
        confidenceThreshold: 0.80
      },
      supplyChainRisk: {
        type: 'anomaly_detection',
        features: ['supplier_performance', 'geographic_risk', 'regulatory_changes'],
        targetVariable: 'risk_score',
        confidenceThreshold: 0.70
      },
      regulatoryCompliance: {
        type: 'classification',
        features: ['regulation_text', 'region', 'industry_sector'],
        targetVariable: 'compliance_status',
        confidenceThreshold: 0.85
      }
    };
  }

  initializeFeatureEngineering() {
    return {
      timeSeriesFeatures: [
        'moving_averages',
        'seasonal_decomposition',
        'trend_analysis',
        'lag_features',
        'rolling_statistics'
      ],
      categoricalFeatures: [
        'one_hot_encoding',
        'label_encoding',
        'target_encoding'
      ],
      numericalFeatures: [
        'normalization',
        'standardization',
        'polynomial_features',
        'interaction_features'
      ]
    };
  }

  /**
   * Advanced Emission Prediction using Time Series Forecasting
   */
  async predictEmissionsAdvanced(historicalData, scenario, timeHorizon = '2030') {
    try {
      const prompt = this.buildMLPrompt('emission_prediction', {
        historicalData: JSON.stringify(historicalData),
        scenario: JSON.stringify(scenario),
        timeHorizon,
        modelType: 'time_series_forecasting',
        features: this.mlModels.emissionPrediction.features
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const prediction = this.parseMLResponse(response.text());

      logger.info(`Generated advanced emission prediction for scenario: ${scenario.name}`);

      return {
        prediction: prediction.forecast,
        confidence: prediction.confidence,
        methodology: 'Gemini 1.5 Flash Time Series Forecasting',
        features_used: this.mlModels.emissionPrediction.features,
        model_performance: prediction.performance_metrics,
        uncertainty_bounds: prediction.uncertainty_bounds,
        scenario: scenario.name,
        timeHorizon,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in advanced emission prediction:', error);
      throw error;
    }
  }

  /**
   * Packaging Material Optimization using Multi-Objective Optimization
   */
  async optimizePackagingMaterials(currentPackaging, constraints, objectives) {
    try {
      const prompt = this.buildMLPrompt('packaging_optimization', {
        currentPackaging: JSON.stringify(currentPackaging),
        constraints: JSON.stringify(constraints),
        objectives: JSON.stringify(objectives),
        modelType: 'multi_objective_optimization',
        features: this.mlModels.packagingOptimization.features
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const optimization = this.parseMLResponse(response.text());

      logger.info('Generated packaging material optimization recommendations');

      return {
        optimized_materials: optimization.recommendations,
        trade_offs: optimization.trade_offs,
        performance_improvement: optimization.improvement_metrics,
        confidence: optimization.confidence,
        methodology: 'Gemini 1.5 Flash Multi-Objective Optimization',
        pareto_frontier: optimization.pareto_solutions,
        sensitivity_analysis: optimization.sensitivity,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in packaging optimization:', error);
      throw error;
    }
  }

  /**
   * Supply Chain Risk Assessment using Anomaly Detection
   */
  async assessSupplyChainRisk(supplyChainData, riskFactors) {
    try {
      const prompt = this.buildMLPrompt('supply_chain_risk', {
        supplyChainData: JSON.stringify(supplyChainData),
        riskFactors: JSON.stringify(riskFactors),
        modelType: 'anomaly_detection',
        features: this.mlModels.supplyChainRisk.features
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const riskAssessment = this.parseMLResponse(response.text());

      logger.info('Generated supply chain risk assessment');

      return {
        overall_risk_score: riskAssessment.risk_score,
        risk_categories: riskAssessment.risk_breakdown,
        anomalies_detected: riskAssessment.anomalies,
        mitigation_strategies: riskAssessment.mitigation,
        confidence: riskAssessment.confidence,
        methodology: 'Gemini 1.5 Flash Anomaly Detection',
        risk_timeline: riskAssessment.timeline,
        monitoring_recommendations: riskAssessment.monitoring,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in supply chain risk assessment:', error);
      throw error;
    }
  }

  /**
   * Regulatory Compliance Classification
   */
  async classifyRegulatoryCompliance(regulationText, region, context) {
    try {
      const prompt = this.buildMLPrompt('regulatory_compliance', {
        regulationText,
        region,
        context: JSON.stringify(context),
        modelType: 'text_classification',
        features: this.mlModels.regulatoryCompliance.features
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const classification = this.parseMLResponse(response.text());

      logger.info(`Classified regulatory compliance for region: ${region}`);

      return {
        compliance_status: classification.status,
        compliance_score: classification.score,
        risk_level: classification.risk_level,
        required_actions: classification.actions,
        deadline_analysis: classification.deadlines,
        confidence: classification.confidence,
        methodology: 'Gemini 1.5 Flash Text Classification',
        regulatory_categories: classification.categories,
        impact_assessment: classification.impact,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in regulatory compliance classification:', error);
      throw error;
    }
  }

  /**
   * Feature Engineering for ML Models
   */
  async engineerFeatures(rawData, featureType, targetVariable) {
    try {
      const prompt = this.buildMLPrompt('feature_engineering', {
        rawData: JSON.stringify(rawData),
        featureType,
        targetVariable,
        availableFeatures: this.featureEngineering[featureType] || []
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const engineeredFeatures = this.parseMLResponse(response.text());

      logger.info(`Engineered features for type: ${featureType}`);

      return {
        engineered_features: engineeredFeatures.features,
        feature_importance: engineeredFeatures.importance,
        feature_correlations: engineeredFeatures.correlations,
        data_quality_metrics: engineeredFeatures.quality,
        preprocessing_steps: engineeredFeatures.preprocessing,
        methodology: 'Gemini 1.5 Flash Feature Engineering',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in feature engineering:', error);
      throw error;
    }
  }

  /**
   * Model Performance Evaluation
   */
  async evaluateModelPerformance(modelType, predictions, actualValues, metrics = []) {
    try {
      const prompt = this.buildMLPrompt('model_evaluation', {
        modelType,
        predictions: JSON.stringify(predictions),
        actualValues: JSON.stringify(actualValues),
        requestedMetrics: metrics
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const evaluation = this.parseMLResponse(response.text());

      logger.info(`Evaluated performance for model type: ${modelType}`);

      return {
        performance_metrics: evaluation.metrics,
        model_accuracy: evaluation.accuracy,
        confusion_matrix: evaluation.confusion_matrix,
        feature_importance: evaluation.feature_importance,
        model_insights: evaluation.insights,
        recommendations: evaluation.recommendations,
        methodology: 'Gemini 1.5 Flash Model Evaluation',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in model evaluation:', error);
      throw error;
    }
  }

  /**
   * Build ML-specific prompts for Gemini 1.5 Flash
   */
  buildMLPrompt(taskType, data) {
    const basePrompt = `You are an expert machine learning engineer specializing in sustainability analytics for CCEP. `;
    
    const taskPrompts = {
      emission_prediction: `
        ${basePrompt}
        
        Task: Advanced Time Series Forecasting for GHG Emissions
        
        Historical Data: ${data.historicalData}
        Scenario: ${data.scenario}
        Time Horizon: ${data.timeHorizon}
        Model Features: ${data.features}
        
        Provide a comprehensive ML prediction including:
        1. Forecast values with confidence intervals
        2. Seasonal patterns and trends
        3. Feature importance analysis
        4. Model performance metrics (MAE, RMSE, MAPE)
        5. Uncertainty quantification
        6. Scenario sensitivity analysis
        
        Return as structured JSON with numerical predictions.
      `,
      
      packaging_optimization: `
        ${basePrompt}
        
        Task: Multi-Objective Packaging Material Optimization
        
        Current Packaging: ${data.currentPackaging}
        Constraints: ${data.constraints}
        Objectives: ${data.objectives}
        Model Features: ${data.features}
        
        Provide optimization recommendations including:
        1. Pareto-optimal material combinations
        2. Trade-off analysis between objectives
        3. Performance improvement metrics
        4. Sensitivity analysis
        5. Implementation roadmap
        6. Cost-benefit analysis
        
        Return as structured JSON with optimization results.
      `,
      
      supply_chain_risk: `
        ${basePrompt}
        
        Task: Supply Chain Risk Assessment using Anomaly Detection
        
        Supply Chain Data: ${data.supplyChainData}
        Risk Factors: ${data.riskFactors}
        Model Features: ${data.features}
        
        Provide risk assessment including:
        1. Overall risk score (0-100)
        2. Anomaly detection results
        3. Risk category breakdown
        4. Mitigation strategies
        5. Monitoring recommendations
        6. Timeline for risk evolution
        
        Return as structured JSON with risk analysis.
      `,
      
      regulatory_compliance: `
        ${basePrompt}
        
        Task: Regulatory Compliance Text Classification
        
        Regulation Text: ${data.regulationText}
        Region: ${data.region}
        Context: ${data.context}
        Model Features: ${data.features}
        
        Provide compliance classification including:
        1. Compliance status and score
        2. Risk level assessment
        3. Required actions and deadlines
        4. Regulatory category classification
        5. Impact assessment
        6. Compliance roadmap
        
        Return as structured JSON with classification results.
      `,
      
      feature_engineering: `
        ${basePrompt}
        
        Task: Advanced Feature Engineering
        
        Raw Data: ${data.rawData}
        Feature Type: ${data.featureType}
        Target Variable: ${data.targetVariable}
        Available Features: ${data.availableFeatures}
        
        Provide feature engineering including:
        1. Engineered feature definitions
        2. Feature importance rankings
        3. Feature correlations
        4. Data quality metrics
        5. Preprocessing recommendations
        6. Feature selection strategies
        
        Return as structured JSON with engineered features.
      `,
      
      model_evaluation: `
        ${basePrompt}
        
        Task: Comprehensive Model Performance Evaluation
        
        Model Type: ${data.modelType}
        Predictions: ${data.predictions}
        Actual Values: ${data.actualValues}
        Requested Metrics: ${data.requestedMetrics}
        
        Provide evaluation including:
        1. Performance metrics (accuracy, precision, recall, F1)
        2. Confusion matrix analysis
        3. Feature importance
        4. Model insights and interpretability
        5. Improvement recommendations
        6. Bias and fairness analysis
        
        Return as structured JSON with evaluation results.
      `
    };

    return taskPrompts[taskType] || `${basePrompt}\n\nTask: ${taskType}\nData: ${JSON.stringify(data)}`;
  }

  /**
   * Parse ML response from Gemini 1.5 Flash
   */
  parseMLResponse(content) {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Try direct JSON parsing
      return JSON.parse(content);
    } catch {
      // If not JSON, return structured text response
      return {
        raw_response: content,
        confidence: 0.7,
        format: 'text',
        parsed: false
      };
    }
  }

  /**
   * Get ML Service Status
   */
  async getMLServiceStatus() {
    try {
      const testPrompt = 'Test ML service connection with Gemini 1.5 Flash';
      const result = await this.model.generateContent(testPrompt);
      const response = await result.response;
      
      return {
        status: 'healthy',
        provider: 'Google Gemini 1.5 Flash',
        model: 'gemini-1.5-flash',
        ml_models_available: Object.keys(this.mlModels),
        feature_engineering_types: Object.keys(this.featureEngineering),
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

module.exports = MLService;
