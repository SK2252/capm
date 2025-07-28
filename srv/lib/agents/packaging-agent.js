const BaseAgent = require('./base-agent');

/**
 * Packaging Analysis Agent for CCEP Sustainability Analytics
 * Specializes in packaging material analysis, recyclability, and optimization
 */
class PackagingAnalysisAgent extends BaseAgent {
  constructor(ragSystem) {
    super(ragSystem);
    this.specialization = 'packaging';
    this.materialTargets = this.initializeMaterialTargets();
  }

  /**
   * Initialize material-specific targets and thresholds
   */
  initializeMaterialTargets() {
    return {
      PET: {
        recyclableTarget: 100,
        recycledContentTarget: 50,
        carbonFootprintMax: 0.090
      },
      Aluminum: {
        recyclableTarget: 100,
        recycledContentTarget: 75,
        carbonFootprintMax: 0.160
      },
      Glass: {
        recyclableTarget: 100,
        recycledContentTarget: 45,
        carbonFootprintMax: 0.240
      },
      HDPE: {
        recyclableTarget: 90,
        recycledContentTarget: 35,
        carbonFootprintMax: 0.070
      },
      Cardboard: {
        recyclableTarget: 95,
        recycledContentTarget: 80,
        carbonFootprintMax: 0.050
      }
    };
  }

  /**
   * Get specialized system prompt for packaging analysis
   */
  getSystemPrompt() {
    return `You are a packaging sustainability expert for CCEP. You specialize in:
- Packaging material analysis and optimization
- Recyclability assessment and improvement strategies
- Recycled content strategies and implementation
- Collection rate improvements and logistics
- Packaging carbon footprint reduction
- Circular economy principles in packaging design
- Material innovation and alternative solutions

Key CCEP Packaging Targets:
- 100% recyclable packaging by 2025
- 50% recycled content in PET bottles by 2025
- Improve collection rates: Europe to 85%, Asia Pacific to 70%
- Reduce packaging carbon footprint (currently 38% of total emissions)

Regional Context:
- Europe: Collection rate 76.7%, higher recycling infrastructure
- Asia Pacific: Collection rate 53%, developing infrastructure
- Focus on material-specific solutions and regional adaptation

Always provide specific, actionable recommendations with quantified targets and timelines.`;
  }

  /**
   * Generate comprehensive packaging insights
   */
  async generateInsights(packagingData) {
    try {
      if (!this.validateData(packagingData, ['material', 'region'])) {
        throw new Error('Invalid packaging data provided');
      }

      const analysis = await this.analyzePackagingPerformance(packagingData);
      const recommendations = this.generatePackagingRecommendations(analysis);
      const kpis = this.calculatePackagingKPIs(packagingData);

      this.logger.info(`Generated packaging insights for ${packagingData.material} in ${packagingData.region}`);

      return {
        insights: analysis.insights,
        recommendations: this.formatRecommendations(recommendations),
        kpis: kpis,
        confidence: this.calculateConfidence(packagingData, analysis.insights.join(' ')),
        agent: this.specialization,
        timestamp: new Date().toISOString(),
        materialAnalysis: analysis.materialSpecific
      };
    } catch (error) {
      this.logger.error('Error generating packaging insights:', error);
      throw error;
    }
  }

