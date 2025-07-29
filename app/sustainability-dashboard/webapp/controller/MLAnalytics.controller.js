sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("ccep.sustainability.dashboard.controller.MLAnalytics", {

        onInit: function () {
            // Initialize ML Analytics model
            this.oMLModel = new JSONModel({
                isLoading: false,
                selectedAnalysisType: "emission_prediction",
                analysisTypes: [
                    { key: "emission_prediction", text: "Emission Prediction" },
                    { key: "packaging_optimization", text: "Packaging Optimization" },
                    { key: "supply_chain_risk", text: "Supply Chain Risk Assessment" },
                    { key: "regulatory_compliance", text: "Regulatory Compliance" }
                ],
                results: {},
                mlServiceStatus: {}
            });

            this.getView().setModel(this.oMLModel, "ml");
            this._loadMLServiceStatus();
        },

        /**
         * Load ML Service Status
         */
        _loadMLServiceStatus: function () {
            const oModel = this.getView().getModel();
            
            oModel.callFunction("/getMLServiceStatus", {
                method: "GET",
                success: (data) => {
                    this.oMLModel.setProperty("/mlServiceStatus", data);
                    if (data.status === "healthy") {
                        MessageToast.show("ML Service is ready with " + data.model);
                    }
                },
                error: (error) => {
                    MessageBox.error("Failed to load ML Service status: " + error.message);
                }
            });
        },

        /**
         * Run Emission Prediction ML Analysis
         */
        onRunEmissionPrediction: function () {
            this.oMLModel.setProperty("/isLoading", true);

            const historicalData = JSON.stringify([
                { year: 2020, emissions: 1000, region: "Europe" },
                { year: 2021, emissions: 950, region: "Europe" },
                { year: 2022, emissions: 900, region: "Europe" },
                { year: 2023, emissions: 850, region: "Europe" }
            ]);

            const oModel = this.getView().getModel();
            
            oModel.callFunction("/predictEmissionsML", {
                urlParameters: {
                    historicalData: historicalData,
                    scenario: "Aggressive Reduction",
                    timeHorizon: "2030"
                },
                success: (data) => {
                    this.oMLModel.setProperty("/results/emissionPrediction", data);
                    this.oMLModel.setProperty("/isLoading", false);
                    MessageToast.show("Emission prediction completed with " + 
                        (data.confidence * 100).toFixed(1) + "% confidence");
                    this._displayResults("Emission Prediction", data);
                },
                error: (error) => {
                    this.oMLModel.setProperty("/isLoading", false);
                    MessageBox.error("Emission prediction failed: " + error.message);
                }
            });
        },

        /**
         * Run Packaging Optimization ML Analysis
         */
        onRunPackagingOptimization: function () {
            this.oMLModel.setProperty("/isLoading", true);

            const currentPackaging = JSON.stringify([
                { material: "PET", volume: 1000, recyclability: 85, cost: 0.15 },
                { material: "Aluminum", volume: 500, recyclability: 95, cost: 0.25 }
            ]);

            const constraints = JSON.stringify({
                maxCost: 0.20,
                minRecyclability: 90,
                volumeRequirement: 1200
            });

            const objectives = JSON.stringify({
                minimizeCost: 0.4,
                maximizeRecyclability: 0.6
            });

            const oModel = this.getView().getModel();
            
            oModel.callFunction("/optimizePackagingML", {
                urlParameters: {
                    currentPackaging: currentPackaging,
                    constraints: constraints,
                    objectives: objectives
                },
                success: (data) => {
                    this.oMLModel.setProperty("/results/packagingOptimization", data);
                    this.oMLModel.setProperty("/isLoading", false);
                    MessageToast.show("Packaging optimization completed with " + 
                        (data.confidence * 100).toFixed(1) + "% confidence");
                    this._displayResults("Packaging Optimization", data);
                },
                error: (error) => {
                    this.oMLModel.setProperty("/isLoading", false);
                    MessageBox.error("Packaging optimization failed: " + error.message);
                }
            });
        },

        /**
         * Run Supply Chain Risk Assessment ML Analysis
         */
        onRunSupplyChainRisk: function () {
            this.oMLModel.setProperty("/isLoading", true);

            const supplyChainData = JSON.stringify([
                { supplier: "Supplier A", region: "Europe", performance: 85, riskScore: 0.2 },
                { supplier: "Supplier B", region: "Asia Pacific", performance: 75, riskScore: 0.4 }
            ]);

            const riskFactors = JSON.stringify({
                geopoliticalRisk: 0.3,
                regulatoryChanges: 0.2,
                supplierReliability: 0.5
            });

            const oModel = this.getView().getModel();
            
            oModel.callFunction("/assessSupplyChainRiskML", {
                urlParameters: {
                    supplyChainData: supplyChainData,
                    riskFactors: riskFactors
                },
                success: (data) => {
                    this.oMLModel.setProperty("/results/supplyChainRisk", data);
                    this.oMLModel.setProperty("/isLoading", false);
                    MessageToast.show("Supply chain risk assessment completed with " + 
                        (data.confidence * 100).toFixed(1) + "% confidence");
                    this._displayResults("Supply Chain Risk Assessment", data);
                },
                error: (error) => {
                    this.oMLModel.setProperty("/isLoading", false);
                    MessageBox.error("Supply chain risk assessment failed: " + error.message);
                }
            });
        },

        /**
         * Run Regulatory Compliance Classification ML Analysis
         */
        onRunRegulatoryCompliance: function () {
            this.oMLModel.setProperty("/isLoading", true);

            const regulationText = `The European Union Single-Use Plastics Directive requires member states to achieve 
                a 90% collection rate for plastic bottles by 2029 and ensure that plastic bottles 
                contain at least 25% recycled content by 2025.`;

            const context = JSON.stringify({
                industry: "Beverage",
                companySize: "Large",
                currentCompliance: "Partial"
            });

            const oModel = this.getView().getModel();
            
            oModel.callFunction("/classifyRegulatoryComplianceML", {
                urlParameters: {
                    regulationText: regulationText,
                    region: "Europe",
                    context: context
                },
                success: (data) => {
                    this.oMLModel.setProperty("/results/regulatoryCompliance", data);
                    this.oMLModel.setProperty("/isLoading", false);
                    MessageToast.show("Regulatory compliance classification completed with " + 
                        (data.confidence * 100).toFixed(1) + "% confidence");
                    this._displayResults("Regulatory Compliance Classification", data);
                },
                error: (error) => {
                    this.oMLModel.setProperty("/isLoading", false);
                    MessageBox.error("Regulatory compliance classification failed: " + error.message);
                }
            });
        },

        /**
         * Display ML Analysis Results
         */
        _displayResults: function (analysisType, data) {
            let message = `${analysisType} Results:\n\n`;
            
            switch (analysisType) {
                case "Emission Prediction":
                    message += `Methodology: ${data.methodology}\n`;
                    message += `Confidence: ${(data.confidence * 100).toFixed(1)}%\n`;
                    message += `Features Used: ${data.features_used.join(", ")}`;
                    break;
                    
                case "Packaging Optimization":
                    message += `Confidence: ${(data.confidence * 100).toFixed(1)}%\n`;
                    message += `Optimization completed successfully`;
                    break;
                    
                case "Supply Chain Risk Assessment":
                    message += `Overall Risk Score: ${data.overall_risk_score}\n`;
                    message += `Confidence: ${(data.confidence * 100).toFixed(1)}%`;
                    break;
                    
                case "Regulatory Compliance Classification":
                    message += `Compliance Status: ${data.compliance_status}\n`;
                    message += `Compliance Score: ${data.compliance_score}\n`;
                    message += `Risk Level: ${data.risk_level}\n`;
                    message += `Confidence: ${(data.confidence * 100).toFixed(1)}%`;
                    break;
            }

            MessageBox.information(message, {
                title: analysisType + " - Powered by Gemini 1.5 Flash"
            });
        },

        /**
         * Refresh ML Service Status
         */
        onRefreshMLStatus: function () {
            this._loadMLServiceStatus();
        },

        /**
         * Navigate back to main dashboard
         */
        onNavBack: function () {
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMain");
        }
    });
});
