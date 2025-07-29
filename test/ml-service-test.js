// Load environment variables first
require('dotenv').config({ path: './config/.env' });

const MLService = require('../srv/lib/ml-service');
const GenAIService = require('../srv/lib/gen-ai-service');

/**
 * Test script for ML Service with Gemini 1.5 Flash
 */
async function testMLService() {
  console.log('🧪 Testing ML Service with Gemini 1.5 Flash...\n');

  try {
    // Initialize services
    const mlService = new MLService();
    const genAIService = new GenAIService();

    // Test 1: ML Service Status
    console.log('1️⃣ Testing ML Service Status...');
    const status = await mlService.getMLServiceStatus();
    console.log('✅ ML Service Status:', JSON.stringify(status, null, 2));
    console.log('');

    // Test 2: Advanced Emission Prediction
    console.log('2️⃣ Testing Advanced Emission Prediction...');
    const historicalData = [
      { year: 2020, emissions: 1000, region: 'Europe' },
      { year: 2021, emissions: 950, region: 'Europe' },
      { year: 2022, emissions: 900, region: 'Europe' },
      { year: 2023, emissions: 850, region: 'Europe' }
    ];
    
    const scenario = {
      name: 'Aggressive Reduction',
      timeHorizon: '2030',
      externalFactors: 'Regulatory support and technology advancement'
    };

    const emissionPrediction = await mlService.predictEmissionsAdvanced(historicalData, scenario);
    console.log('✅ Emission Prediction Result:');
    console.log(`   Confidence: ${emissionPrediction.confidence}`);
    console.log(`   Methodology: ${emissionPrediction.methodology}`);
    console.log(`   Features Used: ${emissionPrediction.features_used.join(', ')}`);
    console.log('');

    // Test 3: Packaging Optimization
    console.log('3️⃣ Testing Packaging Material Optimization...');
    const currentPackaging = [
      { material: 'PET', volume: 1000, recyclability: 85, cost: 0.15 },
      { material: 'Aluminum', volume: 500, recyclability: 95, cost: 0.25 }
    ];

    const constraints = {
      maxCost: 0.20,
      minRecyclability: 90,
      volumeRequirement: 1200
    };

    const objectives = {
      minimizeCost: 0.4,
      maximizeRecyclability: 0.6
    };

    const packagingOptimization = await mlService.optimizePackagingMaterials(
      currentPackaging, 
      constraints, 
      objectives
    );
    console.log('✅ Packaging Optimization Result:');
    console.log(`   Confidence: ${packagingOptimization.confidence}`);
    console.log(`   Methodology: ${packagingOptimization.methodology}`);
    console.log('');

    // Test 4: Supply Chain Risk Assessment
    console.log('4️⃣ Testing Supply Chain Risk Assessment...');
    const supplyChainData = [
      { supplier: 'Supplier A', region: 'Europe', performance: 85, riskScore: 0.2 },
      { supplier: 'Supplier B', region: 'Asia Pacific', performance: 75, riskScore: 0.4 }
    ];

    const riskFactors = {
      geopoliticalRisk: 0.3,
      regulatoryChanges: 0.2,
      supplierReliability: 0.5
    };

    const riskAssessment = await mlService.assessSupplyChainRisk(supplyChainData, riskFactors);
    console.log('✅ Supply Chain Risk Assessment Result:');
    console.log(`   Overall Risk Score: ${riskAssessment.overall_risk_score}`);
    console.log(`   Confidence: ${riskAssessment.confidence}`);
    console.log(`   Methodology: ${riskAssessment.methodology}`);
    console.log('');

    // Test 5: Regulatory Compliance Classification
    console.log('5️⃣ Testing Regulatory Compliance Classification...');
    const regulationText = `
      The European Union Single-Use Plastics Directive requires member states to achieve 
      a 90% collection rate for plastic bottles by 2029 and ensure that plastic bottles 
      contain at least 25% recycled content by 2025.
    `;

    const region = 'Europe';
    const context = {
      industry: 'Beverage',
      companySize: 'Large',
      currentCompliance: 'Partial'
    };

    const complianceClassification = await mlService.classifyRegulatoryCompliance(
      regulationText, 
      region, 
      context
    );
    console.log('✅ Regulatory Compliance Classification Result:');
    console.log(`   Compliance Status: ${complianceClassification.compliance_status}`);
    console.log(`   Compliance Score: ${complianceClassification.compliance_score}`);
    console.log(`   Risk Level: ${complianceClassification.risk_level}`);
    console.log(`   Confidence: ${complianceClassification.confidence}`);
    console.log('');

    // Test 6: Feature Engineering
    console.log('6️⃣ Testing Feature Engineering...');
    const rawData = [
      { date: '2023-01-01', emissions: 100, temperature: 15, production: 1000 },
      { date: '2023-02-01', emissions: 95, temperature: 12, production: 950 },
      { date: '2023-03-01', emissions: 90, temperature: 18, production: 1100 }
    ];

    const featureEngineering = await mlService.engineerFeatures(
      rawData, 
      'timeSeriesFeatures', 
      'emissions'
    );
    console.log('✅ Feature Engineering Result:');
    console.log(`   Methodology: ${featureEngineering.methodology}`);
    console.log('');

    console.log('🎉 All ML Service tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   ✅ ML Service Status: ${status.status}`);
    console.log(`   ✅ Model: ${status.model}`);
    console.log(`   ✅ Available ML Models: ${status.ml_models_available.length}`);
    console.log(`   ✅ Feature Engineering Types: ${status.feature_engineering_types.length}`);

  } catch (error) {
    console.error('❌ Error testing ML Service:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Test GenAI Service ML integration
 */
async function testGenAIServiceML() {
  console.log('\n🔗 Testing GenAI Service ML Integration...\n');

  try {
    const genAIService = new GenAIService();

    // Test ML Service Status through GenAI Service
    console.log('1️⃣ Testing ML Service Status via GenAI Service...');
    const mlStatus = await genAIService.getMLServiceStatus();
    console.log('✅ ML Status via GenAI:', JSON.stringify(mlStatus, null, 2));

    console.log('\n🎉 GenAI Service ML integration test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing GenAI Service ML integration:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting ML Service Tests with Gemini 1.5 Flash\n');
  console.log('=' .repeat(60));
  
  await testMLService();
  await testGenAIServiceML();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 All tests completed!');
}

// Execute if run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testMLService,
  testGenAIServiceML,
  runAllTests
};
