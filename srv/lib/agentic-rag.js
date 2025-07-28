const { OpenAI } = require('openai');
const { FaissStore } = require('langchain/vectorstores/faiss');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const winston = require('winston');
const path = require('path');
const fs = require('fs').promises;

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/agentic-rag.log' }),
    new winston.transports.Console()
  ]
});

class AgenticRAGSystem {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002'
    });
    
    this.vectorStore = null;
    this.agents = {};
    this.knowledgeBase = new Map();
    
    this.initializeAgents();
  }

  async initialize() {
    try {
      await this.loadKnowledgeBase();
      await this.initializeVectorStore();
      logger.info('Agentic RAG System initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Agentic RAG System:', error);
      throw error;
    }
  }

  initializeAgents() {
    this.agents = {
      packaging: new PackagingAnalysisAgent(this),
      emission: new EmissionTrackingAgent(this),
      supplyChain: new SupplyChainAgent(this),
      regulatory: new RegulatoryComplianceAgent(this)
    };
  }

  async loadKnowledgeBase() {
    const knowledgeFiles = [
      'sustainability-guidelines.txt',
      'packaging-standards.txt',
      'emission-factors.txt',
      'regulatory-requirements.txt',
      'ccep-policies.txt'
    ];

    for (const file of knowledgeFiles) {
      try {
        const filePath = path.join(__dirname, '../data/knowledge', file);
        const content = await fs.readFile(filePath, 'utf-8');
        this.knowledgeBase.set(file, content);
      } catch (error) {
        logger.warn(`Knowledge file ${file} not found, using default content`);
        this.knowledgeBase.set(file, this.getDefaultKnowledge(file));
      }
    }
  }

  getDefaultKnowledge(filename) {
    const defaultKnowledge = {
      'sustainability-guidelines.txt': `
        CCEP Sustainability Guidelines:
        - 30% GHG emission reduction by 2030
        - 100% recyclable packaging by 2025
        - 50% recycled content in PET bottles by 2025
        - Packaging accounts for 38% of carbon footprint
        - Focus on circular economy principles
      `,
      'packaging-standards.txt': `
        Packaging Standards:
        - PET bottles: Target 50% recycled content
        - Aluminum cans: 100% recyclable
        - Glass bottles: 100% recyclable
        - Collection rates: Europe 76.7%, Asia Pacific 53%
        - FSC certification required for paper-based packaging
      `,
      'emission-factors.txt': `
        Emission Factors (kg CO2e):
        - PET: 0.085 per bottle
        - Aluminum: 0.156 per can
        - Glass: 0.234 per bottle
        - Transportation: 0.12 per km
        - Manufacturing: varies by facility
      `,
      'regulatory-requirements.txt': `
        Key Regulations:
        - EU Single-Use Plastics Directive
        - Extended Producer Responsibility
        - Packaging and Packaging Waste Directive
        - Asia Pacific recycling mandates
        - Carbon reporting requirements
      `,
      'ccep-policies.txt': `
        CCEP Policies:
        - Sustainable packaging strategy
        - Climate action commitments
        - Supplier sustainability requirements
        - Innovation in packaging materials
        - Stakeholder engagement principles
      `
    };
    return defaultKnowledge[filename] || '';
  }

  async initializeVectorStore() {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: parseInt(process.env.RAG_CHUNK_SIZE) || 1000,
      chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP) || 200
    });

    const documents = [];
    for (const [filename, content] of this.knowledgeBase) {
      const chunks = await textSplitter.splitText(content);
      chunks.forEach((chunk, index) => {
        documents.push({
          pageContent: chunk,
          metadata: { source: filename, chunk: index }
        });
      });
    }

    this.vectorStore = await FaissStore.fromDocuments(documents, this.embeddings);
    logger.info(`Vector store initialized with ${documents.length} documents`);
  }

  async queryKnowledge(query, agentType = 'general', topK = 5) {
    try {
      if (!this.vectorStore) {
        await this.initializeVectorStore();
      }

      const results = await this.vectorStore.similaritySearch(query, topK);
      const context = results.map(doc => doc.pageContent).join('\n\n');
      
      logger.info(`Knowledge query processed: ${query.substring(0, 50)}...`);
      return {
        context,
        sources: results.map(doc => doc.metadata),
        confidence: this.calculateConfidence(results)
      };
    } catch (error) {
      logger.error('Error querying knowledge base:', error);
      throw error;
    }
  }

  calculateConfidence(results) {
    if (results.length === 0) return 0;
    // Simple confidence calculation based on result count and similarity
    return Math.min(0.95, 0.5 + (results.length * 0.1));
  }

  async processQuery(query, agentType = 'general') {
    try {
      const agent = this.agents[agentType];
      if (!agent) {
        throw new Error(`Unknown agent type: ${agentType}`);
      }

      const knowledge = await this.queryKnowledge(query, agentType);
      const response = await agent.processQuery(query, knowledge);
      
      return {
        response: response.answer,
        confidence: response.confidence,
        sources: knowledge.sources,
        agentType,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error processing query:', error);
      throw error;
    }
  }

  async generateInsights(data, analysisType = 'general') {
    try {
      const agent = this.getAgentForAnalysis(analysisType);
      return await agent.generateInsights(data);
    } catch (error) {
      logger.error('Error generating insights:', error);
      throw error;
    }
  }

  getAgentForAnalysis(analysisType) {
    const agentMap = {
      packaging: this.agents.packaging,
      emissions: this.agents.emission,
      supply_chain: this.agents.supplyChain,
      regulatory: this.agents.regulatory
    };
    return agentMap[analysisType] || this.agents.packaging;
  }
}

