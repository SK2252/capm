const moment = require('moment');
const _ = require('lodash');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/data-processor.log' }),
    new winston.transports.Console()
  ]
});

class DataProcessor {
  constructor() {
    this.emissionFactors = this.initializeEmissionFactors();
    this.targets = this.initializeTargets();
  }

  initializeEmissionFactors() {
    return {
      PET: 0.085, // kg CO2e per bottle
      Aluminum: 0.156, // kg CO2e per can
      Glass: 0.234, // kg CO2e per bottle
      HDPE: 0.067, // kg CO2e per cap
      Cardboard: 0.045, // kg CO2e per unit
      Steel: 0.198, // kg CO2e per can
      PP: 0.058, // kg CO2e per label
      BioPET: 0.065, // kg CO2e per bottle
      rPET: 0.078, // kg CO2e per bottle
      PlantFiber: 0.032, // kg CO2e per cup
      CompostablePlastic: 0.089 // kg CO2e per straw
    };
  }

  initializeTargets() {
    return {
      ghgReduction: 30, // 30% reduction by 2030
      recyclablePackaging: 100, // 100% by 2025
      recycledContentPET: 50, // 50% by 2025
      collectionRateEurope: 85, // Target for Europe
      collectionRateAPI: 70, // Target for Asia Pacific
      packagingCarbonFootprint: 38 // Current percentage of total footprint
    };
  }

  // Calculate carbon footprint for packaging
  calculatePackagingFootprint(packagingData) {
    try {
      const footprint = packagingData.map(item => {
        const emissionFactor = this.emissionFactors[item.material] || 0.1;
        const totalEmissions = (item.volume || 0) * emissionFactor;
        
        return {
          ...item,
          calculatedFootprint: totalEmissions,
          emissionFactor,
          footprintPerUnit: emissionFactor
        };
      });

      logger.info(`Calculated footprint for ${footprint.length} packaging items`);
      return footprint;
    } catch (error) {
      logger.error('Error calculating packaging footprint:', error);
      throw error;
    }
  }

  // Calculate emission reduction progress
  calculateEmissionReduction(currentEmissions, baselineEmissions) {
    try {
      if (!baselineEmissions || baselineEmissions === 0) {
        return { reduction: 0, progress: 0 };
      }

      const reduction = ((baselineEmissions - currentEmissions) / baselineEmissions) * 100;
      const progress = (reduction / this.targets.ghgReduction) * 100;

      return {
        reduction: Math.round(reduction * 100) / 100,
        progress: Math.round(progress * 100) / 100,
        target: this.targets.ghgReduction,
        onTrack: reduction >= this.targets.ghgReduction * 0.8 // 80% of target
      };
    } catch (error) {
      logger.error('Error calculating emission reduction:', error);
      throw error;
    }
  }

  // Analyze packaging recyclability
  analyzeRecyclability(packagingData) {
    try {
      const analysis = {
        totalVolume: 0,
        recyclableVolume: 0,
        recyclabilityRate: 0,
        materialBreakdown: {},
        recommendations: []
      };

      packagingData.forEach(item => {
        const volume = item.volume || 0;
        const recyclableContent = item.recyclableContent || 0;
        
        analysis.totalVolume += volume;
        analysis.recyclableVolume += (volume * recyclableContent / 100);
        
        if (!analysis.materialBreakdown[item.material]) {
          analysis.materialBreakdown[item.material] = {
            volume: 0,
            recyclableVolume: 0,
            recyclabilityRate: 0
          };
        }
        
        analysis.materialBreakdown[item.material].volume += volume;
        analysis.materialBreakdown[item.material].recyclableVolume += (volume * recyclableContent / 100);
      });

      // Calculate overall recyclability rate
      analysis.recyclabilityRate = analysis.totalVolume > 0 
        ? (analysis.recyclableVolume / analysis.totalVolume) * 100 
        : 0;

      // Calculate material-specific rates
      Object.keys(analysis.materialBreakdown).forEach(material => {
        const breakdown = analysis.materialBreakdown[material];
        breakdown.recyclabilityRate = breakdown.volume > 0 
          ? (breakdown.recyclableVolume / breakdown.volume) * 100 
          : 0;
      });

      // Generate recommendations
      analysis.recommendations = this.generateRecyclabilityRecommendations(analysis);

      logger.info(`Analyzed recyclability: ${analysis.recyclabilityRate.toFixed(1)}% overall rate`);
      return analysis;
    } catch (error) {
      logger.error('Error analyzing recyclability:', error);
      throw error;
    }
  }

  generateRecyclabilityRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.recyclabilityRate < this.targets.recyclablePackaging) {
      recommendations.push({
        priority: 'High',
        action: 'Increase recyclable packaging materials',
        impact: `Need to improve by ${(this.targets.recyclablePackaging - analysis.recyclabilityRate).toFixed(1)}%`
      });
    }

    // Material-specific recommendations
    Object.entries(analysis.materialBreakdown).forEach(([material, data]) => {
      if (data.recyclabilityRate < 90 && data.volume > 1000000) {
        recommendations.push({
          priority: 'Medium',
          action: `Improve ${material} recyclability`,
          impact: `${data.volume.toLocaleString()} units affected`
        });
      }
    });

    return recommendations;
  }

  // Calculate recycled content progress
  calculateRecycledContentProgress(packagingData) {
    try {
      const petData = packagingData.filter(item => 
        item.material === 'PET' || item.material === 'rPET' || item.material === 'BioPET'
      );

      if (petData.length === 0) {
        return { progress: 0, currentRate: 0, target: this.targets.recycledContentPET };
      }

      const totalPETVolume = petData.reduce((sum, item) => sum + (item.volume || 0), 0);
      const recycledContentVolume = petData.reduce((sum, item) => 
        sum + ((item.volume || 0) * (item.recycledContent || 0) / 100), 0
      );

      const currentRate = totalPETVolume > 0 ? (recycledContentVolume / totalPETVolume) * 100 : 0;
      const progress = (currentRate / this.targets.recycledContentPET) * 100;

      return {
        currentRate: Math.round(currentRate * 100) / 100,
        progress: Math.round(progress * 100) / 100,
        target: this.targets.recycledContentPET,
        totalVolume: totalPETVolume,
        recycledVolume: recycledContentVolume,
        onTrack: currentRate >= this.targets.recycledContentPET * 0.8
      };
    } catch (error) {
      logger.error('Error calculating recycled content progress:', error);
      throw error;
    }
  }

  // Analyze regional performance
  analyzeRegionalPerformance(data, metric) {
    try {
      const regions = ['Europe', 'Asia Pacific'];
      const analysis = {};

      regions.forEach(region => {
        const regionalData = data.filter(item => item.region === region);
        
        analysis[region] = {
          dataPoints: regionalData.length,
          performance: this.calculateRegionalMetrics(regionalData, metric),
          trends: this.calculateTrends(regionalData, metric),
          ranking: 0 // Will be calculated after all regions
        };
      });

      // Calculate rankings
      const performanceValues = Object.values(analysis).map(a => a.performance.average || 0);
      Object.keys(analysis).forEach((region, index) => {
        const value = analysis[region].performance.average || 0;
        analysis[region].ranking = performanceValues.filter(v => v > value).length + 1;
      });

      logger.info(`Analyzed regional performance for metric: ${metric}`);
      return analysis;
    } catch (error) {
      logger.error('Error analyzing regional performance:', error);
      throw error;
    }
  }

  calculateRegionalMetrics(data, metric) {
    if (data.length === 0) {
      return { average: 0, min: 0, max: 0, total: 0 };
    }

    const values = data.map(item => item[metric] || 0).filter(v => !isNaN(v));
    
    return {
      average: _.mean(values),
      min: _.min(values),
      max: _.max(values),
      total: _.sum(values),
      count: values.length
    };
  }

  calculateTrends(data, metric) {
    if (data.length < 2) {
      return { trend: 'stable', change: 0 };
    }

    // Sort by date and calculate trend
    const sortedData = _.sortBy(data, 'createdAt');
    const recent = sortedData.slice(-3); // Last 3 data points
    const older = sortedData.slice(0, 3); // First 3 data points

    if (recent.length === 0 || older.length === 0) {
      return { trend: 'stable', change: 0 };
    }

    const recentAvg = _.meanBy(recent, metric);
    const olderAvg = _.meanBy(older, metric);
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    let trend = 'stable';
    if (change > 5) trend = 'improving';
    else if (change < -5) trend = 'declining';

    return { trend, change: Math.round(change * 100) / 100 };
  }

  // Generate KPI dashboard data
  generateKPIDashboard(packagingData, emissionData, kpiData) {
    try {
      const dashboard = {
        overview: {
          ghgReduction: this.calculateEmissionReduction(
            _.sumBy(emissionData, 'value'),
            _.sumBy(emissionData, 'baseline')
          ),
          recyclablePackaging: this.analyzeRecyclability(packagingData),
          recycledContent: this.calculateRecycledContentProgress(packagingData),
          collectionRates: this.calculateCollectionRates(packagingData)
        },
        regional: {
          europe: this.analyzeRegionalPerformance(
            packagingData.filter(p => p.region === 'Europe'), 
            'recyclableContent'
          ),
          asiaPacific: this.analyzeRegionalPerformance(
            packagingData.filter(p => p.region === 'Asia Pacific'), 
            'recyclableContent'
          )
        },
        trends: this.calculateOverallTrends(kpiData),
        alerts: this.generateAlerts(packagingData, emissionData)
      };

      logger.info('Generated KPI dashboard');
      return dashboard;
    } catch (error) {
      logger.error('Error generating KPI dashboard:', error);
      throw error;
    }
  }

  calculateCollectionRates(packagingData) {
    const europe = packagingData.filter(p => p.region === 'Europe');
    const api = packagingData.filter(p => p.region === 'Asia Pacific');

    return {
      europe: {
        current: _.meanBy(europe, 'collectionRate') || 0,
        target: this.targets.collectionRateEurope,
        progress: ((_.meanBy(europe, 'collectionRate') || 0) / this.targets.collectionRateEurope) * 100
      },
      asiaPacific: {
        current: _.meanBy(api, 'collectionRate') || 0,
        target: this.targets.collectionRateAPI,
        progress: ((_.meanBy(api, 'collectionRate') || 0) / this.targets.collectionRateAPI) * 100
      }
    };
  }

  calculateOverallTrends(kpiData) {
    const trends = {};
    
    const kpiGroups = _.groupBy(kpiData, 'kpiName');
    
    Object.keys(kpiGroups).forEach(kpiName => {
      const data = _.sortBy(kpiGroups[kpiName], 'lastUpdated');
      trends[kpiName] = this.calculateTrends(data, 'currentValue');
    });

    return trends;
  }

  generateAlerts(packagingData, emissionData) {
    const alerts = [];

    // Check for targets at risk
    const recyclability = this.analyzeRecyclability(packagingData);
    if (recyclability.recyclabilityRate < 90) {
      alerts.push({
        type: 'warning',
        message: 'Recyclable packaging target at risk',
        value: `${recyclability.recyclabilityRate.toFixed(1)}%`,
        target: '100%'
      });
    }

    // Check emission reduction progress
    const emissionReduction = this.calculateEmissionReduction(
      _.sumBy(emissionData, 'value'),
      _.sumBy(emissionData, 'baseline')
    );
    
    if (!emissionReduction.onTrack) {
      alerts.push({
        type: 'critical',
        message: 'GHG reduction target behind schedule',
        value: `${emissionReduction.reduction}%`,
        target: `${this.targets.ghgReduction}%`
      });
    }

    return alerts;
  }

  // Validate and clean data
  validateData(data, schema) {
    try {
      const validatedData = data.filter(item => {
        return schema.every(field => {
          if (field.required && (item[field.name] === undefined || item[field.name] === null)) {
            return false;
          }
          if (field.type === 'number' && isNaN(Number(item[field.name]))) {
            return false;
          }
          return true;
        });
      });

      logger.info(`Validated ${validatedData.length} of ${data.length} records`);
      return validatedData;
    } catch (error) {
      logger.error('Error validating data:', error);
      throw error;
    }
  }
}

module.exports = DataProcessor;
