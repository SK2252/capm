# CCEP Sustainability Analytics Platform

A comprehensive sustainability analytics platform built with SAP Cloud Application Programming Model (CAP), featuring Agentic RAG and Gen AI integration for Coca-Cola EuroPacific Partners (CCEP).

## 🌍 Project Overview

This platform helps CCEP achieve their sustainability goals:
- **30% GHG emission reduction**
- **100% recyclable packaging by 2025**
- **50% recycled content in PET bottles**
- Improve collection rates: Europe (76.7% → 85%), Asia Pacific (53% → 70%)

## 🏗️ Architecture

### Core Technologies
- **SAP CAP Model**: Cloud Application Programming framework
- **Agentic RAG**: Multi-agent Retrieval-Augmented Generation system
- **Gen AI**: OpenAI/Azure OpenAI integration
- **SAP UI5**: Responsive frontend dashboard
- **SQLite**: Development database
- **Node.js**: Backend runtime

### Key Features
- 🤖 **AI-Powered Analytics**: Natural language queries and insights
- 📊 **Real-time Dashboards**: Interactive sustainability metrics
- 🔍 **Multi-Agent RAG**: Specialized agents for different domains
- 📈 **Predictive Analytics**: Emission forecasting and scenario planning
- 📋 **Automated Reporting**: AI-generated sustainability reports
- 🌐 **Regional Analysis**: Europe and Asia Pacific data comparison

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- Google Gemini API key
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SK2252/capm.git
   cd ccep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp config/.env config/.env.local
   # Edit config/.env with your API keys and settings
   ```

   **Required Environment Variables:**
   ```bash
   # OpenAI Configuration (Required)
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4-turbo-preview

   # Or Azure OpenAI (Alternative)
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your_azure_openai_key_here

   # Application Settings
   NODE_ENV=development
   PORT=4004
   LOG_LEVEL=info
   ```

4. **Setup database and seed data**
   ```bash
   npm run setup
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   - Dashboard: http://localhost:4004
   - API Explorer: http://localhost:4004/sustainability/$metadata
   - Health Check: http://localhost:4004/health
   - AI Chat: http://localhost:4004/index.html#/chat

### Development Mode

For development with hot reload:
```bash
npm run dev
```

### Production Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm run start:prod
   ```

## 📁 Project Structure

```
ccep/
├── srv/                    # CAP services
│   ├── sustainability-service.cds    # Service definitions
│   ├── sustainability-service.js     # Service implementation
│   └── lib/                          # Service libraries
│       ├── agentic-rag.js           # Multi-agent RAG system
│       ├── gen-ai-service.js        # Gen AI integration
│       └── data-processor.js        # Data processing utilities
├── db/                     # Database models & data
│   ├── data-model.cds              # Entity definitions
│   └── csv/                        # Sample data files
├── app/                    # UI5 frontend
│   └── sustainability-dashboard/    # Main dashboard app
├── config/                 # Configuration files
│   ├── .env                        # Environment variables
│   ├── app-config.js              # Application configuration
│   └── logger.js                  # Logging configuration
├── logs/                   # Application logs
├── package.json           # Dependencies and scripts
├── mta.yaml              # Multi-target application descriptor
└── README.md             # This file
```

## 🤖 Agentic RAG System

The platform features a sophisticated multi-agent RAG system with specialized agents:

### Agent Types
1. **Packaging Agent**: Analyzes packaging materials, recyclability, and optimization
2. **Emission Agent**: Tracks GHG emissions, calculates reductions, and forecasts
3. **Supply Chain Agent**: Evaluates supplier sustainability and risk assessment
4. **Regulatory Agent**: Monitors compliance with environmental regulations

### RAG Capabilities
- **Semantic Search**: Vector-based document retrieval
- **Context-Aware Responses**: Maintains conversation context
- **Multi-Source Integration**: Combines internal and external data
- **Confidence Scoring**: Provides reliability metrics for insights

## 🧠 Gen AI Integration

### Google Gemini Integration
- **Gemini 1.5 Pro**: Advanced reasoning and multimodal analysis
- **High Context Window**: Process large sustainability documents
- **Custom Prompts**: CCEP-specific sustainability context
- **Safety Features**: Built-in content filtering and safety controls

### AI-Powered Features
- **Natural Language Queries**: Ask questions in plain English
- **Automated Report Generation**: Create comprehensive sustainability reports
- **Predictive Analytics**: Forecast emission trends and scenarios
- **Recommendation Engine**: Suggest optimization strategies

## 📊 Dashboard Features

### Key Performance Indicators (KPIs)
- GHG Emission Reduction Progress
- Recyclable Packaging Percentage
- Recycled Content in PET Bottles
- Regional Collection Rates
- Carbon Footprint by Source

### Interactive Components
- **AI Chat Interface**: Natural language interaction
- **Real-time Charts**: Dynamic data visualization
- **Regional Comparison**: Europe vs Asia Pacific metrics
- **Trend Analysis**: Historical and predictive trends
- **Alert System**: Automated notifications for targets

## 🔧 Configuration

### Environment Variables
Key configuration options in `config/.env`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview

# Azure OpenAI (Alternative)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_key_here

# RAG Configuration
RAG_CHUNK_SIZE=1000
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.7

# CCEP Sustainability Targets
GHG_REDUCTION_TARGET=30
RECYCLABLE_PACKAGING_TARGET=100
RECYCLED_CONTENT_TARGET=50
```