// Base Agent Class
class BaseAgent {
  constructor(ragSystem) {
    this.ragSystem = ragSystem;
    this.openai = ragSystem.openai;
    this.specialization = 'general';
  }

  async processQuery(query, knowledge) {
    const prompt = this.buildPrompt(query, knowledge.context);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
      });

      return {
        answer: response.choices[0].message.content,
        confidence: knowledge.confidence,
        usage: response.usage
      };
    } catch (error) {
      logger.error(`Error in ${this.specialization} agent:`, error);
      throw error;
    }
  }

  buildPrompt(query, context) {
    return `
Context Information:
${context}

User Query: ${query}

Please provide a comprehensive answer based on the context information above. 
Focus on CCEP's sustainability goals and provide actionable insights.
`;
  }

  getSystemPrompt() {
    return `You are a specialized AI agent for CCEP (Coca-Cola EuroPacific Partners) sustainability analytics.
Your role is to provide expert analysis and recommendations based on sustainability data and industry best practices.
Always consider CCEP's specific targets: 30% GHG reduction, 100% recyclable packaging by 2025, and 50% recycled content in PET bottles.`;
  }

  async generateInsights(data) {
    // Base implementation - to be overridden by specialized agents
    return {
      insights: 'General sustainability insights based on provided data.',
      recommendations: ['Review current performance', 'Identify improvement opportunities'],
      confidence: 0.7
    };
  }
}

// Specialized Agents
class PackagingAnalysisAgent extends BaseAgent {
  constructor(ragSystem) {
    super(ragSystem);
    this.specialization = 'packaging';
  }

  getSystemPrompt() {
    return `You are a packaging sustainability expert for CCEP. You specialize in:
- Packaging material analysis and optimization
- Recyclability assessment
- Recycled content strategies
- Collection rate improvements
- Packaging carbon footprint reduction
- Circular economy principles in packaging

Key CCEP targets:
- 100% recyclable packaging by 2025
- 50% recycled content in PET bottles by 2025
- Improve collection rates: Europe to 85%, Asia Pacific to 70%
- Reduce packaging carbon footprint (currently 38% of total)`;
  }

  async generateInsights(packagingData) {
    const analysis = this.analyzePackagingPerformance(packagingData);
    
    return {
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      kpis: analysis.kpis,
      confidence: 0.9
    };
  }

  analyzePackagingPerformance(data) {
    // Analyze packaging metrics and generate insights
    const insights = [];
    const recommendations = [];
    const kpis = {};

    if (data.recyclableContent < 95) {
      insights.push(`Current recyclable content at ${data.recyclableContent}% is below optimal levels`);
      recommendations.push('Prioritize transition to fully recyclable materials');
    }

    if (data.recycledContent < 50) {
      insights.push(`Recycled content at ${data.recycledContent}% needs improvement to meet 2025 target`);
      recommendations.push('Increase supplier partnerships for recycled materials');
    }

    return { insights, recommendations, kpis };
  }
}

class EmissionTrackingAgent extends BaseAgent {
  constructor(ragSystem) {
    super(ragSystem);
    this.specialization = 'emission';
    this.emissionFactors = this.initializeEmissionFactors();
  }