  /**
   * Analyze packaging performance against targets
   */
  async analyzePackagingPerformance(data) {
    const insights = [];
    const materialSpecific = {};
    const material = data.material;
    const targets = this.materialTargets[material] || this.materialTargets.PET;

    // Recyclability Analysis
    if (data.recyclableContent !== undefined) {
      const recyclabilityGap = targets.recyclableTarget - data.recyclableContent;
      if (recyclabilityGap > 0) {
        insights.push(`${material} recyclability at ${data.recyclableContent}% is ${recyclabilityGap}% below the ${targets.recyclableTarget}% target`);
        materialSpecific.recyclabilityStatus = 'Below Target';
      } else {
        insights.push(`${material} recyclability at ${data.recyclableContent}% meets or exceeds the ${targets.recyclableTarget}% target`);
        materialSpecific.recyclabilityStatus = 'On Target';
      }
    }

    // Recycled Content Analysis
    if (data.recycledContent !== undefined) {
      const recycledContentGap = targets.recycledContentTarget - data.recycledContent;
      if (recycledContentGap > 0) {
        insights.push(`${material} recycled content at ${data.recycledContent}% needs ${recycledContentGap}% improvement to meet ${targets.recycledContentTarget}% target`);
        materialSpecific.recycledContentStatus = 'Below Target';
      } else {
        insights.push(`${material} recycled content at ${data.recycledContent}% meets the ${targets.recycledContentTarget}% target`);
        materialSpecific.recycledContentStatus = 'On Target';
      }
    }

    // Carbon Footprint Analysis
    if (data.carbonFootprint !== undefined) {
      if (data.carbonFootprint > targets.carbonFootprintMax) {
        const excess = ((data.carbonFootprint - targets.carbonFootprintMax) / targets.carbonFootprintMax * 100).toFixed(1);
        insights.push(`${material} carbon footprint at ${data.carbonFootprint} kg CO2e is ${excess}% above optimal levels`);
        materialSpecific.carbonFootprintStatus = 'Above Target';
      } else {
        insights.push(`${material} carbon footprint at ${data.carbonFootprint} kg CO2e is within optimal range`);
        materialSpecific.carbonFootprintStatus = 'On Target';
      }
    }

    // Collection Rate Analysis
    if (data.collectionRate !== undefined) {
      const regionTarget = data.region === 'Europe' ? 85 : 70;
      const collectionGap = regionTarget - data.collectionRate;
      if (collectionGap > 0) {
        insights.push(`Collection rate in ${data.region} at ${data.collectionRate}% needs ${collectionGap}% improvement to meet ${regionTarget}% target`);
        materialSpecific.collectionStatus = 'Below Target';
      } else {
        insights.push(`Collection rate in ${data.region} at ${data.collectionRate}% meets the ${regionTarget}% target`);
        materialSpecific.collectionStatus = 'On Target';
      }
    }

    // Volume and Scale Analysis
    if (data.volume !== undefined) {
      const volumeCategory = this.categorizeVolume(data.volume);
      insights.push(`${material} volume at ${data.volume.toLocaleString()} units represents ${volumeCategory} scale production`);
      materialSpecific.volumeCategory = volumeCategory;
    }

    return { insights, materialSpecific };
  }

  /**
   * Generate specific packaging recommendations
   */
  generatePackagingRecommendations(analysis) {
    const recommendations = [];
    const { materialSpecific } = analysis;

    // Recyclability Recommendations
    if (materialSpecific.recyclabilityStatus === 'Below Target') {
      recommendations.push('Transition to fully recyclable material alternatives');
      recommendations.push('Eliminate multi-layer packaging that hinders recyclability');
      recommendations.push('Partner with recycling facilities to improve material compatibility');
    }

    // Recycled Content Recommendations
    if (materialSpecific.recycledContentStatus === 'Below Target') {
      recommendations.push('Increase supplier partnerships for recycled materials');
      recommendations.push('Invest in recycled content processing capabilities');
      recommendations.push('Implement closed-loop recycling systems');
    }

    // Carbon Footprint Recommendations
    if (materialSpecific.carbonFootprintStatus === 'Above Target') {
      recommendations.push('Optimize packaging design to reduce material usage');
      recommendations.push('Switch to lower-carbon alternative materials');
      recommendations.push('Improve transportation efficiency through packaging optimization');
    }

    // Collection Rate Recommendations
    if (materialSpecific.collectionStatus === 'Below Target') {
      recommendations.push('Expand collection infrastructure in underperforming regions');
      recommendations.push('Implement consumer education programs on proper disposal');
      recommendations.push('Partner with local governments on collection initiatives');
    }

    // General Innovation Recommendations
    recommendations.push('Explore bio-based packaging alternatives');
    recommendations.push('Implement smart packaging with recycling instructions');
    recommendations.push('Develop regional packaging strategies based on local infrastructure');

    return recommendations;
  }

