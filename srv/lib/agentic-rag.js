// srv/lib/agentic-rag.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const winston = require('winston');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Import specialized agents
const PackagingAnalysisAgent = require('./agents/packaging-agent');
const EmissionTrackingAgent = require('./agents/emission-agent');
const SupplyChainAgent = require('./agents/supply-chain-agent');
const RegulatoryComplianceAgent = require('./agents/regulatory-agent');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/agentic-rag.log' }),
    new winston.transports.Console()
  ]
});

class AgenticRAGSystem {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
        topK: parseInt(process.env.GEMINI_TOP_K) || 40,
        topP: parseFloat(process.env.GEMINI_TOP_P) || 0.95,
        maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 2048,
      }
    });
    
    this.vectorStore = new Map(); // Simple in-memory vector store
    this.agents = {};
    this.knowledgeBase = new Map();
    this.documentChunks = [];
    
    this.initializeAgents();
  }

  async initialize() {
    try {
      await this.loadKnowledgeBase();
      await this.initializeVectorStore();
      logger.info('Agentic RAG System initialized successfully with Gemini 1.5 Flash');
    } catch (error) {
      logger.error('Failed to initialize Agentic RAG System:', error);
      throw error;
    }
  }

  initializeAgents() {
    this.agents = {
      packaging: new PackagingAnalysisAgent(this),
      emission: new EmissionTrackingAgent(this),
      supplyChain: new SupplyChainAgent(this),
      regulatory: new RegulatoryComplianceAgent(this)
    };
  }

  async loadKnowledgeBase() {
    const knowledgeFiles = [
      'sustainability-guidelines.txt',
      'packaging-standards.txt',
      'emission-factors.txt',
      'regulatory-requirements.txt',
      'ccep-policies.txt'
    ];

    for (const file of knowledgeFiles) {
      try {
        const filePath = path.join(__dirname, '../data/knowledge', file);
        const content = await fs.readFile(filePath, 'utf-8');
        this.knowledgeBase.set(file, content);
      } catch (error) {
        logger.warn(`Knowledge file ${file} not found, using default content`);
        this.knowledgeBase.set(file, this.getDefaultKnowledge(file));
      }
    }
  }

  getDefaultKnowledge(filename) {
    const defaultKnowledge = {
      'sustainability-guidelines.txt': `
        CCEP Sustainability Guidelines:
        - 30% GHG emission reduction by 2030
        - 100% recyclable packaging by 2025
        - 50% recycled content in PET bottles by 2025
        - Packaging accounts for 38% of carbon footprint
        - Focus on circular economy principles
        - Europe collection rate: 76.7%, Asia Pacific: 53%
      `,
      'packaging-standards.txt': `
        Packaging Standards:
        - PET bottles: Target 50% recycled content
        - Aluminum cans: 100% recyclable
        - Glass bottles: 100% recyclable
        - Collection rates: Europe 76.7%, Asia Pacific 53%
        - FSC certification required for paper-based packaging
        - Lightweighting targets: 15% reduction by 2025
      `,
      'emission-factors.txt': `
        Emission Factors (kg CO2e):
        - PET: 0.085 per bottle
        - Aluminum: 0.156 per can
        - Glass: 0.234 per bottle
        - Transportation: 0.12 per km
        - Manufacturing: varies by facility
        - Recycled PET: 0.045 per bottle (47% reduction)
      `,
      'regulatory-requirements.txt': `
        Key Regulations:
        - EU Single-Use Plastics Directive
        - Extended Producer Responsibility
        - Packaging and Packaging Waste Directive
        - Asia Pacific recycling mandates
        - Carbon reporting requirements
        - TCFD climate disclosures
      `,
      'ccep-policies.txt': `
        CCEP Policies:
        - Sustainable packaging strategy
        - Climate action commitments
        - Supplier sustainability requirements
        - Innovation in packaging materials
        - Stakeholder engagement principles
        - Science-based targets alignment
      `
    };
    return defaultKnowledge[filename] || '';
  }

  async initializeVectorStore() {
    const chunkSize = parseInt(process.env.RAG_CHUNK_SIZE) || 1000;
    const chunkOverlap = parseInt(process.env.RAG_CHUNK_OVERLAP) || 200;

    this.documentChunks = [];
    for (const [filename, content] of this.knowledgeBase) {
      const chunks = this.splitText(content, chunkSize, chunkOverlap);
      chunks.forEach((chunk, index) => {
        const chunkId = crypto.createHash('md5').update(`${filename}-${index}-${chunk}`).digest('hex');
        const embedding = this.createSimpleEmbedding(chunk);
        
        this.documentChunks.push({
          id: chunkId,
          content: chunk,
          embedding: embedding,
          metadata: { source: filename, chunk: index }
        });
        
        this.vectorStore.set(chunkId, {
          content: chunk,
          embedding: embedding,
          metadata: { source: filename, chunk: index }
        });
      });
    }

    logger.info(`Vector store initialized with ${this.documentChunks.length} document chunks`);
  }

  splitText(text, chunkSize, chunkOverlap) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        // Add overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(chunkOverlap / 10));
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  createSimpleEmbedding(text) {
    // Simple text embedding using character frequency and word patterns
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const wordFreq = {};
    
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Create a simple vector based on common sustainability terms
    const sustainabilityTerms = [
      'packaging', 'emission', 'carbon', 'recycl', 'sustain', 'environment',
      'plastic', 'bottle', 'aluminum', 'glass', 'transport', 'energy',
      'target', 'goal', 'reduction', 'footprint', 'circular', 'regulation'
    ];
    
    const embedding = sustainabilityTerms.map(term => {
      return words.filter(word => word.includes(term)).length;
    });
    
    return embedding;
  }

  async queryKnowledge(query, agentType = 'general', topK = 5) {
    try {
      if (this.vectorStore.size === 0) {
        await this.initializeVectorStore();
      }

      const queryEmbedding = this.createSimpleEmbedding(query);
      const similarities = [];

      // Calculate similarities with stored chunks
      for (const [id, doc] of this.vectorStore) {
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        similarities.push({
          id,
          similarity,
          content: doc.content,
          metadata: doc.metadata
        });
      }

      // Sort by similarity and get top K results
      const results = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      const context = results.map(doc => doc.content).join('\n\n');
      
      logger.info(`Knowledge query processed: ${query.substring(0, 50)}...`);
      return {
        context,
        sources: results.map(doc => doc.metadata),
        confidence: this.calculateConfidence(results)
      };
    } catch (error) {
      logger.error('Error querying knowledge base:', error);
      throw error;
    }
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  calculateConfidence(results) {
    if (results.length === 0) return 0;
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    return Math.min(0.95, Math.max(0.1, avgSimilarity));
  }

  async processQuery(query, agentType = 'general') {
    try {
      const agent = this.agents[agentType];
      if (!agent) {
        throw new Error(`Unknown agent type: ${agentType}`);
      }

      const knowledge = await this.queryKnowledge(query, agentType);
      const response = await agent.processQuery(query, knowledge);
      
      return {
        response: response.answer,
        confidence: response.confidence,
        sources: knowledge.sources,
        agentType,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error processing query:', error);
      throw error;
    }
  }

  async generateInsights(data, analysisType = 'general') {
    try {
      const agent = this.getAgentForAnalysis(analysisType);
      return await agent.generateInsights(data);
    } catch (error) {
      logger.error('Error generating insights:', error);
      throw error;
    }
  }

  getAgentForAnalysis(analysisType) {
    const agentMap = {
      packaging: this.agents.packaging,
      emissions: this.agents.emission,
      supply_chain: this.agents.supplyChain,
      regulatory: this.agents.regulatory
    };
    return agentMap[analysisType] || this.agents.packaging;
  }
}

module.exports = {
  AgenticRAGSystem
};
