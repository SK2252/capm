const BaseAgent = require('./base-agent');

/**
 * Supply Chain Agent for CCEP Sustainability Analytics
 * Specializes in supplier sustainability assessment, supply chain carbon footprint, and sustainable sourcing
 */
class SupplyChainAgent extends BaseAgent {
  constructor(ragSystem) {
    super(ragSystem);
    this.specialization = 'supplyChain';
    this.sustainabilityThresholds = this.initializeSustainabilityThresholds();
    this.riskFactors = this.initializeRiskFactors();
  }

  /**
   * Initialize sustainability scoring thresholds
   */
  initializeSustainabilityThresholds() {
    return {
      excellent: { min: 8.5, max: 10.0 },
      good: { min: 7.0, max: 8.4 },
      fair: { min: 5.5, max: 6.9 },
      poor: { min: 3.0, max: 5.4 },
      critical: { min: 0.0, max: 2.9 }
    };
  }

  /**
   * Initialize supply chain risk factors
   */
  initializeRiskFactors() {
    return {
      environmental: {
        carbonIntensity: { weight: 0.25, threshold: 2.0 },
        waterUsage: { weight: 0.15, threshold: 3.0 },
        wasteGeneration: { weight: 0.15, threshold: 5.0 },
        biodiversityImpact: { weight: 0.10, threshold: 3.0 }
      },
      social: {
        laborPractices: { weight: 0.15, threshold: 7.0 },
        communityImpact: { weight: 0.10, threshold: 6.0 },
        humanRights: { weight: 0.10, threshold: 8.0 }
      },
      governance: {
        transparency: { weight: 0.15, threshold: 7.0 },
        compliance: { weight: 0.20, threshold: 8.0 },
        ethicalPractices: { weight: 0.15, threshold: 7.5 }
      }
    };
  }

  /**
   * Get specialized system prompt for supply chain analysis
   */
  getSystemPrompt() {
    return `You are a sustainable supply chain expert for CCEP. You specialize in:
- Supplier sustainability assessment and scoring
- Supply chain carbon footprint analysis and reduction
- Sustainable sourcing strategies and implementation
- Supplier engagement and development programs
- Supply chain risk management and mitigation
- Circular supply chain design and optimization
- Supplier diversity and inclusion initiatives
- Supply chain transparency and traceability

Key CCEP Supply Chain Priorities:
- Achieve 8.5+ sustainability score across all key suppliers
- Reduce supply chain emissions (Scope 3) by 30% by 2030
- Implement sustainable sourcing for 100% of key materials
- Ensure 100% supplier compliance with sustainability standards
- Build resilient and circular supply chains

Regional Considerations:
- Europe: Advanced sustainability infrastructure, strict regulations
- Asia Pacific: Developing sustainability capabilities, diverse regulatory landscape
- Focus on supplier capacity building and technology transfer

Assessment Framework: ESG criteria, life cycle assessment, supplier audits
Always provide actionable supplier development recommendations and risk mitigation strategies.`;
  }

  /**
   * Generate comprehensive supply chain insights
   */
  async generateInsights(supplierData) {
    try {
      if (!this.validateData(supplierData, ['supplier', 'sustainabilityScore'])) {
        throw new Error('Invalid supplier data provided');
      }

      const analysis = await this.analyzeSupplierPerformance(supplierData);
      const recommendations = this.generateSupplyChainRecommendations(analysis);
      const kpis = this.calculateSupplyChainKPIs(supplierData);
      const riskAssessment = this.assessSupplierRisk(supplierData);

      this.logger.info(`Generated supply chain insights for ${supplierData.supplier} in ${supplierData.region || 'Global'}`);

      return {
        insights: analysis.insights,
        recommendations: this.formatRecommendations(recommendations),
        kpis: kpis,
        riskAssessment: riskAssessment,
        confidence: this.calculateConfidence(supplierData, analysis.insights.join(' ')),
        agent: this.specialization,
        timestamp: new Date().toISOString(),
        supplierAnalysis: analysis.supplierSpecific
      };
    } catch (error) {
      this.logger.error('Error generating supply chain insights:', error);
      throw error;
    }
  }