  getSystemPrompt() {
    return `You are a carbon emissions expert for CCEP. You specialize in:
- GHG emissions tracking and reduction
- Carbon footprint analysis
- Scope 1, 2, and 3 emissions management
- Emission factor calculations
- Climate target achievement
- Carbon reduction strategies

Key CCEP target:
- 30% GHG emission reduction by 2030
- Focus on packaging emissions (38% of total footprint)`;
  }

  initializeEmissionFactors() {
    return {
      packaging: {
        PET: 0.085, // kg CO2e per bottle
        aluminum: 0.156, // kg CO2e per can
        glass: 0.234, // kg CO2e per bottle
        paperboard: 0.045 // kg CO2e per unit
      },
      transportation: {
        truck: 0.12, // kg CO2e per km
        rail: 0.03, // kg CO2e per km
        ship: 0.015 // kg CO2e per km
      },
      energy: {
        electricity_grid: 0.45, // kg CO2e per kWh
        natural_gas: 0.18, // kg CO2e per kWh
        renewable: 0.02 // kg CO2e per kWh
      }
    };
  }

  async generateInsights(emissionData) {
    const analysis = this.analyzeEmissionTrends(emissionData);
    const predictions = await this.predictEmissionReduction(emissionData);

    return {
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      predictions: predictions,
      kpis: analysis.kpis,
      confidence: 0.88
    };
  }

  analyzeEmissionTrends(data) {
    const insights = [];
    const recommendations = [];
    const kpis = {};

    // Calculate reduction percentage
    const reductionPercentage = ((data.baseline - data.value) / data.baseline) * 100;
    kpis.currentReduction = reductionPercentage;
    kpis.targetReduction = 30;
    kpis.gapToTarget = 30 - reductionPercentage;

    if (reductionPercentage < 30) {
      insights.push(`Current emission reduction at ${reductionPercentage.toFixed(1)}% is below 30% target`);
      recommendations.push('Accelerate packaging optimization and renewable energy adoption');
    }

    if (data.source === 'Packaging' && data.value > data.baseline * 0.62) {
      insights.push('Packaging emissions remain high - focus area for reduction');
      recommendations.push('Prioritize lightweight packaging and recycled content increase');
    }

    return { insights, recommendations, kpis };
  }

  async predictEmissionReduction(data) {
    // Simple trend-based prediction
    const historicalReduction = data.baseline - data.value;
    const annualReductionRate = historicalReduction / 3; // Assuming 3-year baseline

    return {
      projectedReduction2025: data.value - (annualReductionRate * 2),
      projectedReduction2030: data.value - (annualReductionRate * 7),
      confidenceLevel: 0.75
    };
  }

  calculateEmissionFootprint(material, quantity, transportDistance = 0) {
    let footprint = 0;

    // Material footprint
    if (this.emissionFactors.packaging[material]) {
      footprint += this.emissionFactors.packaging[material] * quantity;
    }

    // Transportation footprint (assuming truck transport)
    if (transportDistance > 0) {
      footprint += this.emissionFactors.transportation.truck * transportDistance;
    }

    return footprint;
  }
}

class SupplyChainAgent extends BaseAgent {
  constructor(ragSystem) {
    super(ragSystem);
    this.specialization = 'supplyChain';
    this.riskFactors = this.initializeRiskFactors();
    this.sustainabilityMetrics = this.initializeSustainabilityMetrics();
  }

  getSystemPrompt() {
    return `You are a sustainable supply chain expert for CCEP. You specialize in:
- Supplier sustainability assessment
- Supply chain carbon footprint
- Sustainable sourcing strategies
- Supplier engagement and development
- Supply chain risk management
- Circular supply chain design`;
  }

  initializeRiskFactors() {
    return {
      environmental: ['carbon_intensity', 'water_usage', 'waste_generation'],
      social: ['labor_practices', 'community_impact', 'safety_record'],
      governance: ['compliance_history', 'transparency', 'certifications'],
      operational: ['delivery_reliability', 'quality_consistency', 'capacity']
    };
  }

  initializeSustainabilityMetrics() {
    return {
      certifications: {
        'FSC': { weight: 0.3, description: 'Forest Stewardship Council' },
        'ISO14001': { weight: 0.25, description: 'Environmental Management' },
        'SBTi': { weight: 0.2, description: 'Science Based Targets' },
        'B-Corp': { weight: 0.15, description: 'Certified B Corporation' },
        'RSPO': { weight: 0.1, description: 'Sustainable Palm Oil' }
      },
      performance_indicators: {
        carbon_intensity: { target: '<0.5 kg CO2e/unit', weight: 0.4 },
        recycled_content: { target: '>50%', weight: 0.3 },
        renewable_energy: { target: '>80%', weight: 0.3 }
      }
    };
  }

