using {ccep.sustainability as db} from '../db/data-model';

service SustainabilityService @(path: '/sustainability') {

  // Core Data Entities
  @readonly
  entity PackagingMetrics as projection on db.PackagingMetrics {
    *
  } actions {
    action analyzePackaging() returns String;
    action optimizeRecyclability() returns String;
    action calculateFootprint() returns Decimal;
  };

  @readonly
  entity EmissionData as projection on db.EmissionData {
    *
  } actions {
    action predictEmissions(scenario: String) returns String;
    action analyzeReductionPath() returns String;
    action validateEmissionData() returns Boolean;
  };

  @readonly
  entity SustainabilityInsights as projection on db.SustainabilityInsights {
    *
  } actions {
    action regenerateInsight() returns String;
    action validateInsight() returns Boolean;
    action implementRecommendation(recommendationId: String) returns String;
  };

  @readonly
  entity SupplyChainData as projection on db.SupplyChainData {
    *
  };

  @readonly
  entity RegulatoryCompliance as projection on db.RegulatoryCompliance {
    *
  };

  @readonly
  entity KPITracking as projection on db.KPITracking {
    *
  };

  // AI-Powered Functions
  function analyzePackaging(
    material: String,
    region: String,
    analysisType: String
  ) returns {
    analysis: String;
    recommendations: array of String;
    confidence: Decimal;
    insights: String;
  };

  function predictEmissions(
    scenario: String,
    timeHorizon: String,
    region: String
  ) returns {
    prediction: Decimal;
    confidence: Decimal;
    methodology: String;
    assumptions: array of String;
    scenarios: array of {
      name: String;
      value: Decimal;
      probability: Decimal;
    };
  };

  function generateReport(
    reportType: String,
    period: String,
    region: String,
    includeAI: Boolean
  ) returns {
    report: LargeString;
    reportId: String;
    generatedAt: DateTime;
    format: String;
    sections: array of String;
  };

  // RAG Functions
  function queryInsights(
    question: String,
    context: String,
    agentType: String
  ) returns {
    answer: String;
    confidence: Decimal;
    sources: array of String;
    relatedQuestions: array of String;
    agentUsed: String;
  };

  function getRecommendations(
    target: String,
    currentData: String,
    priority: String
  ) returns array of {
    recommendation: String;
    priority: String;
    impact: String;
    effort: String;
    timeline: String;
    kpiImpact: array of String;
  };

  function performScenarioAnalysis(
    baseScenario: String,
    variables: array of String,
    timeHorizon: String
  ) returns {
    scenarios: array of {
      name: String;
      description: String;
      outcomes: array of String;
      probability: Decimal;
      impact: String;
    };
    recommendations: array of String;
    riskFactors: array of String;
  };

  // Dashboard and Analytics Functions
  function getDashboardData(
    region: String,
    period: String,
    kpis: array of String
  ) returns {
    overview: {
      ghgReduction: Decimal;
      recyclablePackaging: Decimal;
      recycledContent: Decimal;
      collectionRate: Decimal;
    };
    trends: array of {
      kpi: String;
      trend: String;
      change: Decimal;
    };
    alerts: array of {
      type: String;
      message: String;
      severity: String;
    };
    regionalComparison: {
      europe: String;
      asiaPacific: String;
    };
  };

  function getKPIAnalysis(
    kpiName: String,
    region: String,
    timeRange: String
  ) returns {
    currentValue: Decimal;
    targetValue: Decimal;
    progress: Decimal;
    trend: String;
    forecast: array of {
      period: String;
      predictedValue: Decimal;
      confidence: Decimal;
    };
    recommendations: array of String;
  };

  // AI Chat Interface
  function processChatQuery(
    query: String,
    sessionId: String,
    userId: String,
    context: String
  ) returns {
    response: String;
    confidence: Decimal;
    suggestedActions: array of String;
    relatedData: array of String;
    followUpQuestions: array of String;
    sessionId: String;
  };

  // Data Import and Export Functions
  function importSustainabilityData(
    dataType: String,
    format: String,
    data: LargeString
  ) returns {
    success: Boolean;
    recordsProcessed: Integer;
    errors: array of String;
    warnings: array of String;
    importId: String;
  };

  function exportSustainabilityData(
    dataType: String,
    format: String,
    filters: String,
    includeAI: Boolean
  ) returns {
    data: LargeString;
    format: String;
    recordCount: Integer;
    exportId: String;
    generatedAt: DateTime;
  };

  // Validation and Quality Functions
  function validateDataQuality(
    dataType: String,
    validationRules: array of String
  ) returns {
    isValid: Boolean;
    score: Decimal;
    issues: array of {
      field: String;
      issue: String;
      severity: String;
      recommendation: String;
    };
    summary: String;
  };

  function calculateSustainabilityScore(
    entity: String,
    entityId: String,
    criteria: array of String
  ) returns {
    overallScore: Decimal;
    categoryScores: array of {
      category: String;
      score: Decimal;
      weight: Decimal;
    };
    benchmarkComparison: String;
    improvementAreas: array of String;
  };

  // Notification and Alert Functions
  function getAlerts(
    severity: String,
    category: String,
    region: String
  ) returns array of {
    id: String;
    type: String;
    message: String;
    severity: String;
    category: String;
    region: String;
    createdAt: DateTime;
    actionRequired: Boolean;
    suggestedActions: array of String;
  };

  function createAlert(
    type: String,
    message: String,
    severity: String,
    category: String,
    region: String,
    actionRequired: Boolean
  ) returns {
    alertId: String;
    created: Boolean;
    notificationsSent: Integer;
  };

  // Integration Functions
  function syncExternalData(
    source: String,
    dataType: String,
    lastSync: DateTime
  ) returns {
    success: Boolean;
    recordsSynced: Integer;
    lastSyncTime: DateTime;
    errors: array of String;
    nextSyncScheduled: DateTime;
  };

  function getModelPerformance(
    modelName: String,
    timeRange: String
  ) returns {
    accuracy: Decimal;
    precision: Decimal;
    recall: Decimal;
    f1Score: Decimal;
    latency: Integer;
    throughput: Integer;
    errorRate: Decimal;
    lastEvaluated: DateTime;
    recommendations: array of String;
  };

  // Health Check and Status
  function getSystemHealth() returns {
    status: String;
    services: array of {
      name: String;
      status: String;
      lastCheck: DateTime;
      responseTime: Integer;
    };
    aiServices: {
      openai: String;
      ragSystem: String;
      vectorStore: String;
    };
    database: {
      status: String;
      connectionPool: Integer;
      queryPerformance: Decimal;
    };
  };
}