  /**
   * Analyze supplier performance against sustainability criteria
   */
  async analyzeSupplierPerformance(data) {
    const insights = [];
    const supplierSpecific = {};
    const score = data.sustainabilityScore;

    // Sustainability Score Analysis
    const scoreCategory = this.categorizeSustainabilityScore(score);
    insights.push(`${data.supplier} has a sustainability score of ${score}/10, categorized as '${scoreCategory}'`);
    supplierSpecific.scoreCategory = scoreCategory;
    supplierSpecific.scoreStatus = score >= 8.5 ? 'Excellent' : score >= 7.0 ? 'Good' : 'Needs Improvement';

    // Carbon Intensity Analysis
    if (data.carbonIntensity !== undefined) {
      const intensityStatus = data.carbonIntensity <= 2.0 ? 'Low' : data.carbonIntensity <= 4.0 ? 'Medium' : 'High';
      insights.push(`Carbon intensity at ${data.carbonIntensity} kg CO2e/unit is ${intensityStatus.toLowerCase()}`);
      supplierSpecific.carbonIntensityStatus = intensityStatus;
    }

    // Recycled Content Capability Analysis
    if (data.recycledContentCapability !== undefined) {
      const capabilityLevel = data.recycledContentCapability >= 75 ? 'High' : 
                             data.recycledContentCapability >= 50 ? 'Medium' : 'Low';
      insights.push(`Recycled content capability at ${data.recycledContentCapability}% is ${capabilityLevel.toLowerCase()}`);
      supplierSpecific.recycledContentCapability = capabilityLevel;
    }

    // Certification Analysis
    if (data.certifications) {
      const certCount = data.certifications.split(',').length;
      insights.push(`Supplier holds ${certCount} sustainability certification(s): ${data.certifications}`);
      supplierSpecific.certificationCount = certCount;
      supplierSpecific.certifications = data.certifications.split(',').map(cert => cert.trim());
    }

    // Performance Rating Analysis
    if (data.performanceRating !== undefined) {
      const ratingStatus = data.performanceRating >= 8.0 ? 'Excellent' : 
                          data.performanceRating >= 6.0 ? 'Good' : 'Poor';
      insights.push(`Overall performance rating of ${data.performanceRating}/10 is ${ratingStatus.toLowerCase()}`);
      supplierSpecific.performanceStatus = ratingStatus;
    }

    // Contract Value Analysis
    if (data.contractValue !== undefined) {
      const valueCategory = this.categorizeContractValue(data.contractValue);
      insights.push(`Contract value of ${data.contractValue.toLocaleString()} represents ${valueCategory} supplier relationship`);
      supplierSpecific.valueCategory = valueCategory;
    }

    // Risk Level Analysis
    if (data.riskLevel) {
      insights.push(`Supplier risk level is assessed as ${data.riskLevel.toLowerCase()}`);
      supplierSpecific.riskLevel = data.riskLevel;
    }

    return { insights, supplierSpecific };
  }