  async generateInsights(supplierData) {
    const riskAssessment = this.assessSupplierRisk(supplierData);
    const sustainabilityScore = this.calculateSustainabilityScore(supplierData);
    const recommendations = this.generateSupplierRecommendations(supplierData, riskAssessment);

    return {
      insights: [
        `Supplier sustainability score: ${sustainabilityScore.overall}/10`,
        `Risk level: ${riskAssessment.overallRisk}`,
        `Key strengths: ${sustainabilityScore.strengths.join(', ')}`,
        `Improvement areas: ${sustainabilityScore.weaknesses.join(', ')}`
      ],
      recommendations: recommendations,
      riskAssessment: riskAssessment,
      sustainabilityScore: sustainabilityScore,
      confidence: 0.85
    };
  }

  assessSupplierRisk(supplier) {
    const risks = {
      environmental: this.assessEnvironmentalRisk(supplier),
      social: this.assessSocialRisk(supplier),
      governance: this.assessGovernanceRisk(supplier),
      operational: this.assessOperationalRisk(supplier)
    };

    const overallRiskScore = Object.values(risks).reduce((sum, risk) => sum + risk.score, 0) / 4;
    const overallRisk = overallRiskScore > 7 ? 'High' : overallRiskScore > 4 ? 'Medium' : 'Low';

    return {
      ...risks,
      overallRiskScore,
      overallRisk,
      criticalIssues: Object.values(risks).filter(risk => risk.score > 7).map(risk => risk.issues).flat()
    };
  }

  assessEnvironmentalRisk(supplier) {
    let score = 0;
    const issues = [];

    if (supplier.carbonIntensity > 0.5) {
      score += 3;
      issues.push('High carbon intensity');
    }

    if (supplier.recycledContentCapability < 30) {
      score += 2;
      issues.push('Low recycled content capability');
    }

    if (!supplier.certifications?.includes('ISO14001')) {
      score += 2;
      issues.push('Missing environmental management certification');
    }

    return { score, issues, category: 'Environmental' };
  }

  assessSocialRisk(supplier) {
    let score = 0;
    const issues = [];

    if (supplier.performanceRating < 7) {
      score += 2;
      issues.push('Below average performance rating');
    }

    // Add more social risk factors as needed
    return { score, issues, category: 'Social' };
  }

  assessGovernanceRisk(supplier) {
    let score = 0;
    const issues = [];

    if (!supplier.certifications || supplier.certifications.length === 0) {
      score += 3;
      issues.push('No sustainability certifications');
    }

    return { score, issues, category: 'Governance' };
  }

  assessOperationalRisk(supplier) {
    let score = 0;
    const issues = [];

    if (supplier.performanceRating < 8) {
      score += 1;
      issues.push('Performance rating could be improved');
    }

    return { score, issues, category: 'Operational' };
  }

  calculateSustainabilityScore(supplier) {
    let score = 0;
    const strengths = [];
    const weaknesses = [];

    // Certification scoring
    if (supplier.certifications) {
      const certList = supplier.certifications.split(',').map(c => c.trim());
      certList.forEach(cert => {
        if (this.sustainabilityMetrics.certifications[cert]) {
          score += this.sustainabilityMetrics.certifications[cert].weight * 10;
          strengths.push(cert);
        }
      });
    }

    // Performance indicators
    if (supplier.carbonIntensity <= 0.5) {
      score += 4;
      strengths.push('Low carbon intensity');
    } else {
      weaknesses.push('High carbon intensity');
    }

    if (supplier.recycledContentCapability >= 50) {
      score += 3;
      strengths.push('High recycled content capability');
    } else {
      weaknesses.push('Low recycled content capability');
    }

    return {
      overall: Math.min(10, Math.round(score)),
      strengths,
      weaknesses,
      breakdown: {
        certifications: Math.min(4, score * 0.4),
        performance: Math.min(3, supplier.performanceRating * 0.3),
        sustainability: Math.min(3, score * 0.3)
      }
    };
  }

