namespace ccep.sustainability;

using {
  Currency,
  managed,
  sap,
  cuid
} from '@sap/cds/common';

// Core Packaging Metrics Entity
entity PackagingMetrics : managed {
  key ID          : UUID;
      material    : String(50) @title: 'Material Type';
      region      : String(20) @title: 'Region' enum {
        Europe = 'Europe';
        AsiaPacific = 'Asia Pacific';
        Global = 'Global';
      };
      recyclableContent : Decimal(5,2) @title: 'Recyclable Content %';
      collectionRate    : Decimal(5,2) @title: 'Collection Rate %';
      carbonFootprint   : Decimal(10,3) @title: 'Carbon Footprint (kg CO2e)';
      recycledContent   : Decimal(5,2) @title: 'Recycled Content %';
      packageType       : String(30) @title: 'Package Type';
      volume           : Decimal(15,2) @title: 'Volume (units)';
      weight           : Decimal(10,3) @title: 'Weight (kg)';
      supplier         : String(100) @title: 'Supplier';
      certifications   : String(200) @title: 'Certifications';
      targetYear       : Integer @title: 'Target Year';
      status          : String(20) @title: 'Status' enum {
        Active = 'Active';
        Planned = 'Planned';
        Discontinued = 'Discontinued';
      };
}

// Emission Data Entity
entity EmissionData : managed {
  key ID          : UUID;
      source      : String(50) @title: 'Emission Source' enum {
        Packaging = 'Packaging';
        Operations = 'Operations';
        Transportation = 'Transportation';
        SupplyChain = 'Supply Chain';
        Refrigeration = 'Refrigeration';
      };
      category    : String(50) @title: 'Category';
      value       : Decimal(15,3) @title: 'Emission Value';
      unit        : String(20) @title: 'Unit' enum {
        kgCO2e = 'kg CO2e';
        tCO2e = 't CO2e';
        MtCO2e = 'Mt CO2e';
      };
      period      : String(20) @title: 'Period';
      region      : String(20) @title: 'Region';
      target      : Decimal(15,3) @title: 'Target Value';
      baseline    : Decimal(15,3) @title: 'Baseline Value';
      reductionPercentage : Decimal(5,2) @title: 'Reduction %';
      methodology : String(100) @title: 'Calculation Methodology';
      verified    : Boolean @title: 'Third-party Verified';
      scope       : String(10) @title: 'GHG Scope' enum {
        Scope1 = 'Scope 1';
        Scope2 = 'Scope 2';
        Scope3 = 'Scope 3';
      };
}

// Sustainability Insights from AI
entity SustainabilityInsights : managed {
  key ID          : UUID;
      query       : String(500) @title: 'User Query';
      insight     : LargeString @title: 'AI Generated Insight';
      confidence  : Decimal(3,2) @title: 'Confidence Score';
      agentType   : String(50) @title: 'Agent Type' enum {
        PackagingAgent = 'Packaging Agent';
        EmissionAgent = 'Emission Agent';
        SupplyChainAgent = 'Supply Chain Agent';
        RegulatoryAgent = 'Regulatory Agent';
      };
      dataSource  : String(100) @title: 'Data Source';
      recommendations : LargeString @title: 'Recommendations';
      priority    : String(10) @title: 'Priority' enum {
        High = 'High';
        Medium = 'Medium';
        Low = 'Low';
      };
      status      : String(20) @title: 'Status' enum {
        New = 'New';
        Reviewed = 'Reviewed';
        Implemented = 'Implemented';
        Archived = 'Archived';
      };
      tags        : String(200) @title: 'Tags';
}

// Supply Chain Data
entity SupplyChainData : managed {
  key ID          : UUID;
      supplier    : String(100) @title: 'Supplier Name';
      region      : String(20) @title: 'Region';
      material    : String(50) @title: 'Material';
      sustainabilityScore : Decimal(3,1) @title: 'Sustainability Score';
      carbonIntensity : Decimal(10,3) @title: 'Carbon Intensity';
      recycledContentCapability : Decimal(5,2) @title: 'Recycled Content Capability %';
      certifications : String(200) @title: 'Certifications';
      riskLevel   : String(10) @title: 'Risk Level' enum {
        Low = 'Low';
        Medium = 'Medium';
        High = 'High';
      };
      contractValue : Decimal(15,2) @title: 'Contract Value';
      currency    : Currency;
      performanceRating : Decimal(3,1) @title: 'Performance Rating';
}

// Regulatory Compliance
entity RegulatoryCompliance : managed {
  key ID          : UUID;
      regulation  : String(100) @title: 'Regulation Name';
      region      : String(20) @title: 'Region';
      category    : String(50) @title: 'Category';
      requirement : LargeString @title: 'Requirement';
      complianceStatus : String(20) @title: 'Compliance Status' enum {
        Compliant = 'Compliant';
        NonCompliant = 'Non-Compliant';
        InProgress = 'In Progress';
        NotApplicable = 'Not Applicable';
      };
      deadline    : Date @title: 'Compliance Deadline';
      riskLevel   : String(10) @title: 'Risk Level';
      actions     : LargeString @title: 'Required Actions';
      responsible : String(100) @title: 'Responsible Party';
}

// KPI Tracking
entity KPITracking : managed {
  key ID          : UUID;
      kpiName     : String(100) @title: 'KPI Name';
      category    : String(50) @title: 'Category';
      currentValue : Decimal(15,3) @title: 'Current Value';
      targetValue : Decimal(15,3) @title: 'Target Value';
      unit        : String(20) @title: 'Unit';
      period      : String(20) @title: 'Period';
      region      : String(20) @title: 'Region';
      trend       : String(10) @title: 'Trend' enum {
        Improving = 'Improving';
        Stable = 'Stable';
        Declining = 'Declining';
      };
      achievementPercentage : Decimal(5,2) @title: 'Achievement %';
      lastUpdated : DateTime @title: 'Last Updated';
}

// AI Model Performance Tracking
entity AIModelPerformance : managed {
  key ID          : UUID;
      modelName   : String(50) @title: 'Model Name';
      version     : String(20) @title: 'Version';
      accuracy    : Decimal(5,4) @title: 'Accuracy';
      precision   : Decimal(5,4) @title: 'Precision';
      recall      : Decimal(5,4) @title: 'Recall';
      f1Score     : Decimal(5,4) @title: 'F1 Score';
      latency     : Integer @title: 'Latency (ms)';
      throughput  : Integer @title: 'Throughput (req/min)';
      errorRate   : Decimal(5,4) @title: 'Error Rate';
      lastEvaluated : DateTime @title: 'Last Evaluated';
}

// User Interactions for Analytics
entity UserInteractions : managed {
  key ID          : UUID;
      userId      : String(50) @title: 'User ID';
      sessionId   : String(100) @title: 'Session ID';
      action      : String(50) @title: 'Action';
      query       : String(500) @title: 'Query';
      response    : LargeString @title: 'Response';
      satisfaction : Integer @title: 'Satisfaction Rating';
      duration    : Integer @title: 'Duration (seconds)';
      deviceType  : String(20) @title: 'Device Type';
      location    : String(50) @title: 'Location';
}
