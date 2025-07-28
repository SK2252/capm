require('dotenv').config();

/**
 * CCEP Sustainability Analytics Application Configuration
 * Centralized configuration management for all application components
 */

const config = {
  // Application Settings
  app: {
    name: process.env.APP_NAME || 'ccep-sustainability-capm',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 4004,
    logLevel: process.env.LOG_LEVEL || 'info',
    debugMode: process.env.DEBUG_MODE === 'true'
  },

  // Database Configuration
  database: {
    kind: process.env.DB_KIND || 'sqlite',
    url: process.env.DB_URL || 'db/sustainability.db',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10
    },
    autoDeployOnStart: process.env.AUTO_DEPLOY_DB === 'true',
    seedDataOnStart: process.env.SEED_DATA_ON_START === 'true'
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002'
  },

  // Azure OpenAI Configuration
  azureOpenAI: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
  },

  // Vector Database Configuration
  vectorStore: {
    path: process.env.VECTOR_STORE_PATH || './vector_store',
    dimensions: parseInt(process.env.VECTOR_DIMENSIONS) || 1536,
    similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.8
  },

  // RAG System Configuration
  rag: {
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE) || 1000,
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP) || 200,
    topKResults: parseInt(process.env.RAG_TOP_K_RESULTS) || 5,
    confidenceThreshold: parseFloat(process.env.RAG_CONFIDENCE_THRESHOLD) || 0.7
  },

  // Rate Limiting Configuration
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED_REQUESTS === 'true'
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4004'],
    corsMethods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE'],
    corsAllowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || ['Content-Type', 'Authorization']
  },

  // Logging Configuration
  logging: {
    filePath: process.env.LOG_FILE_PATH || 'logs/',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD'
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600,
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000
  },

  // External APIs Configuration
  externalAPIs: {
    sustainabilityData: process.env.SUSTAINABILITY_DATA_API_URL,
    regulatory: process.env.REGULATORY_API_URL,
    supplyChain: process.env.SUPPLY_CHAIN_API_URL
  },

  // Monitoring Configuration
  monitoring: {
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
    performanceMonitoring: process.env.PERFORMANCE_MONITORING === 'true'
  },

  // AI Model Performance Configuration
  aiPerformance: {
    evaluationInterval: parseInt(process.env.MODEL_EVALUATION_INTERVAL) || 86400000,
    performanceThreshold: parseFloat(process.env.MODEL_PERFORMANCE_THRESHOLD) || 0.85,
    autoRetrainEnabled: process.env.AUTO_RETRAIN_ENABLED === 'true'
  },

  // Data Processing Configuration
  dataProcessing: {
    batchSize: parseInt(process.env.BATCH_SIZE) || 1000,
    parallelProcessing: process.env.PARALLEL_PROCESSING === 'true',
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 10
  },

  // CCEP Sustainability Targets
  sustainabilityTargets: {
    ghgReductionTarget: parseInt(process.env.GHG_REDUCTION_TARGET) || 30,
    recyclablePackagingTarget: parseInt(process.env.RECYCLABLE_PACKAGING_TARGET) || 100,
    recycledContentTarget: parseInt(process.env.RECYCLED_CONTENT_TARGET) || 50,
    collectionRateTargets: {
      europe: parseInt(process.env.COLLECTION_RATE_TARGET_EUROPE) || 85,
      asiaPacific: parseInt(process.env.COLLECTION_RATE_TARGET_API) || 70
    }
  },

  // Regional Data
  regionalData: {
    europe: {
      currentCollectionRate: parseFloat(process.env.EUROPE_CURRENT_COLLECTION_RATE) || 76.7
    },
    asiaPacific: {
      currentCollectionRate: parseFloat(process.env.API_CURRENT_COLLECTION_RATE) || 53
    },
    packagingCarbonFootprintPercentage: parseInt(process.env.PACKAGING_CARBON_FOOTPRINT_PERCENTAGE) || 38
  },

  // AI Agents Configuration
  agents: {
    packaging: {
      enabled: process.env.PACKAGING_AGENT_ENABLED === 'true',
      name: 'PackagingAgent',
      specialization: 'packaging_analysis'
    },
    emission: {
      enabled: process.env.EMISSION_AGENT_ENABLED === 'true',
      name: 'EmissionAgent',
      specialization: 'emission_tracking'
    },
    supplyChain: {
      enabled: process.env.SUPPLY_CHAIN_AGENT_ENABLED === 'true',
      name: 'SupplyChainAgent',
      specialization: 'supply_chain_analysis'
    },
    regulatory: {
      enabled: process.env.REGULATORY_AGENT_ENABLED === 'true',
      name: 'RegulatoryAgent',
      specialization: 'regulatory_compliance'
    }
  },

  // File Upload Configuration
  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'docx', 'xlsx', 'csv', 'txt'],
    uploadPath: process.env.UPLOAD_PATH || 'uploads/'
  },

  // WebSocket Configuration
  websocket: {
    enabled: process.env.WS_ENABLED === 'true',
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000
  },

  // Development Configuration
  development: {
    mockAIResponses: process.env.MOCK_AI_RESPONSES === 'true',
    enableSwagger: process.env.ENABLE_SWAGGER === 'true'
  }
};

// Validation function
const validateConfig = () => {
  const errors = [];

  // Validate required OpenAI configuration
  if (!config.openai.apiKey && !config.azureOpenAI.apiKey) {
    errors.push('Either OPENAI_API_KEY or AZURE_OPENAI_API_KEY must be provided');
  }

  // Validate JWT secret in production
  if (config.app.environment === 'production' && config.security.jwtSecret === 'default-secret-change-in-production') {
    errors.push('JWT_SECRET must be set in production environment');
  }

  // Validate port
  if (isNaN(config.app.port) || config.app.port < 1 || config.app.port > 65535) {
    errors.push('PORT must be a valid port number between 1 and 65535');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

// Export configuration and validation function
module.exports = {
  config,
  validateConfig
};