  /**
   * Calculate packaging-specific KPIs
   */
  calculatePackagingKPIs(data) {
    const kpis = {};

    // Recyclability Score (0-100)
    if (data.recyclableContent !== undefined) {
      kpis.recyclabilityScore = data.recyclableContent;
    }

    // Sustainability Index (composite score)
    let sustainabilityIndex = 0;
    let factors = 0;

    if (data.recyclableContent !== undefined) {
      sustainabilityIndex += data.recyclableContent;
      factors++;
    }
    if (data.recycledContent !== undefined) {
      sustainabilityIndex += data.recycledContent;
      factors++;
    }
    if (data.collectionRate !== undefined) {
      sustainabilityIndex += data.collectionRate;
      factors++;
    }

    if (factors > 0) {
      kpis.sustainabilityIndex = sustainabilityIndex / factors;
    }

    // Carbon Intensity (per unit)
    if (data.carbonFootprint !== undefined && data.volume !== undefined && data.volume > 0) {
      kpis.carbonIntensity = data.carbonFootprint / data.volume * 1000; // per 1000 units
    }

    // Target Achievement Percentage
    const material = data.material;
    const targets = this.materialTargets[material] || this.materialTargets.PET;
    
    if (data.recyclableContent !== undefined) {
      kpis.recyclabilityAchievement = (data.recyclableContent / targets.recyclableTarget) * 100;
    }
    
    if (data.recycledContent !== undefined) {
      kpis.recycledContentAchievement = (data.recycledContent / targets.recycledContentTarget) * 100;
    }

    return kpis;
  }

  /**
   * Categorize volume for analysis
   */
  categorizeVolume(volume) {
    if (volume >= 5000000) return 'Large';
    if (volume >= 1000000) return 'Medium';
    if (volume >= 100000) return 'Small';
    return 'Pilot';
  }

  /**
   * Get packaging agent capabilities
   */
  getCapabilities() {
    return [
      ...super.getCapabilities(),
      'Material recyclability analysis',
      'Recycled content optimization',
      'Carbon footprint assessment',
      'Collection rate improvement strategies',
      'Packaging design optimization',
      'Circular economy implementation',
      'Regional adaptation strategies',
      'Material innovation guidance'
    ];
  }

  /**
   * Analyze packaging trends over time
   */
  analyzeTrends(historicalData) {
    if (!Array.isArray(historicalData) || historicalData.length < 2) {
      return { trend: 'insufficient_data', message: 'Need at least 2 data points for trend analysis' };
    }

    const latest = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];
    
    const trends = {};
    
    // Recyclability trend
    if (latest.recyclableContent && previous.recyclableContent) {
      const change = latest.recyclableContent - previous.recyclableContent;
      trends.recyclability = {
        change: change,
        direction: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
        rate: Math.abs(change)
      };
    }
    
    // Recycled content trend
    if (latest.recycledContent && previous.recycledContent) {
      const change = latest.recycledContent - previous.recycledContent;
      trends.recycledContent = {
        change: change,
        direction: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
        rate: Math.abs(change)
      };
    }
    
    // Carbon footprint trend
    if (latest.carbonFootprint && previous.carbonFootprint) {
      const change = latest.carbonFootprint - previous.carbonFootprint;
      trends.carbonFootprint = {
        change: change,
        direction: change < 0 ? 'improving' : change > 0 ? 'declining' : 'stable',
        rate: Math.abs(change)
      };
    }

    return trends;
  }
}

module.exports = PackagingAnalysisAgent;
