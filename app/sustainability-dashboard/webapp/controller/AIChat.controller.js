sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/format/DateFormat"
], function (Controller, JSONModel, MessageToast, MessageBox, DateFormat) {
    "use strict";

    return Controller.extend("ccep.sustainability.dashboard.controller.AIChat", {

        onInit: function () {
            this._initializeModels();
            this._setupWebSocket();
            this._loadChatHistory();
        },

        _initializeModels: function () {
            this.oChatModel = new JSONModel({
                messages: [],
                currentMessage: "",
                isTyping: false,
                sessionId: this._generateSessionId(),
                suggestedQuestions: [
                    "What is our current GHG emission reduction progress?",
                    "How can we improve collection rates in Asia Pacific?",
                    "What are the best packaging materials for sustainability?",
                    "Show me the latest regulatory compliance status",
                    "Generate a sustainability report for Q4 2024"
                ],
                quickActions: [
                    { text: "Packaging Analysis", icon: "sap-icon://product", action: "packaging" },
                    { text: "Emission Forecast", icon: "sap-icon://trend-up", action: "emissions" },
                    { text: "Supply Chain Risk", icon: "sap-icon://chain-link", action: "supply_chain" },
                    { text: "Regulatory Update", icon: "sap-icon://document-text", action: "regulatory" }
                ],
                chatSettings: {
                    autoScroll: true,
                    showTimestamps: true,
                    enableVoice: false,
                    theme: "light"
                }
            });

            this.getView().setModel(this.oChatModel, "chat");
            
            // Add welcome message
            this._addMessage("ai", "Hello! I'm your CCEP Sustainability AI Assistant. I can help you with sustainability data analysis, generate reports, and provide insights. What would you like to know?", 0.95);
        },

        _generateSessionId: function () {
            return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        _setupWebSocket: function () {
            // Setup WebSocket for real-time AI responses (if available)
            if (window.WebSocket) {
                try {
                    this._ws = new WebSocket(`ws://${window.location.host}/ws/chat`);
                    
                    this._ws.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        if (data.type === 'ai_response') {
                            this._addMessage("ai", data.message, data.confidence);
                            this.oChatModel.setProperty("/isTyping", false);
                        }
                    };
                    
                    this._ws.onerror = () => {
                        console.log("WebSocket connection failed, using HTTP fallback");
                    };
                } catch (error) {
                    console.log("WebSocket not available, using HTTP requests");
                }
            }
        },

        _loadChatHistory: function () {
            // Load previous chat history if available
            const sessionId = this.oChatModel.getProperty("/sessionId");
            const oModel = this.getView().getModel();
            
            // This would typically load from a service
            // For now, we'll start with a clean session
        },

        onSendMessage: function () {
            const sMessage = this.oChatModel.getProperty("/currentMessage");
            if (!sMessage.trim()) {
                return;
            }

            // Add user message
            this._addMessage("user", sMessage);
            this.oChatModel.setProperty("/currentMessage", "");
            this.oChatModel.setProperty("/isTyping", true);

            // Process AI response
            this._processAIQuery(sMessage);
        },

        onSuggestedQuestionPress: function (oEvent) {
            const sQuestion = oEvent.getSource().getText();
            this.oChatModel.setProperty("/currentMessage", sQuestion);
            this.onSendMessage();
        },

        onQuickActionPress: function (oEvent) {
            const sAction = oEvent.getSource().data("action");
            let sMessage = "";

            switch (sAction) {
                case "packaging":
                    sMessage = "Analyze our current packaging performance and provide optimization recommendations";
                    break;
                case "emissions":
                    sMessage = "Forecast our emission reduction trajectory for the next 5 years";
                    break;
                case "supply_chain":
                    sMessage = "Assess supply chain sustainability risks and mitigation strategies";
                    break;
                case "regulatory":
                    sMessage = "What are the latest regulatory compliance requirements we need to address?";
                    break;
            }

            this.oChatModel.setProperty("/currentMessage", sMessage);
            this.onSendMessage();
        },

        onMessageInputLiveChange: function (oEvent) {
            const sValue = oEvent.getParameter("value");
            this.oChatModel.setProperty("/currentMessage", sValue);
        },

        onMessageInputSubmit: function () {
            this.onSendMessage();
        },

        onClearChat: function () {
            MessageBox.confirm("Are you sure you want to clear the chat history?", {
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        this.oChatModel.setProperty("/messages", []);
                        this._addMessage("ai", "Chat cleared. How can I help you today?", 0.95);
                    }
                }
            });
        },

        onExportChat: function () {
            const aMessages = this.oChatModel.getProperty("/messages");
            const sContent = this._formatChatForExport(aMessages);
            
            // Create and download file
            const blob = new Blob([sContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CCEP_AI_Chat_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            MessageToast.show("Chat exported successfully");
        },

        onVoiceToggle: function (oEvent) {
            const bEnabled = oEvent.getParameter("pressed");
            this.oChatModel.setProperty("/chatSettings/enableVoice", bEnabled);
            
            if (bEnabled) {
                this._initializeVoiceRecognition();
            } else {
                this._stopVoiceRecognition();
            }
        },

        _addMessage: function (sender, text, confidence = null) {
            const aMessages = this.oChatModel.getProperty("/messages");
            const oDateFormat = DateFormat.getTimeInstance({ pattern: "HH:mm:ss" });
            
            const oMessage = {
                id: Date.now(),
                sender: sender,
                text: text,
                timestamp: new Date(),
                formattedTime: oDateFormat.format(new Date()),
                confidence: confidence,
                isUser: sender === "user"
            };

            aMessages.push(oMessage);
            this.oChatModel.setProperty("/messages", aMessages);
            
            // Auto-scroll to bottom
            setTimeout(() => {
                this._scrollToBottom();
            }, 100);
        },

        _processAIQuery: function (sQuery) {
            const oModel = this.getView().getModel();
            const sessionId = this.oChatModel.getProperty("/sessionId");

            // Use WebSocket if available, otherwise HTTP
            if (this._ws && this._ws.readyState === WebSocket.OPEN) {
                this._ws.send(JSON.stringify({
                    type: 'user_query',
                    query: sQuery,
                    sessionId: sessionId
                }));
            } else {
                // HTTP fallback
                oModel.callFunction("/processChatQuery", {
                    urlParameters: {
                        query: sQuery,
                        sessionId: sessionId,
                        userId: "current_user",
                        context: JSON.stringify({
                            source: "dashboard_chat",
                            timestamp: new Date().toISOString()
                        })
                    },
                    success: (data) => {
                        this._addMessage("ai", data.response, data.confidence);
                        this.oChatModel.setProperty("/isTyping", false);
                        
                        // Add suggested follow-up questions if available
                        if (data.followUpQuestions && data.followUpQuestions.length > 0) {
                            this.oChatModel.setProperty("/suggestedQuestions", data.followUpQuestions);
                        }
                    },
                    error: (error) => {
                        this.oChatModel.setProperty("/isTyping", false);
                        this._addMessage("ai", "I apologize, but I'm experiencing technical difficulties. Please try again later.", 0.1);
                        MessageBox.error("Failed to process AI query: " + error.message);
                    }
                });
            }
        },

        _scrollToBottom: function () {
            const oChatContainer = this.byId("chatContainer");
            if (oChatContainer) {
                const oScrollDelegate = oChatContainer.getScrollDelegate();
                if (oScrollDelegate) {
                    oScrollDelegate.scrollTo(0, oScrollDelegate.getMaxScrollTop());
                }
            }
        },

        _formatChatForExport: function (aMessages) {
            let sContent = "CCEP Sustainability AI Chat Export\n";
            sContent += "Generated: " + new Date().toISOString() + "\n";
            sContent += "Session ID: " + this.oChatModel.getProperty("/sessionId") + "\n";
            sContent += "=" + "=".repeat(50) + "\n\n";

            aMessages.forEach((oMessage) => {
                const sTimestamp = oMessage.timestamp.toISOString();
                const sSender = oMessage.sender === "user" ? "User" : "AI Assistant";
                const sConfidence = oMessage.confidence ? ` (Confidence: ${(oMessage.confidence * 100).toFixed(1)}%)` : "";
                
                sContent += `[${sTimestamp}] ${sSender}${sConfidence}:\n`;
                sContent += `${oMessage.text}\n\n`;
            });

            return sContent;
        },

        _initializeVoiceRecognition: function () {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this._recognition = new SpeechRecognition();
                
                this._recognition.continuous = false;
                this._recognition.interimResults = false;
                this._recognition.lang = 'en-US';
                
                this._recognition.onresult = (event) => {
                    const sTranscript = event.results[0][0].transcript;
                    this.oChatModel.setProperty("/currentMessage", sTranscript);
                };
                
                this._recognition.onerror = (event) => {
                    MessageToast.show("Voice recognition error: " + event.error);
                };
                
                MessageToast.show("Voice recognition enabled");
            } else {
                MessageToast.show("Voice recognition not supported in this browser");
                this.oChatModel.setProperty("/chatSettings/enableVoice", false);
            }
        },

        _stopVoiceRecognition: function () {
            if (this._recognition) {
                this._recognition.stop();
                this._recognition = null;
            }
        },

        onStartVoiceInput: function () {
            if (this._recognition) {
                this._recognition.start();
                MessageToast.show("Listening... Speak now");
            }
        },

        // Formatters
        formatMessageTime: function (timestamp) {
            if (!timestamp) return "";
            const oDateFormat = DateFormat.getTimeInstance({ pattern: "HH:mm" });
            return oDateFormat.format(new Date(timestamp));
        },

        formatConfidence: function (confidence) {
            if (!confidence) return "";
            return `${(confidence * 100).toFixed(0)}%`;
        },

        formatMessageClass: function (isUser) {
            return isUser ? "userMessage" : "aiMessage";
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        onNavBack: function () {
            this.getRouter().navTo("RouteDashboard");
        },

        onExit: function () {
            if (this._ws) {
                this._ws.close();
            }
            if (this._recognition) {
                this._recognition.stop();
            }
        }
    });
});