  /**
   * Generate supply chain specific recommendations
   */
  generateSupplyChainRecommendations(analysis) {
    const recommendations = [];
    const { supplierSpecific } = analysis;

    // Score-based recommendations
    if (supplierSpecific.scoreStatus === 'Needs Improvement') {
      recommendations.push('Implement supplier development program to improve sustainability performance');
      recommendations.push('Provide sustainability training and capacity building support');
      recommendations.push('Set clear improvement targets with timeline and milestones');
    }

    // Carbon intensity recommendations
    if (supplierSpecific.carbonIntensityStatus === 'High') {
      recommendations.push('Work with supplier to develop carbon reduction roadmap');
      recommendations.push('Encourage adoption of renewable energy and energy efficiency measures');
      recommendations.push('Consider carbon pricing in supplier contracts');
    }

    // Recycled content recommendations
    if (supplierSpecific.recycledContentCapability === 'Low') {
      recommendations.push('Support supplier investment in recycled content processing capabilities');
      recommendations.push('Connect supplier with recycled material sources and technologies');
      recommendations.push('Establish recycled content targets in supply agreements');
    }

    // Certification recommendations
    if (!supplierSpecific.certifications || supplierSpecific.certificationCount < 2) {
      recommendations.push('Encourage supplier to obtain relevant sustainability certifications');
      recommendations.push('Provide guidance on certification requirements and processes');
      recommendations.push('Consider certification requirements in future contracts');
    }

    // Performance-based recommendations
    if (supplierSpecific.performanceStatus === 'Poor') {
      recommendations.push('Conduct detailed supplier assessment and improvement planning');
      recommendations.push('Consider supplier replacement if improvement targets are not met');
      recommendations.push('Implement enhanced monitoring and reporting requirements');
    }

    // Risk-based recommendations
    if (supplierSpecific.riskLevel === 'High') {
      recommendations.push('Develop comprehensive risk mitigation plan');
      recommendations.push('Increase supplier monitoring and audit frequency');
      recommendations.push('Diversify supplier base to reduce dependency');
    }

    // General supply chain recommendations
    recommendations.push('Implement supplier sustainability scorecards and regular reviews');
    recommendations.push('Establish long-term partnerships with high-performing suppliers');
    recommendations.push('Integrate sustainability criteria into supplier selection processes');

    return recommendations;
  }

  /**
   * Calculate supply chain specific KPIs
   */
  calculateSupplyChainKPIs(data) {
    const kpis = {};

    // Sustainability Performance Index
    if (data.sustainabilityScore !== undefined) {
      kpis.sustainabilityIndex = (data.sustainabilityScore / 10) * 100;
    }

    // Carbon Efficiency Score
    if (data.carbonIntensity !== undefined) {
      kpis.carbonEfficiencyScore = Math.max(0, 100 - (data.carbonIntensity * 25));
    }

    // Circular Economy Score
    let circularityScore = 0;
    let factors = 0;

    if (data.recycledContentCapability !== undefined) {
      circularityScore += data.recycledContentCapability;
      factors++;
    }

    if (factors > 0) {
      kpis.circularEconomyScore = circularityScore / factors;
    }

    // Compliance Score
    if (data.certifications) {
      const certCount = data.certifications.split(',').length;
      kpis.complianceScore = Math.min(100, certCount * 25); // Max 4 certifications for 100%
    }

    // Overall Supplier Rating
    let overallRating = 0;
    let ratingFactors = 0;

    if (data.sustainabilityScore !== undefined) {
      overallRating += data.sustainabilityScore * 10;
      ratingFactors++;
    }
    if (data.performanceRating !== undefined) {
      overallRating += data.performanceRating * 10;
      ratingFactors++;
    }

    if (ratingFactors > 0) {
      kpis.overallSupplierRating = overallRating / ratingFactors;
    }

    // Value-weighted Performance
    if (data.contractValue && data.sustainabilityScore) {
      kpis.valueWeightedPerformance = data.contractValue * (data.sustainabilityScore / 10);
    }

    return kpis;
  }