## 🧪 Testing

### Run Tests
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # Test coverage report
npm run test:watch         # Watch mode for development
```

### Test Categories
- **Unit Tests**: Individual component testing
  - Service layer functionality
  - Agentic RAG system components
  - Gen AI service integration
  - Data processing utilities
- **Integration Tests**: End-to-end API testing
  - OData service endpoints
  - Function import operations
  - AI chat interface
  - Dashboard data integration
- **Performance Tests**: Load and response time testing
- **Security Tests**: Input validation and injection prevention

### Test Data
Tests use mock data and in-memory database. Real API keys not required for testing.

### Coverage Reports
Test coverage reports are generated in `coverage/` directory:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Writing Tests
Follow the existing test patterns:
- Use Mocha and Chai for assertions
- Mock external services (OpenAI, etc.)
- Test both success and error scenarios
- Include performance benchmarks for critical paths

Example test structure:
```javascript
describe('Sustainability Service', () => {
  describe('Function Imports', () => {
    it('should analyze packaging materials', async () => {
      const result = await service.analyzePackaging({ material: 'PET' });
      expect(result).to.have.property('analysis');
      expect(result.confidence).to.be.above(0.7);
    });
  });
});
```

## 📈 Monitoring & Analytics

### Performance Monitoring
- **Response Times**: API and AI service latency
- **Throughput**: Requests per minute
- **Error Rates**: System reliability metrics
- **Resource Usage**: Memory and CPU utilization

### Audit Logging
- **User Actions**: All user interactions logged
- **AI Queries**: RAG and Gen AI request tracking
- **Data Changes**: Sustainability data modifications
- **Security Events**: Authentication and authorization

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens**: Secure API access
- **Role-based Access**: User permission management
- **API Rate Limiting**: Prevent abuse and ensure availability

### Data Protection
- **Input Validation**: Prevent injection attacks
- **CORS Configuration**: Cross-origin request security
- **Audit Trails**: Complete action logging

## 🚀 Deployment

### Development
```bash
npm run dev                # Development with hot reload
npm run watch             # Watch mode with auto-restart
```

### Production
```bash
npm run build             # Build for production
npm run start:prod        # Start production server
```

### Cloud Deployment
- **SAP BTP**: Business Technology Platform deployment
- **Docker**: Containerized deployment
- **Kubernetes**: Orchestrated scaling

## 📚 API Documentation

### Service Endpoints
- **GET /sustainability/PackagingMetrics**: Retrieve packaging data
- **GET /sustainability/EmissionData**: Get emission information
- **POST /sustainability/queryInsights**: AI-powered insights
- **POST /sustainability/generateReport**: Create sustainability reports

### Function Imports
- **analyzePackaging()**: Packaging performance analysis
- **predictEmissions()**: Emission forecasting
- **processChatQuery()**: AI chat interface
- **getDashboardData()**: Dashboard metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the CCEP Sustainability Team
- Check the [Wiki](wiki) for detailed documentation

## 🙏 Acknowledgments

- SAP CAP Framework team
- OpenAI for Gen AI capabilities
- CCEP Sustainability team for requirements and data
- Open source community for various libraries and tools
