const winston = require('winston');
const path = require('path');
require('dotenv').config();

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = process.env.LOG_FILE_PATH || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for log messages
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let msg = `${timestamp} [${level}]`;
    if (service) msg += ` [${service}]`;
    msg += `: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    
    return msg;
  })
);

// Create different loggers for different services
const createLogger = (service) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: { service },
    transports: [
      // Error log file
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
        tailable: true
      }),
      
      // Combined log file
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
        tailable: true
      }),
      
      // Service-specific log file
      new winston.transports.File({
        filename: path.join(logDir, `${service}.log`),
        maxsize: process.env.LOG_MAX_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
        tailable: true
      })
    ],
    
    // Handle exceptions and rejections
    exceptionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'exceptions.log')
      })
    ],
    
    rejectionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'rejections.log')
      })
    ]
  });
};

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  const addConsoleTransport = (logger) => {
    logger.add(new winston.transports.Console({
      format: consoleFormat
    }));
  };
  
  // Export function to add console transport
  module.exports.addConsoleTransport = addConsoleTransport;
}

// Create specific loggers
const loggers = {
  main: createLogger('main'),
  sustainability: createLogger('sustainability-service'),
  ragSystem: createLogger('agentic-rag'),
  genAI: createLogger('gen-ai-service'),
  dataProcessor: createLogger('data-processor'),
  frontend: createLogger('frontend'),
  database: createLogger('database'),
  security: createLogger('security'),
  performance: createLogger('performance')
};

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  Object.values(loggers).forEach(logger => {
    logger.add(new winston.transports.Console({
      format: consoleFormat
    }));
  });
}

// Performance monitoring logger
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'performance.log'),
      maxsize: '50m',
      maxFiles: 10,
      tailable: true
    })
  ]
});

// Audit logger for compliance
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'audit.log'),
      maxsize: '100m',
      maxFiles: 20,
      tailable: true
    })
  ]
});

// Security logger
const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      maxsize: '50m',
      maxFiles: 15,
      tailable: true
    })
  ]
});

// Helper functions for structured logging
const logPerformance = (operation, duration, metadata = {}) => {
  performanceLogger.info('Performance metric', {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

const logAudit = (action, user, resource, result, metadata = {}) => {
  auditLogger.info('Audit event', {
    action,
    user,
    resource,
    result,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

const logSecurity = (event, severity, details, metadata = {}) => {
  securityLogger.log(severity, 'Security event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Export loggers and helper functions
module.exports = {
  ...loggers,
  createLogger,
  performanceLogger,
  auditLogger,
  securityLogger,
  logPerformance,
  logAudit,
  logSecurity
};
