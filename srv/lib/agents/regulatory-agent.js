const BaseAgent = require('./base-agent');

/**
 * Regulatory Compliance Agent for CCEP Sustainability Analytics
 * Specializes in environmental regulations, compliance monitoring, and regulatory risk assessment
 */
class RegulatoryComplianceAgent extends BaseAgent {
  constructor(ragSystem) {
    super(ragSystem);
    this.specialization = 'regulatory';
    this.regulations = this.initializeRegulations();
    this.complianceThresholds = this.initializeComplianceThresholds();
  }

  /**
   * Initialize key regulations and requirements
   */
  initializeRegulations() {
    return {
      europe: {
        'EU Single-Use Plastics Directive': {
          deadline: '2024-12-31',
          requirements: ['Ban on certain single-use plastics', '90% collection target for PET bottles'],
          riskLevel: 'High',
          penalties: 'Significant fines and market restrictions'
        },
        'Extended Producer Responsibility (EPR)': {
          deadline: '2025-06-30',
          requirements: ['Producer responsibility for packaging waste', 'Financial contributions to recycling'],
          riskLevel: 'High',
          penalties: 'Financial penalties and operational restrictions'
        },
        'Packaging and Packaging Waste Directive': {
          deadline: '2025-12-31',
          requirements: ['Recycling targets', 'Reusable packaging requirements'],
          riskLevel: 'Medium',
          penalties: 'Fines and compliance orders'
        },
        'EU Taxonomy Regulation': {
          deadline: '2024-01-01',
          requirements: ['Sustainability reporting', 'Green investment classification'],
          riskLevel: 'Medium',
          penalties: 'Reporting violations and investor scrutiny'
        }
      },
      asiaPacific: {
        'China Plastic Waste Import Ban': {
          deadline: '2024-01-01',
          requirements: ['Domestic recycling capacity', 'Waste reduction targets'],
          riskLevel: 'High',
          penalties: 'Import restrictions and operational limitations'
        },
        'Japan Plastic Resource Circulation Act': {
          deadline: '2025-04-01',
          requirements: ['Plastic waste reduction', 'Recycling promotion'],
          riskLevel: 'Medium',
          penalties: 'Administrative guidance and fines'
        },
        'Australia National Packaging Targets': {
          deadline: '2025-12-31',
          requirements: ['100% recyclable packaging', '70% recycling rate'],
          riskLevel: 'Medium',
          penalties: 'Industry sanctions and public reporting'
        }
      },
      global: {
        'Paris Agreement': {
          deadline: '2030-12-31',
          requirements: ['GHG emission reduction', 'Climate reporting'],
          riskLevel: 'High',
          penalties: 'International sanctions and reputation damage'
        },
        'UN Sustainable Development Goals': {
          deadline: '2030-12-31',
          requirements: ['Sustainability targets', 'Progress reporting'],
          riskLevel: 'Low',
          penalties: 'Reputation and stakeholder pressure'
        }
      }
    };
  }

  /**
   * Initialize compliance assessment thresholds
   */
  initializeComplianceThresholds() {
    return {
      compliant: { min: 90, max: 100 },
      nearCompliant: { min: 75, max: 89 },
      partialCompliant: { min: 50, max: 74 },
      nonCompliant: { min: 0, max: 49 }
    };
  }

  /**
   * Get specialized system prompt for regulatory analysis
   */
  getSystemPrompt() {
    return `You are a regulatory compliance expert for CCEP. You specialize in:
- Environmental regulations and compliance monitoring
- Extended Producer Responsibility (EPR) requirements
- Packaging waste directives and implementation
- Carbon reporting and climate regulations
- Regional regulatory differences and harmonization
- Compliance risk assessment and mitigation
- Regulatory change monitoring and impact analysis
- Stakeholder engagement on regulatory matters

Key Regulatory Focus Areas:
- EU Single-Use Plastics Directive and EPR requirements
- Packaging and Packaging Waste Directive compliance
- Asia Pacific plastic waste and recycling regulations
- Paris Agreement and climate reporting obligations
- Emerging sustainability disclosure requirements

Regional Regulatory Landscape:
- Europe: Comprehensive and strict environmental regulations
- Asia Pacific: Rapidly evolving regulatory framework
- Global: International agreements and voluntary standards

Compliance Framework: Legal requirements, industry standards, voluntary commitments
Always provide specific regulatory references, deadlines, and actionable compliance strategies.`;
  }

