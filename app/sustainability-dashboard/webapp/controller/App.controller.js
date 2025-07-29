sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/theming/Parameters"
], function (Controller, JSONModel, MessageToast, MessageBox, Parameters) {
    "use strict";

    return Controller.extend("ccep.sustainability.dashboard.controller.App", {

        onInit: function () {
            this._initializeAppModel();
            this._setupEventBus();
            this._loadUserSettings();
            this._setupTheme();
        },

        _initializeAppModel: function () {
            this.oAppModel = new JSONModel({
                notifications: [
                    {
                        title: "Asia Pacific Collection Rate Alert",
                        description: "Collection rate below target threshold",
                        icon: "sap-icon://warning",
                        type: "warning",
                        timestamp: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        title: "Q3 Sustainability Report Ready",
                        description: "Quarterly report has been generated",
                        icon: "sap-icon://document",
                        type: "success",
                        timestamp: new Date(Date.now() - 7200000).toISOString()
                    },
                    {
                        title: "New Regulatory Update",
                        description: "EU CSRD implementation deadline approaching",
                        icon: "sap-icon://information",
                        type: "information",
                        timestamp: new Date(Date.now() - 10800000).toISOString()
                    }
                ],
                userSettings: {
                    theme: "sap_horizon",
                    defaultRegion: "Global",
                    refreshInterval: 300,
                    enableAI: true,
                    showAdvanced: true,
                    realTimeUpdates: true
                },
                currentUser: {
                    name: "Sustainability Manager",
                    role: "Manager",
                    region: "Global",
                    lastLogin: new Date().toISOString()
                },
                appInfo: {
                    version: "1.0.0",
                    buildDate: "2024-10-15",
                    environment: "Production"
                }
            });

            this.getView().setModel(this.oAppModel, "app");
        },

        _setupEventBus: function () {
            this.oEventBus = sap.ui.getCore().getEventBus();
            
            // Subscribe to global events
            this.oEventBus.subscribe("app", "showBusy", this.onShowBusy, this);
            this.oEventBus.subscribe("app", "hideBusy", this.onHideBusy, this);
            this.oEventBus.subscribe("app", "showError", this.onShowError, this);
            this.oEventBus.subscribe("app", "showSuccess", this.onShowSuccess, this);
        },

        _loadUserSettings: function () {
            // Load user settings from local storage or service
            const savedSettings = localStorage.getItem("ccep-user-settings");
            if (savedSettings) {
                try {
                    const settings = JSON.parse(savedSettings);
                    this.oAppModel.setProperty("/userSettings", settings);
                } catch (error) {
                    console.error("Failed to load user settings:", error);
                }
            }
        },

        _setupTheme: function () {
            const theme = this.oAppModel.getProperty("/userSettings/theme");
            if (theme && theme !== sap.ui.getCore().getConfiguration().getTheme()) {
                sap.ui.getCore().applyTheme(theme);
            }
        },

        // Navigation Events
        onNavToDashboard: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteDashboard");
        },

        onNavToAnalytics: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteAnalytics");
        },

        onNavToChat: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteAIChat");
        },

        onNavToML: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMLAnalytics");
        },

        onGenerateReport: function () {
            sap.m.MessageToast.show("Generating sustainability report...");
        },

        // Search Events
        onGlobalSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("query");
            if (sQuery) {
                // Navigate to AI chat with the query
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteAIChat", {
                    query: encodeURIComponent(sQuery)
                });
            }
        },

        onSearchSuggest: function (oEvent) {
            const sValue = oEvent.getParameter("suggestValue");
            const oSearchField = oEvent.getSource();
            
            // Filter suggestions based on input
            const aSuggestions = [
                "GHG emission reduction progress",
                "Packaging recyclability by region",
                "PET recycled content trends",
                "Collection rate improvements",
                "Carbon footprint analysis",
                "Supplier sustainability scores",
                "Regulatory compliance status",
                "Innovation pipeline updates"
            ];
            
            const aFilteredSuggestions = aSuggestions.filter(suggestion =>
                suggestion.toLowerCase().includes(sValue.toLowerCase())
            );
            
            // Update suggestion items
            oSearchField.destroySuggestionItems();
            aFilteredSuggestions.forEach(suggestion => {
                oSearchField.addSuggestionItem(
                    new sap.ui.core.Item({ text: suggestion })
                );
            });
        },

        // Notification Events
        onNotificationPress: function (oEvent) {
            const oButton = oEvent.getSource();
            const oPopover = this.byId("notificationPopover");
            
            if (!oPopover.isOpen()) {
                oPopover.openBy(oButton);
            } else {
                oPopover.close();
            }
        },

        onNotificationItemPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("app");
            const oNotification = oContext.getObject();
            
            MessageBox.information(
                oNotification.description,
                {
                    title: oNotification.title,
                    details: `Type: ${oNotification.type}\nTime: ${new Date(oNotification.timestamp).toLocaleString()}`
                }
            );
            
            this.byId("notificationPopover").close();
        },

        onViewAllNotifications: function () {
            MessageToast.show("Opening notifications center...");
            this.byId("notificationPopover").close();
        },

        onMarkAllRead: function () {
            MessageToast.show("All notifications marked as read");
            this.byId("notificationPopover").close();
        },

        // User Menu Events
        onUserPress: function (oEvent) {
            const oButton = oEvent.getSource();
            const oPopover = this.byId("userPopover");
            
            if (!oPopover.isOpen()) {
                oPopover.openBy(oButton);
            } else {
                oPopover.close();
            }
        },

        onProfilePress: function () {
            MessageToast.show("Opening user profile...");
            this.byId("userPopover").close();
        },

        onPreferencesPress: function () {
            this.onSettingsPress();
            this.byId("userPopover").close();
        },

        onSwitchRegionPress: function () {
            MessageBox.confirm("Switch to a different region?", {
                actions: ["Europe", "Asia Pacific", "Global", MessageBox.Action.CANCEL],
                onClose: (sAction) => {
                    if (sAction !== MessageBox.Action.CANCEL) {
                        this.oAppModel.setProperty("/userSettings/defaultRegion", sAction);
                        this.oAppModel.setProperty("/currentUser/region", sAction);
                        MessageToast.show(`Switched to ${sAction} region`);
                        this._saveUserSettings();
                    }
                }
            });
            this.byId("userPopover").close();
        },

        onLogoutPress: function () {
            MessageBox.confirm("Are you sure you want to logout?", {
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        MessageToast.show("Logging out...");
                        // Implement logout logic
                    }
                }
            });
            this.byId("userPopover").close();
        },

        // Settings Events
        onSettingsPress: function () {
            const oDialog = this.byId("settingsDialog");
            oDialog.open();
        },

        onSaveSettings: function () {
            const oSettings = {
                theme: this.byId("themeSelect").getSelectedKey(),
                defaultRegion: this.byId("regionSelect").getSelectedKey(),
                refreshInterval: parseInt(this.byId("refreshSelect").getSelectedKey()),
                enableAI: this.oAppModel.getProperty("/userSettings/enableAI"),
                showAdvanced: this.oAppModel.getProperty("/userSettings/showAdvanced"),
                realTimeUpdates: this.oAppModel.getProperty("/userSettings/realTimeUpdates")
            };

            this.oAppModel.setProperty("/userSettings", oSettings);
            this._saveUserSettings();
            
            // Apply theme change
            const sCurrentTheme = sap.ui.getCore().getConfiguration().getTheme();
            if (oSettings.theme !== sCurrentTheme) {
                sap.ui.getCore().applyTheme(oSettings.theme);
            }
            
            MessageToast.show("Settings saved successfully");
            this.byId("settingsDialog").close();
        },

        onCancelSettings: function () {
            this.byId("settingsDialog").close();
        },

        _saveUserSettings: function () {
            const oSettings = this.oAppModel.getProperty("/userSettings");
            localStorage.setItem("ccep-user-settings", JSON.stringify(oSettings));
        },

        // Help and About Events
        onHelpPress: function () {
            MessageBox.information(
                "CCEP Sustainability Analytics Platform\n\nFor help and support:\n• Use the AI Assistant for questions\n• Check the documentation\n• Contact the sustainability team",
                {
                    title: "Help & Support"
                }
            );
        },

        onAboutPress: function () {
            const oAppInfo = this.oAppModel.getProperty("/appInfo");
            MessageBox.information(
                `Version: ${oAppInfo.version}\nBuild Date: ${oAppInfo.buildDate}\nEnvironment: ${oAppInfo.environment}\n\nCCEP Sustainability Analytics Platform\nPowered by SAP CAP, Agentic RAG, and Gen AI`,
                {
                    title: "About"
                }
            );
        },

        // Global Event Handlers
        onShowBusy: function (sChannelId, sEventId, oData) {
            const oBusyDialog = this.byId("globalBusyDialog");
            if (oData && oData.text) {
                oBusyDialog.setText(oData.text);
            }
            if (oData && oData.title) {
                oBusyDialog.setTitle(oData.title);
            }
            oBusyDialog.open();
        },

        onHideBusy: function () {
            this.byId("globalBusyDialog").close();
        },

        onShowError: function (sChannelId, sEventId, oData) {
            const sMessage = oData && oData.message ? oData.message : "An error occurred";
            this.byId("errorText").setText(sMessage);
            this.byId("errorDialog").open();
        },

        onErrorDialogClose: function () {
            this.byId("errorDialog").close();
        },

        onShowSuccess: function (sChannelId, sEventId, oData) {
            const sMessage = oData && oData.message ? oData.message : "Operation completed successfully";
            MessageToast.show(sMessage);
        },

        // Utility Methods
        getEventBus: function () {
            return this.oEventBus;
        },

        showBusy: function (sText, sTitle) {
            this.oEventBus.publish("app", "showBusy", {
                text: sText,
                title: sTitle
            });
        },

        hideBusy: function () {
            this.oEventBus.publish("app", "hideBusy");
        },

        showError: function (sMessage) {
            this.oEventBus.publish("app", "showError", {
                message: sMessage
            });
        },

        showSuccess: function (sMessage) {
            this.oEventBus.publish("app", "showSuccess", {
                message: sMessage
            });
        }
    });
});
