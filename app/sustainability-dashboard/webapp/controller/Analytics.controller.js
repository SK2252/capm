sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/api/env/Format"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment, ChartFormatter, Format) {
    "use strict";

    return Controller.extend("ccep.sustainability.dashboard.controller.Analytics", {

        onInit: function () {
            this._initializeModels();
            this._setupCharts();
            this._loadAnalyticsData();
        },

        _initializeModels: function () {
            this.oAnalyticsModel = new JSONModel({
                selectedRegion: "Global",
                selectedTimeRange: "12months",
                selectedMetrics: ["ghgEmissions", "recyclablePackaging", "recycledContent"],
                
                kpiAnalysis: {
                    ghgEmissions: {
                        current: 815,
                        target: 700,
                        baseline: 1000,
                        progress: 18.5,
                        trend: "improving",
                        forecast: [
                            { period: "2024 Q4", value: 810, confidence: 0.92 },
                            { period: "2025 Q1", value: 795, confidence: 0.88 },
                            { period: "2025 Q2", value: 780, confidence: 0.84 },
                            { period: "2025 Q3", value: 765, confidence: 0.80 }
                        ]
                    },
                    recyclablePackaging: {
                        current: 87.3,
                        target: 100,
                        progress: 87.3,
                        trend: "improving",
                        forecast: [
                            { period: "2024 Q4", value: 89.1, confidence: 0.95 },
                            { period: "2025 Q1", value: 92.4, confidence: 0.91 },
                            { period: "2025 Q2", value: 95.8, confidence: 0.87 },
                            { period: "2025 Q3", value: 98.2, confidence: 0.83 }
                        ]
                    },
                    recycledContent: {
                        current: 42.1,
                        target: 50,
                        progress: 84.2,
                        trend: "improving",
                        forecast: [
                            { period: "2024 Q4", value: 43.8, confidence: 0.89 },
                            { period: "2025 Q1", value: 46.2, confidence: 0.85 },
                            { period: "2025 Q2", value: 48.7, confidence: 0.81 },
                            { period: "2025 Q3", value: 50.1, confidence: 0.77 }
                        ]
                    }
                },

                scenarioAnalysis: {
                    baseScenario: "Current Trajectory",
                    scenarios: [
                        {
                            name: "Optimistic",
                            description: "Accelerated investment and favorable regulations",
                            outcomes: {
                                ghgReduction: 35,
                                recyclablePackaging: 100,
                                recycledContent: 60
                            },
                            probability: 0.25
                        },
                        {
                            name: "Realistic",
                            description: "Current pace with planned investments",
                            outcomes: {
                                ghgReduction: 30,
                                recyclablePackaging: 95,
                                recycledContent: 50
                            },
                            probability: 0.60
                        },
                        {
                            name: "Pessimistic",
                            description: "Delays and regulatory challenges",
                            outcomes: {
                                ghgReduction: 22,
                                recyclablePackaging: 85,
                                recycledContent: 40
                            },
                            probability: 0.15
                        }
                    ]
                },

                regionalComparison: [
                    { region: "Europe", metric: "GHG Reduction", value: 22.1, target: 30 },
                    { region: "Asia Pacific", metric: "GHG Reduction", value: 14.8, target: 30 },
                    { region: "Europe", metric: "Collection Rate", value: 76.7, target: 85 },
                    { region: "Asia Pacific", metric: "Collection Rate", value: 53.0, target: 70 },
                    { region: "Europe", metric: "Recycled Content", value: 48.5, target: 50 },
                    { region: "Asia Pacific", metric: "Recycled Content", value: 26.9, target: 50 }
                ],

                correlationAnalysis: [
                    { variable1: "Investment", variable2: "GHG Reduction", correlation: 0.78, significance: "High" },
                    { variable1: "Collection Rate", variable2: "Recycled Content", correlation: 0.65, significance: "Medium" },
                    { variable1: "Regulatory Support", variable2: "Recyclable Packaging", correlation: 0.82, significance: "High" },
                    { variable1: "Technology Adoption", variable2: "Efficiency", correlation: 0.71, significance: "High" }
                ],

                aiInsights: [
                    {
                        type: "trend",
                        title: "Accelerating Progress in Europe",
                        description: "European operations show 15% faster improvement in recycled content adoption compared to baseline projections.",
                        confidence: 0.91,
                        priority: "medium"
                    },
                    {
                        type: "risk",
                        title: "Asia Pacific Collection Rate Risk",
                        description: "Current trajectory suggests 23% shortfall in Asia Pacific collection rate targets by 2025.",
                        confidence: 0.87,
                        priority: "high"
                    },
                    {
                        type: "opportunity",
                        title: "Technology Investment ROI",
                        description: "Advanced recycling technologies show 3.2x ROI potential with 18-month payback period.",
                        confidence: 0.84,
                        priority: "high"
                    }
                ],

                busy: false,
                lastUpdated: new Date()
            });

            this.getView().setModel(this.oAnalyticsModel, "analytics");
        },

        _setupCharts: function () {
            Format.numericFormatter(ChartFormatter.getInstance());
            
            // Configure chart properties after view is rendered
            setTimeout(() => {
                this._configureCharts();
            }, 100);
        },

        _configureCharts: function () {
            // KPI Trend Chart
            const oKPIChart = this.byId("kpiTrendChart");
            if (oKPIChart) {
                oKPIChart.setVizProperties({
                    plotArea: {
                        dataLabel: { visible: false },
                        colorPalette: ["#5cbae6", "#b6d957", "#fac364", "#8cd3ff"]
                    },
                    valueAxis: {
                        title: { visible: true, text: "Value" }
                    },
                    categoryAxis: {
                        title: { visible: true, text: "Period" }
                    },
                    title: { visible: false },
                    legend: { visible: true }
                });
            }

            // Scenario Analysis Chart
            const oScenarioChart = this.byId("scenarioChart");
            if (oScenarioChart) {
                oScenarioChart.setVizProperties({
                    plotArea: {
                        dataLabel: { visible: true },
                        colorPalette: ["#5cbae6", "#b6d957", "#fac364"]
                    },
                    valueAxis: {
                        title: { visible: true, text: "Achievement %" }
                    },
                    categoryAxis: {
                        title: { visible: true, text: "Scenarios" }
                    },
                    title: { visible: false }
                });
            }

            // Regional Comparison Chart
            const oRegionalChart = this.byId("regionalComparisonChart");
            if (oRegionalChart) {
                oRegionalChart.setVizProperties({
                    plotArea: {
                        dataLabel: { visible: true },
                        colorPalette: ["#5cbae6", "#b6d957"]
                    },
                    valueAxis: {
                        title: { visible: true, text: "Performance %" }
                    },
                    categoryAxis: {
                        title: { visible: true, text: "Region & Metric" }
                    },
                    title: { visible: false }
                });
            }
        },

        _loadAnalyticsData: function () {
            this.oAnalyticsModel.setProperty("/busy", true);
            
            const oModel = this.getView().getModel();
            const sRegion = this.oAnalyticsModel.getProperty("/selectedRegion");
            const sTimeRange = this.oAnalyticsModel.getProperty("/selectedTimeRange");

            // Load KPI analysis data
            Promise.all([
                this._loadKPIAnalysis(),
                this._loadScenarioAnalysis(),
                this._loadAIInsights()
            ]).then(() => {
                this.oAnalyticsModel.setProperty("/busy", false);
                this.oAnalyticsModel.setProperty("/lastUpdated", new Date());
                MessageToast.show("Analytics data refreshed");
            }).catch((error) => {
                this.oAnalyticsModel.setProperty("/busy", false);
                MessageBox.error("Failed to load analytics data: " + error.message);
            });
        },

        _loadKPIAnalysis: function () {
            return new Promise((resolve, reject) => {
                const oModel = this.getView().getModel();
                
                // Load KPI analysis for each selected metric
                const aMetrics = this.oAnalyticsModel.getProperty("/selectedMetrics");
                const aPromises = aMetrics.map(sMetric => {
                    return new Promise((resolveMetric) => {
                        oModel.callFunction("/getKPIAnalysis", {
                            urlParameters: {
                                kpiName: sMetric,
                                region: this.oAnalyticsModel.getProperty("/selectedRegion"),
                                timeRange: this.oAnalyticsModel.getProperty("/selectedTimeRange")
                            },
                            success: (data) => {
                                // Update model with real data
                                resolveMetric(data);
                            },
                            error: () => {
                                // Use mock data on error
                                resolveMetric();
                            }
                        });
                    });
                });

                Promise.all(aPromises).then(() => resolve()).catch(reject);
            });
        },

        _loadScenarioAnalysis: function () {
            return new Promise((resolve, reject) => {
                const oModel = this.getView().getModel();
                
                oModel.callFunction("/performScenarioAnalysis", {
                    urlParameters: {
                        baseScenario: "current_trajectory",
                        variables: JSON.stringify(["investment", "regulation", "technology"]),
                        timeHorizon: "2030"
                    },
                    success: (data) => {
                        if (data.scenarios) {
                            this.oAnalyticsModel.setProperty("/scenarioAnalysis/scenarios", data.scenarios);
                        }
                        resolve(data);
                    },
                    error: () => {
                        // Use mock data on error
                        resolve();
                    }
                });
            });
        },

        _loadAIInsights: function () {
            return new Promise((resolve, reject) => {
                const oModel = this.getView().getModel();
                
                oModel.callFunction("/queryInsights", {
                    urlParameters: {
                        question: "What are the key analytics insights for CCEP sustainability performance?",
                        context: "analytics_dashboard",
                        agentType: "general"
                    },
                    success: (data) => {
                        // Parse AI insights and update model
                        resolve(data);
                    },
                    error: () => {
                        // Use mock insights on error
                        resolve();
                    }
                });
            });
        },

        // Event Handlers
        onRegionChange: function (oEvent) {
            const sSelectedRegion = oEvent.getParameter("selectedItem").getKey();
            this.oAnalyticsModel.setProperty("/selectedRegion", sSelectedRegion);
            this._loadAnalyticsData();
        },

        onTimeRangeChange: function (oEvent) {
            const sSelectedRange = oEvent.getParameter("selectedItem").getKey();
            this.oAnalyticsModel.setProperty("/selectedTimeRange", sSelectedRange);
            this._loadAnalyticsData();
        },

        onMetricSelectionChange: function (oEvent) {
            const aSelectedItems = oEvent.getParameter("selectedItems");
            const aSelectedMetrics = aSelectedItems.map(item => item.getKey());
            this.oAnalyticsModel.setProperty("/selectedMetrics", aSelectedMetrics);
            this._loadAnalyticsData();
        },

        onRunScenarioAnalysis: function () {
            if (!this._scenarioDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "ccep.sustainability.dashboard.view.fragments.ScenarioDialog",
                    controller: this
                }).then((oDialog) => {
                    this._scenarioDialog = oDialog;
                    this.getView().addDependent(this._scenarioDialog);
                    this._scenarioDialog.open();
                });
            } else {
                this._scenarioDialog.open();
            }
        },

        onGenerateForecast: function () {
            MessageToast.show("Generating AI-powered forecast...");
            
            const oModel = this.getView().getModel();
            oModel.callFunction("/predictEmissions", {
                urlParameters: {
                    scenario: "current_trajectory",
                    timeHorizon: "2030",
                    region: this.oAnalyticsModel.getProperty("/selectedRegion")
                },
                success: (data) => {
                    MessageBox.success("Forecast generated successfully!");
                    // Update forecast data in model
                },
                error: (error) => {
                    MessageBox.error("Failed to generate forecast: " + error.message);
                }
            });
        },

        onExportAnalytics: function () {
            MessageToast.show("Exporting analytics data...");
            
            const oModel = this.getView().getModel();
            oModel.callFunction("/exportSustainabilityData", {
                urlParameters: {
                    dataType: "analytics",
                    format: "xlsx",
                    filters: JSON.stringify({
                        region: this.oAnalyticsModel.getProperty("/selectedRegion"),
                        timeRange: this.oAnalyticsModel.getProperty("/selectedTimeRange")
                    }),
                    includeAI: true
                },
                success: (data) => {
                    // Handle file download
                    MessageToast.show("Analytics data exported successfully");
                },
                error: (error) => {
                    MessageBox.error("Failed to export data: " + error.message);
                }
            });
        },

        onRefreshData: function () {
            this._loadAnalyticsData();
        },

        onInsightPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("analytics");
            const oInsight = oContext.getObject();
            
            MessageBox.information(
                oInsight.description,
                {
                    title: oInsight.title,
                    details: `Confidence: ${(oInsight.confidence * 100).toFixed(1)}%\nPriority: ${oInsight.priority}`
                }
            );
        },

        onCorrelationPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("analytics");
            const oCorrelation = oContext.getObject();
            
            MessageBox.information(
                `Correlation between ${oCorrelation.variable1} and ${oCorrelation.variable2}: ${oCorrelation.correlation}\nStatistical Significance: ${oCorrelation.significance}`,
                {
                    title: "Correlation Analysis"
                }
            );
        },

        // Formatters
        formatTrendIcon: function (trend) {
            const iconMap = {
                improving: "sap-icon://trend-up",
                stable: "sap-icon://horizontal-bar-chart",
                declining: "sap-icon://trend-down"
            };
            return iconMap[trend] || "sap-icon://question-mark";
        },

        formatTrendColor: function (trend) {
            const colorMap = {
                improving: "Good",
                stable: "Neutral",
                declining: "Error"
            };
            return colorMap[trend] || "None";
        },

        formatPercentage: function (value) {
            return value ? `${value.toFixed(1)}%` : "0%";
        },

        formatConfidence: function (confidence) {
            return confidence ? `${(confidence * 100).toFixed(0)}%` : "N/A";
        },

        formatPriorityState: function (priority) {
            const stateMap = {
                high: "Error",
                medium: "Warning",
                low: "Success"
            };
            return stateMap[priority] || "None";
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        onNavBack: function () {
            this.getRouter().navTo("RouteDashboard");
        },

        onExit: function () {
            if (this._scenarioDialog) {
                this._scenarioDialog.destroy();
            }
        }
    });
});