  /**
   * Generate comprehensive regulatory compliance insights
   */
  async generateInsights(complianceData) {
    try {
      if (!this.validateData(complianceData, ['regulation', 'region'])) {
        throw new Error('Invalid compliance data provided');
      }

      const analysis = await this.analyzeComplianceStatus(complianceData);
      const recommendations = this.generateComplianceRecommendations(analysis);
      const kpis = this.calculateComplianceKPIs(complianceData);
      const riskAssessment = this.assessRegulatoryRisk(complianceData);

      this.logger.info(`Generated regulatory insights for ${complianceData.regulation} in ${complianceData.region}`);

      return {
        insights: analysis.insights,
        recommendations: this.formatRecommendations(recommendations),
        kpis: kpis,
        riskAssessment: riskAssessment,
        confidence: this.calculateConfidence(complianceData, analysis.insights.join(' ')),
        agent: this.specialization,
        timestamp: new Date().toISOString(),
        complianceAnalysis: analysis.complianceSpecific
      };
    } catch (error) {
      this.logger.error('Error generating regulatory insights:', error);
      throw error;
    }
  }

  /**
   * Analyze compliance status against regulatory requirements
   */
  async analyzeComplianceStatus(data) {
    const insights = [];
    const complianceSpecific = {};
    const regulation = this.findRegulation(data.regulation, data.region);

    // Compliance Status Analysis
    const complianceLevel = this.assessComplianceLevel(data.complianceStatus);
    insights.push(`${data.regulation} compliance status is ${data.complianceStatus} (${complianceLevel})`);
    complianceSpecific.complianceLevel = complianceLevel;

    // Deadline Analysis
    if (data.deadline) {
      const daysToDeadline = this.calculateDaysToDeadline(data.deadline);
      const urgency = this.assessUrgency(daysToDeadline);
      insights.push(`Compliance deadline is ${data.deadline} (${daysToDeadline} days remaining, ${urgency} urgency)`);
      complianceSpecific.daysToDeadline = daysToDeadline;
      complianceSpecific.urgency = urgency;
    }

    // Risk Level Analysis
    if (regulation && regulation.riskLevel) {
      insights.push(`Regulatory risk level is assessed as ${regulation.riskLevel.toLowerCase()}`);
      complianceSpecific.regulatoryRisk = regulation.riskLevel;
    }

    // Requirements Analysis
    if (data.requirement) {
      insights.push(`Key requirement: ${data.requirement}`);
      complianceSpecific.keyRequirement = data.requirement;
    }

    // Actions Analysis
    if (data.actions) {
      const actionCount = data.actions.split(',').length;
      insights.push(`${actionCount} action item(s) identified for compliance`);
      complianceSpecific.actionCount = actionCount;
      complianceSpecific.actions = data.actions.split(',').map(action => action.trim());
    }

    // Responsible Party Analysis
    if (data.responsible) {
      insights.push(`Compliance responsibility assigned to: ${data.responsible}`);
      complianceSpecific.responsibleParty = data.responsible;
    }

    // Regional Context
    const regionalContext = this.getRegionalContext(data.region);
    if (regionalContext) {
      insights.push(regionalContext);
      complianceSpecific.regionalContext = regionalContext;
    }

    return { insights, complianceSpecific };
  }

  /**
   * Generate compliance-specific recommendations
   */
  generateComplianceRecommendations(analysis) {
    const recommendations = [];
    const { complianceSpecific } = analysis;

    // Compliance level recommendations
    if (complianceSpecific.complianceLevel === 'Non-Compliant') {
      recommendations.push('Immediate action required to achieve regulatory compliance');
      recommendations.push('Conduct comprehensive compliance gap analysis');
      recommendations.push('Engage legal counsel for compliance strategy development');
    } else if (complianceSpecific.complianceLevel === 'Partial Compliance') {
      recommendations.push('Accelerate compliance improvement initiatives');
      recommendations.push('Address remaining compliance gaps systematically');
      recommendations.push('Implement enhanced monitoring and reporting systems');
    }

    // Urgency-based recommendations
    if (complianceSpecific.urgency === 'High') {
      recommendations.push('Establish dedicated compliance task force');
      recommendations.push('Prioritize resources for immediate compliance actions');
      recommendations.push('Consider interim measures to reduce non-compliance risk');
    } else if (complianceSpecific.urgency === 'Medium') {
      recommendations.push('Develop detailed compliance implementation timeline');
      recommendations.push('Allocate sufficient resources for compliance activities');
      recommendations.push('Regular progress monitoring and reporting');
    }

    // Risk-based recommendations
    if (complianceSpecific.regulatoryRisk === 'High') {
      recommendations.push('Implement comprehensive risk mitigation strategy');
      recommendations.push('Engage with regulatory authorities proactively');
      recommendations.push('Consider compliance insurance or bonding');
    }

    // Action-based recommendations
    if (complianceSpecific.actionCount > 5) {
      recommendations.push('Prioritize compliance actions based on risk and impact');
      recommendations.push('Establish clear accountability and timelines for each action');
      recommendations.push('Implement project management approach for compliance activities');
    }

    // General compliance recommendations
    recommendations.push('Establish regulatory monitoring and early warning system');
    recommendations.push('Develop compliance training programs for relevant staff');
    recommendations.push('Create compliance documentation and audit trails');
    recommendations.push('Engage with industry associations on regulatory developments');

    return recommendations;
  }