  /**
   * Assess supplier risk across multiple dimensions
   */
  assessSupplierRisk(data) {
    const riskAssessment = {
      overallRisk: 'Medium',
      riskFactors: [],
      mitigationStrategies: []
    };

    let riskScore = 0;
    let maxRiskScore = 0;

    // Sustainability risk
    if (data.sustainabilityScore !== undefined) {
      const sustainabilityRisk = data.sustainabilityScore < 6.0 ? 3 : data.sustainabilityScore < 8.0 ? 1 : 0;
      riskScore += sustainabilityRisk;
      maxRiskScore += 3;
      
      if (sustainabilityRisk > 0) {
        riskAssessment.riskFactors.push('Low sustainability performance');
        riskAssessment.mitigationStrategies.push('Implement supplier development program');
      }
    }

    // Carbon intensity risk
    if (data.carbonIntensity !== undefined) {
      const carbonRisk = data.carbonIntensity > 4.0 ? 2 : data.carbonIntensity > 2.0 ? 1 : 0;
      riskScore += carbonRisk;
      maxRiskScore += 2;
      
      if (carbonRisk > 0) {
        riskAssessment.riskFactors.push('High carbon intensity');
        riskAssessment.mitigationStrategies.push('Support carbon reduction initiatives');
      }
    }

    // Geographic risk
    if (data.region) {
      const geoRisk = data.region === 'Asia Pacific' ? 1 : 0; // Higher regulatory risk in developing regions
      riskScore += geoRisk;
      maxRiskScore += 1;
      
      if (geoRisk > 0) {
        riskAssessment.riskFactors.push('Geographic regulatory risk');
        riskAssessment.mitigationStrategies.push('Monitor regulatory changes and compliance');
      }
    }

    // Contract value risk
    if (data.contractValue !== undefined) {
      const valueRisk = data.contractValue > 10000000 ? 1 : 0; // High dependency risk
      riskScore += valueRisk;
      maxRiskScore += 1;
      
      if (valueRisk > 0) {
        riskAssessment.riskFactors.push('High contract value dependency');
        riskAssessment.mitigationStrategies.push('Diversify supplier base');
      }
    }

    // Calculate overall risk level
    if (maxRiskScore > 0) {
      const riskPercentage = (riskScore / maxRiskScore) * 100;
      riskAssessment.overallRisk = riskPercentage > 60 ? 'High' : riskPercentage > 30 ? 'Medium' : 'Low';
      riskAssessment.riskScore = riskPercentage;
    }

    return riskAssessment;
  }

  /**
   * Categorize sustainability score
   */
  categorizeSustainabilityScore(score) {
    const thresholds = this.sustainabilityThresholds;
    
    if (score >= thresholds.excellent.min) return 'Excellent';
    if (score >= thresholds.good.min) return 'Good';
    if (score >= thresholds.fair.min) return 'Fair';
    if (score >= thresholds.poor.min) return 'Poor';
    return 'Critical';
  }

  /**
   * Categorize contract value
   */
  categorizeContractValue(value) {
    if (value >= 50000000) return 'Strategic';
    if (value >= 10000000) return 'Key';
    if (value >= 1000000) return 'Important';
    return 'Standard';
  }

  /**
   * Get supply chain agent capabilities
   */
  getCapabilities() {
    return [
      ...super.getCapabilities(),
      'Supplier sustainability assessment',
      'Supply chain carbon footprint analysis',
      'Sustainable sourcing strategy development',
      'Supplier risk assessment and management',
      'Circular supply chain design',
      'Supplier development and engagement',
      'Supply chain transparency and traceability',
      'ESG compliance monitoring',
      'Supplier diversity and inclusion'
    ];
  }

  /**
   * Calculate supply chain sustainability index
   */
  calculateSupplyChainIndex(suppliers) {
    if (!Array.isArray(suppliers) || suppliers.length === 0) {
      return { index: 0, message: 'No supplier data available' };
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    suppliers.forEach(supplier => {
      const weight = supplier.contractValue || 1;
      const score = supplier.sustainabilityScore || 0;
      
      totalWeightedScore += score * weight;
      totalWeight += weight;
    });

    const index = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 10 : 0;

    return {
      index: Math.round(index * 100) / 100,
      supplierCount: suppliers.length,
      weightedAverage: true,
      category: this.categorizeSustainabilityScore(index)
    };
  }
}

module.exports = SupplyChainAgent;