  generateSupplierRecommendations(supplier, riskAssessment) {
    const recommendations = [];

    if (riskAssessment.overallRisk === 'High') {
      recommendations.push('Immediate supplier development program required');
      recommendations.push('Consider alternative suppliers for critical materials');
    }

    if (supplier.carbonIntensity > 0.5) {
      recommendations.push('Work with supplier to develop carbon reduction plan');
      recommendations.push('Set science-based targets for supplier emissions');
    }

    if (supplier.recycledContentCapability < 50) {
      recommendations.push('Support supplier in developing recycled content capabilities');
      recommendations.push('Provide technical assistance for material sourcing');
    }

    if (!supplier.certifications || supplier.certifications.length === 0) {
      recommendations.push('Encourage supplier to obtain relevant sustainability certifications');
      recommendations.push('Provide certification roadmap and support');
    }

    return recommendations;
  }
}

class RegulatoryComplianceAgent extends BaseAgent {
  constructor(ragSystem) {
    super(ragSystem);
    this.specialization = 'regulatory';
    this.regulations = this.initializeRegulations();
    this.complianceFrameworks = this.initializeComplianceFrameworks();
  }

  getSystemPrompt() {
    return `You are a regulatory compliance expert for CCEP. You specialize in:
- Environmental regulations and compliance
- Extended Producer Responsibility (EPR)
- Packaging waste directives
- Carbon reporting requirements
- Regional regulatory differences
- Compliance risk assessment`;
  }

  initializeRegulations() {
    return {
      europe: {
        'EU Single-Use Plastics Directive': {
          deadline: '2024-07-03',
          requirements: ['Ban on certain single-use plastics', 'Deposit return systems'],
          impact: 'High',
          status: 'Active'
        },
        'Packaging and Packaging Waste Directive': {
          deadline: '2025-12-31',
          requirements: ['90% collection rate for plastic bottles', '30% recycled content'],
          impact: 'High',
          status: 'Active'
        },
        'Extended Producer Responsibility': {
          deadline: '2024-12-31',
          requirements: ['Producer responsibility for packaging waste', 'Financial contributions'],
          impact: 'Medium',
          status: 'Active'
        }
      },
      asiaPacific: {
        'Plastic Waste Management Rules': {
          deadline: '2025-06-30',
          requirements: ['Plastic waste collection targets', 'Recycling mandates'],
          impact: 'Medium',
          status: 'Active'
        },
        'Carbon Pricing Mechanisms': {
          deadline: '2026-01-01',
          requirements: ['Carbon tax or ETS participation', 'Emission reporting'],
          impact: 'High',
          status: 'Planned'
        }
      },
      global: {
        'TCFD Reporting': {
          deadline: '2024-12-31',
          requirements: ['Climate risk disclosure', 'Scenario analysis'],
          impact: 'Medium',
          status: 'Active'
        },
        'Science Based Targets': {
          deadline: '2025-12-31',
          requirements: ['1.5°C aligned targets', 'Annual progress reporting'],
          impact: 'High',
          status: 'Voluntary'
        }
      }
    };
  }

  initializeComplianceFrameworks() {
    return {
      assessment_criteria: {
        legal_compliance: { weight: 0.4, description: 'Adherence to legal requirements' },
        voluntary_standards: { weight: 0.3, description: 'Voluntary sustainability standards' },
        stakeholder_expectations: { weight: 0.2, description: 'Stakeholder and investor expectations' },
        competitive_advantage: { weight: 0.1, description: 'Market differentiation opportunities' }
      },
      risk_levels: {
        critical: { score: 9-10, action: 'Immediate action required' },
        high: { score: 7-8, action: 'Priority attention needed' },
        medium: { score: 4-6, action: 'Monitor and plan' },
        low: { score: 1-3, action: 'Routine monitoring' }
      }
    };
  }

  async generateInsights(complianceData) {
    const assessment = this.assessComplianceStatus(complianceData);
    const riskAnalysis = this.analyzeComplianceRisks(complianceData);
    const recommendations = this.generateComplianceRecommendations(assessment, riskAnalysis);

    return {
      insights: [
        `Overall compliance status: ${assessment.overallStatus}`,
        `High-risk regulations: ${riskAnalysis.highRiskCount}`,
        `Upcoming deadlines: ${assessment.upcomingDeadlines.length}`,
        `Compliance score: ${assessment.complianceScore}/100`
      ],
      recommendations: recommendations,
      assessment: assessment,
      riskAnalysis: riskAnalysis,
      confidence: 0.92
    };
  }

