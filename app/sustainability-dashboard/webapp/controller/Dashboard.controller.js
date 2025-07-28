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

    return Controller.extend("ccep.sustainability.dashboard.controller.Dashboard", {

        onInit: function () {
            this._initializeModels();
            this._loadDashboardData();
            this._setupCharts();
            this._startDataRefresh();
        },

        _initializeModels: function () {
            // Initialize local models for dashboard data
            this.oViewModel = new JSONModel({
                dashboard: {
                    overview: {
                        ghgReduction: {
                            reduction: 18.5,
                            progress: 61.7,
                            onTrack: true,
                            target: 30
                        },
                        recyclablePackaging: {
                            recyclabilityRate: 87.3,
                            target: 100,
                            onTrack: true
                        },
                        recycledContent: {
                            currentRate: 42.1,
                            progress: 84.2,
                            onTrack: true,
                            target: 50
                        },
                        collectionRates: {
                            europe: {
                                current: 76.7,
                                target: 85,
                                trend: "improving"
                            },
                            asiaPacific: {
                                current: 53.0,
                                target: 70,
                                trend: "improving"
                            }
                        }
                    },
                    alerts: [
                        {
                            type: "warning",
                            message: "Asia Pacific collection rate below target",
                            target: "70%",
                            value: "53%",
                            priority: "high"
                        },
                        {
                            type: "info",
                            message: "New recycling facility operational in Germany",
                            target: "Q4 2024",
                            value: "Completed",
                            priority: "medium"
                        }
                    ]
                },
                charts: {
                    emissionTrends: [],
                    regionalPerformance: []
                },
                aiInsights: {
                    latest: {
                        insight: "Focus on Asia Pacific collection infrastructure to achieve 2025 targets",
                        confidence: 0.89,
                        timestamp: new Date().toISOString()
                    }
                },
                recentActivity: [
                    {
                        title: "Quarterly Report Generated",
                        description: "Q3 2024 sustainability report completed",
                        timestamp: new Date(Date.now() - 86400000).toISOString(),
                        icon: "sap-icon://document"
                    },
                    {
                        title: "AI Analysis Completed",
                        description: "Packaging optimization recommendations updated",
                        timestamp: new Date(Date.now() - 172800000).toISOString(),
                        icon: "sap-icon://robot"
                    }
                ],
                busy: false,
                refreshing: false
            });

            this.getView().setModel(this.oViewModel, "view");
        },

        _loadDashboardData: function () {
            this.oViewModel.setProperty("/busy", true);
            
            // Load dashboard data from service
            const oModel = this.getView().getModel();
            
            Promise.all([
                this._loadKPIData(),
                this._loadChartData(),
                this._loadAIInsights(),
                this._loadAlerts()
            ]).then(() => {
                this.oViewModel.setProperty("/busy", false);
                MessageToast.show("Dashboard data refreshed");
            }).catch((error) => {
                this.oViewModel.setProperty("/busy", false);
                MessageBox.error("Failed to load dashboard data: " + error.message);
            });
        },

        _loadKPIData: function () {
            return new Promise((resolve, reject) => {
                const oModel = this.getView().getModel();
                
                // Call service function to get dashboard data
                oModel.callFunction("/getDashboardData", {
                    urlParameters: {
                        region: "Global",
                        period: "current",
                        kpis: JSON.stringify(["ghgReduction", "recyclablePackaging", "recycledContent", "collectionRates"])
                    },
                    success: (data) => {
                        this.oViewModel.setProperty("/dashboard/overview", data.overview);
                        resolve(data);
                    },
                    error: (error) => {
                        console.error("Failed to load KPI data:", error);
                        reject(error);
                    }
                });
            });
        },

        _loadChartData: function () {
            return new Promise((resolve, reject) => {
                // Load emission trends
                const emissionTrends = [
                    { period: "2020", value: 1000, target: 1000 },
                    { period: "2021", value: 950, target: 950 },
                    { period: "2022", value: 890, target: 900 },
                    { period: "2023", value: 820, target: 850 },
                    { period: "2024", value: 815, target: 800 },
                    { period: "2025", value: 750, target: 750 },
                    { period: "2030", value: 700, target: 700 }
                ];

                const regionalPerformance = [
                    { region: "Europe", metric: "Collection Rate", value: 76.7 },
                    { region: "Asia Pacific", metric: "Collection Rate", value: 53.0 },
                    { region: "Europe", metric: "Recycled Content", value: 48.5 },
                    { region: "Asia Pacific", metric: "Recycled Content", value: 26.9 }
                ];

                this.oViewModel.setProperty("/charts/emissionTrends", emissionTrends);
                this.oViewModel.setProperty("/charts/regionalPerformance", regionalPerformance);
                
                resolve();
            });
        },

        _loadAIInsights: function () {
            return new Promise((resolve, reject) => {
                const oModel = this.getView().getModel();
                
                oModel.callFunction("/queryInsights", {
                    urlParameters: {
                        question: "What are the key sustainability priorities for CCEP?",
                        context: "dashboard_overview",
                        agentType: "general"
                    },
                    success: (data) => {
                        this.oViewModel.setProperty("/aiInsights/latest", {
                            insight: data.answer,
                            confidence: data.confidence,
                            timestamp: new Date().toISOString()
                        });
                        resolve(data);
                    },
                    error: (error) => {
                        console.error("Failed to load AI insights:", error);
                        // Use default insight on error
                        resolve();
                    }
                });
            });
        },

        _loadAlerts: function () {
            return new Promise((resolve, reject) => {
                const oModel = this.getView().getModel();
                
                oModel.callFunction("/getAlerts", {
                    urlParameters: {
                        severity: "all",
                        category: "sustainability",
                        region: "Global"
                    },
                    success: (data) => {
                        this.oViewModel.setProperty("/dashboard/alerts", data);
                        resolve(data);
                    },
                    error: (error) => {
                        console.error("Failed to load alerts:", error);
                        resolve(); // Continue with default alerts
                    }
                });
            });
        },

        _setupCharts: function () {
            // Configure chart formatting
            Format.numericFormatter(ChartFormatter.getInstance());
            
            // Setup emission trend chart
            const oEmissionChart = this.byId("emissionTrendChart");
            if (oEmissionChart) {
                oEmissionChart.setVizProperties({
                    plotArea: {
                        dataLabel: {
                            visible: false
                        }
                    },
                    valueAxis: {
                        title: {
                            visible: true,
                            text: "Emissions (kt CO2e)"
                        }
                    },
                    categoryAxis: {
                        title: {
                            visible: true,
                            text: "Year"
                        }
                    },
                    title: {
                        visible: false
                    }
                });
            }

            // Setup regional chart
            const oRegionalChart = this.byId("regionalChart");
            if (oRegionalChart) {
                oRegionalChart.setVizProperties({
                    plotArea: {
                        dataLabel: {
                            visible: true
                        }
                    },
                    valueAxis: {
                        title: {
                            visible: true,
                            text: "Percentage (%)"
                        }
                    },
                    categoryAxis: {
                        title: {
                            visible: true,
                            text: "Region & Metric"
                        }
                    },
                    title: {
                        visible: false
                    }
                });
            }
        },

        _startDataRefresh: function () {
            // Refresh data every 5 minutes
            this._refreshInterval = setInterval(() => {
                if (!this.oViewModel.getProperty("/refreshing")) {
                    this.oViewModel.setProperty("/refreshing", true);
                    this._loadDashboardData().finally(() => {
                        this.oViewModel.setProperty("/refreshing", false);
                    });
                }
            }, 300000); // 5 minutes
        },

        // Event Handlers
        onKPIPress: function (oEvent) {
            const sKPI = oEvent.getSource().data("kpi");
            MessageToast.show(`Navigating to ${sKPI} details`);
            
            // Navigate to specific KPI view
            switch (sKPI) {
                case "ghgReduction":
                    this.getRouter().navTo("RouteEmissions");
                    break;
                case "recyclablePackaging":
                case "recycledContent":
                    this.getRouter().navTo("RoutePackaging");
                    break;
                case "collectionRateEurope":
                case "collectionRateAPI":
                    this.getRouter().navTo("RouteAnalytics");
                    break;
            }
        },

        onAIInsightsPress: function () {
            this.getRouter().navTo("RouteAIChat");
        },

        onAlertPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("view");
            const oAlert = oContext.getObject();
            
            MessageBox.information(
                `Alert: ${oAlert.message}\nTarget: ${oAlert.target}\nCurrent: ${oAlert.value}`,
                {
                    title: "Alert Details"
                }
            );
        },

        onGenerateReport: function () {
            if (!this._reportDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "ccep.sustainability.dashboard.view.fragments.ReportDialog",
                    controller: this
                }).then((oDialog) => {
                    this._reportDialog = oDialog;
                    this.getView().addDependent(this._reportDialog);
                    this._reportDialog.open();
                });
            } else {
                this._reportDialog.open();
            }
        },

        onConfirmGenerateReport: function () {
            const sReportType = this.byId("reportTypeSelect").getSelectedKey();
            const sPeriod = this.byId("reportPeriodSelect").getSelectedKey();
            const sRegion = this.byId("reportRegionSelect").getSelectedKey();
            
            MessageToast.show(`Generating ${sReportType} report for ${sPeriod} (${sRegion})`);
            
            // Call service to generate report
            const oModel = this.getView().getModel();
            oModel.callFunction("/generateReport", {
                urlParameters: {
                    reportType: sReportType,
                    period: sPeriod,
                    region: sRegion,
                    includeAI: true
                },
                success: (data) => {
                    MessageBox.success("Report generated successfully!");
                    // Handle report download or display
                },
                error: (error) => {
                    MessageBox.error("Failed to generate report: " + error.message);
                }
            });
            
            this._reportDialog.close();
        },

        onCancelGenerateReport: function () {
            this._reportDialog.close();
        },

        onAIAnalysis: function () {
            this.getRouter().navTo("RouteAnalytics");
        },

        onExportData: function () {
            MessageToast.show("Exporting dashboard data...");
            // Implement data export functionality
        },

        onScheduleMeeting: function () {
            MessageToast.show("Opening calendar integration...");
            // Implement calendar integration
        },

        onViewTrends: function () {
            this.getRouter().navTo("RouteAnalytics");
        },

        onDashboardSettings: function () {
            MessageToast.show("Opening dashboard settings...");
            // Implement settings dialog
        },

        onOpenAIChat: function () {
            this.getRouter().navTo("RouteAIChat");
        },

        // Formatters
        formatPercentage: function (value) {
            return value ? `${value.toFixed(1)}%` : "0%";
        },

        formatStatusColor: function (onTrack) {
            return onTrack ? "Good" : "Error";
        },

        formatAlertIcon: function (type) {
            const iconMap = {
                error: "sap-icon://error",
                warning: "sap-icon://warning",
                info: "sap-icon://information",
                success: "sap-icon://sys-enter-2"
            };
            return iconMap[type] || "sap-icon://information";
        },

        formatAlertHighlight: function (type) {
            const highlightMap = {
                error: "Error",
                warning: "Warning",
                info: "Information",
                success: "Success"
            };
            return highlightMap[type] || "None";
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        onExit: function () {
            if (this._refreshInterval) {
                clearInterval(this._refreshInterval);
            }
            if (this._reportDialog) {
                this._reportDialog.destroy();
            }
        }
    });
});
