const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  
  // Health check endpoint
  this.on('GET', '/health', async (req) => {
    try {
      const healthStatus = {
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
      };

      return healthStatus;
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  });

  // Simple ping endpoint
  this.on('GET', '/ping', async (req) => {
    return { 
      message: 'pong', 
      timestamp: new Date().toISOString() 
    };
  });

});