  assessComplianceStatus(data) {
    const region = data.region || 'global';
    const relevantRegulations = this.regulations[region] || this.regulations.global;

    let compliantCount = 0;
    let totalCount = 0;
    const upcomingDeadlines = [];
    const nonCompliantItems = [];

    Object.entries(relevantRegulations).forEach(([name, regulation]) => {
      totalCount++;

      // Check deadline proximity
      const deadline = new Date(regulation.deadline);
      const now = new Date();
      const daysToDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

      if (daysToDeadline <= 90 && daysToDeadline > 0) {
        upcomingDeadlines.push({ name, deadline: regulation.deadline, days: daysToDeadline });
      }

      // Assess compliance based on data
      if (data.complianceStatus === 'Compliant' || data.complianceStatus === 'InProgress') {
        compliantCount++;
      } else {
        nonCompliantItems.push(name);
      }
    });

    const complianceScore = Math.round((compliantCount / totalCount) * 100);
    const overallStatus = complianceScore >= 90 ? 'Excellent' :
                         complianceScore >= 75 ? 'Good' :
                         complianceScore >= 60 ? 'Needs Improvement' : 'Critical';

    return {
      complianceScore,
      overallStatus,
      compliantCount,
      totalCount,
      upcomingDeadlines,
      nonCompliantItems
    };
  }

  analyzeComplianceRisks(data) {
    const risks = [];
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    const region = data.region || 'global';
    const relevantRegulations = this.regulations[region] || this.regulations.global;

    Object.entries(relevantRegulations).forEach(([name, regulation]) => {
      const riskScore = this.calculateRegulatoryRisk(regulation, data);
      const riskLevel = this.getRiskLevel(riskScore);

      risks.push({
        regulation: name,
        riskScore,
        riskLevel,
        impact: regulation.impact,
        deadline: regulation.deadline
      });

      if (riskLevel === 'High' || riskLevel === 'Critical') highRiskCount++;
      else if (riskLevel === 'Medium') mediumRiskCount++;
      else lowRiskCount++;
    });

    return {
      risks: risks.sort((a, b) => b.riskScore - a.riskScore),
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      overallRiskLevel: highRiskCount > 0 ? 'High' : mediumRiskCount > 2 ? 'Medium' : 'Low'
    };
  }

  calculateRegulatoryRisk(regulation, data) {
    let riskScore = 0;

    // Impact factor
    if (regulation.impact === 'High') riskScore += 4;
    else if (regulation.impact === 'Medium') riskScore += 2;
    else riskScore += 1;

    // Deadline proximity
    const deadline = new Date(regulation.deadline);
    const now = new Date();
    const daysToDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    if (daysToDeadline <= 30) riskScore += 4;
    else if (daysToDeadline <= 90) riskScore += 3;
    else if (daysToDeadline <= 180) riskScore += 2;
    else riskScore += 1;

    // Compliance status
    if (data.complianceStatus === 'NonCompliant') riskScore += 3;
    else if (data.complianceStatus === 'InProgress') riskScore += 1;

    return Math.min(10, riskScore);
  }

  getRiskLevel(score) {
    if (score >= 9) return 'Critical';
    if (score >= 7) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  }

  generateComplianceRecommendations(assessment, riskAnalysis) {
    const recommendations = [];

    if (assessment.complianceScore < 75) {
      recommendations.push('Develop comprehensive compliance improvement plan');
      recommendations.push('Allocate additional resources to compliance activities');
    }

    if (assessment.upcomingDeadlines.length > 0) {
      recommendations.push(`Address ${assessment.upcomingDeadlines.length} upcoming regulatory deadlines`);
      assessment.upcomingDeadlines.forEach(deadline => {
        if (deadline.days <= 30) {
          recommendations.push(`URGENT: ${deadline.name} deadline in ${deadline.days} days`);
        }
      });
    }

    if (riskAnalysis.highRiskCount > 0) {
      recommendations.push('Prioritize high-risk regulatory compliance items');
      recommendations.push('Consider engaging external compliance experts');
    }

    riskAnalysis.risks.slice(0, 3).forEach(risk => {
      if (risk.riskLevel === 'High' || risk.riskLevel === 'Critical') {
        recommendations.push(`Address ${risk.regulation} compliance gaps immediately`);
      }
    });

    return recommendations;
  }
}

module.exports = {
  AgenticRAGSystem,
  PackagingAnalysisAgent,
  EmissionTrackingAgent,
  SupplyChainAgent,
  RegulatoryComplianceAgent
};
