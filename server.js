const cds = require('@sap/cds');
const express = require('express');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './config/.env' });

// Create express app
const app = express();

// Serve static files from the webapp directory
app.use('/app', express.static(path.join(__dirname, 'app/sustainability-dashboard/webapp')));

// Serve the main index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/sustainability-dashboard/webapp/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            database: 'connected',
            gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
            ml_service: 'available'
        },
        environment: {
            node_env: process.env.NODE_ENV || 'development',
            gemini_model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
        }
    });
});

// Start CAP server
const PORT = process.env.PORT || 4004;

cds.serve('all').in(app).then(() => {
    console.log('🚀 CCEP Sustainability Analytics Platform Started');
    console.log('📊 Dashboard: http://localhost:' + PORT);
    console.log('🔗 API: http://localhost:' + PORT + '/sustainability');
    console.log('❤️  Health: http://localhost:' + PORT + '/health');
    console.log('🤖 ML Model: ' + (process.env.GEMINI_MODEL || 'gemini-1.5-flash'));
    
    app.listen(PORT, () => {
        console.log('✅ Server running on port ' + PORT);
    });
}).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