  /**
   * Calculate compliance-specific KPIs
   */
  calculateComplianceKPIs(data) {
    const kpis = {};

    // Compliance Score (0-100)
    kpis.complianceScore = this.calculateComplianceScore(data.complianceStatus);

    // Days to Deadline
    if (data.deadline) {
      kpis.daysToDeadline = this.calculateDaysToDeadline(data.deadline);
    }

    // Compliance Progress (if baseline available)
    if (data.complianceStatus && data.complianceStatus !== 'Not Applicable') {
      const statusValues = {
        'Compliant': 100,
        'In Progress': 60,
        'Non-Compliant': 20
      };
      kpis.complianceProgress = statusValues[data.complianceStatus] || 0;
    }

    // Risk Score (0-100, higher is riskier)
    const regulation = this.findRegulation(data.regulation, data.region);
    if (regulation) {
      const riskValues = { 'High': 80, 'Medium': 50, 'Low': 20 };
      kpis.riskScore = riskValues[regulation.riskLevel] || 50;
    }

    // Urgency Score (0-100, higher is more urgent)
    if (kpis.daysToDeadline !== undefined) {
      kpis.urgencyScore = Math.max(0, 100 - (kpis.daysToDeadline / 365 * 100));
    }

    // Overall Compliance Health (composite score)
    let healthScore = 0;
    let factors = 0;

    if (kpis.complianceScore !== undefined) {
      healthScore += kpis.complianceScore;
      factors++;
    }
    if (kpis.riskScore !== undefined) {
      healthScore += (100 - kpis.riskScore); // Invert risk score
      factors++;
    }

    if (factors > 0) {
      kpis.overallComplianceHealth = healthScore / factors;
    }

    return kpis;
  }

  /**
   * Assess regulatory risk
   */
  assessRegulatoryRisk(data) {
    const riskAssessment = {
      overallRisk: 'Medium',
      riskFactors: [],
      mitigationStrategies: []
    };

    // Compliance status risk
    if (data.complianceStatus === 'Non-Compliant') {
      riskAssessment.riskFactors.push('Non-compliant status');
      riskAssessment.mitigationStrategies.push('Immediate compliance remediation');
      riskAssessment.overallRisk = 'High';
    }

    // Deadline risk
    if (data.deadline) {
      const daysToDeadline = this.calculateDaysToDeadline(data.deadline);
      if (daysToDeadline < 90) {
        riskAssessment.riskFactors.push('Approaching compliance deadline');
        riskAssessment.mitigationStrategies.push('Accelerate compliance activities');
        riskAssessment.overallRisk = 'High';
      }
    }

    // Regulatory complexity risk
    const regulation = this.findRegulation(data.regulation, data.region);
    if (regulation && regulation.riskLevel === 'High') {
      riskAssessment.riskFactors.push('High-risk regulation');
      riskAssessment.mitigationStrategies.push('Enhanced compliance monitoring');
    }

    // Regional risk
    if (data.region === 'Europe') {
      riskAssessment.riskFactors.push('Strict European regulatory environment');
      riskAssessment.mitigationStrategies.push('Proactive regulatory engagement');
    }

    return riskAssessment;
  }

  /**
   * Helper methods
   */
  findRegulation(regulationName, region) {
    const regionKey = region.toLowerCase().replace(' ', '');
    const regulations = this.regulations[regionKey] || this.regulations.global;
    return regulations[regulationName];
  }

  assessComplianceLevel(status) {
    const levels = {
      'Compliant': 'Full Compliance',
      'In Progress': 'Partial Compliance',
      'Non-Compliant': 'Non-Compliant',
      'Not Applicable': 'Not Applicable'
    };
    return levels[status] || 'Unknown';
  }

  calculateDaysToDeadline(deadline) {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  assessUrgency(daysToDeadline) {
    if (daysToDeadline < 30) return 'High';
    if (daysToDeadline < 90) return 'Medium';
    return 'Low';
  }

  calculateComplianceScore(status) {
    const scores = {
      'Compliant': 100,
      'In Progress': 60,
      'Non-Compliant': 20,
      'Not Applicable': 0
    };
    return scores[status] || 0;
  }

  getRegionalContext(region) {
    const contexts = {
      'Europe': 'European regulations are comprehensive and strictly enforced with significant penalties',
      'Asia Pacific': 'Asia Pacific regulatory landscape is rapidly evolving with increasing stringency',
      'Global': 'International agreements provide framework for national and regional implementation'
    };
    return contexts[region];
  }

  /**
   * Get regulatory agent capabilities
   */
  getCapabilities() {
    return [
      ...super.getCapabilities(),
      'Regulatory compliance monitoring',
      'Environmental law interpretation',
      'Compliance risk assessment',
      'Regulatory change tracking',
      'Stakeholder engagement on regulations',
      'Compliance strategy development',
      'Audit and inspection preparation',
      'Regulatory reporting and documentation',
      'Cross-jurisdictional compliance coordination'
    ];
  }
}

module.exports = RegulatoryComplianceAgent;
