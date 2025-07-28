# CCEP Sustainability Analytics API Documentation

## Overview

The CCEP Sustainability Analytics API provides comprehensive access to sustainability data, AI-powered insights, and reporting capabilities. Built on SAP Cloud Application Programming Model (CAP) with integrated Agentic RAG and Gen AI capabilities.

**Base URL:** `http://localhost:4004/sustainability`

**API Version:** 1.0.0

## Authentication

Currently using basic authentication. In production, implement OAuth 2.0 or SAP BTP authentication.

```http
Authorization: Basic <base64-encoded-credentials>
```

## OData Service Endpoints

### Metadata
Get service metadata and entity definitions.

```http
GET /sustainability/$metadata
```

**Response:** XML metadata document

### Entities

#### PackagingMetrics
Retrieve packaging sustainability metrics.

```http
GET /sustainability/PackagingMetrics
```

**Query Parameters:**
- `$filter`: Filter results (e.g., `region eq 'Europe'`)
- `$orderby`: Sort results (e.g., `recyclableContent desc`)
- `$top`: Limit results (e.g., `$top=10`)
- `$skip`: Skip results for pagination
- `$select`: Select specific fields

**Response:**
```json
{
  "value": [
    {
      "ID": "uuid",
      "material": "PET",
      "recyclableContent": 95.5,
      "collectionRate": 76.7,
      "carbonFootprint": 0.085,
      "region": "Europe",
      "timestamp": "2024-10-15T10:30:00Z"
    }
  ]
}
```

#### EmissionData
Retrieve GHG emission data.

```http
GET /sustainability/EmissionData
```

**Response:**
```json
{
  "value": [
    {
      "ID": "uuid",
      "source": "Packaging",
      "value": 815.2,
      "unit": "tonnes CO2e",
      "period": "2024-Q3",
      "target": 700.0
    }
  ]
}
```

#### SustainabilityInsights
Retrieve AI-generated insights.

```http
GET /sustainability/SustainabilityInsights
```

**Response:**
```json
{
  "value": [
    {
      "ID": "uuid",
      "query": "What is our GHG reduction progress?",
      "insight": "CCEP has achieved 16.9% GHG emission reduction...",
      "confidence": 0.92,
      "generatedAt": "2024-10-15T10:30:00Z"
    }
  ]
}
```

## Function Import Endpoints

### Packaging Analysis

#### analyzePackaging
Analyze packaging material sustainability.

```http
POST /sustainability/analyzePackaging
Content-Type: application/json

{
  "material": "PET"
}
```

**Response:**
```json
{
  "analysis": {
    "recyclability": 95.5,
    "carbonFootprint": 0.085,
    "sustainability_score": 8.7
  },
  "recommendations": [
    "Increase recycled content to 60%",
    "Optimize bottle weight reduction"
  ],
  "confidence": 0.89
}
```

### Emission Prediction

#### predictEmissions
Predict future emission trends.

```http
POST /sustainability/predictEmissions
Content-Type: application/json

{
  "scenario": "current_trajectory",
  "timeHorizon": "2030",
  "region": "Global"
}
```

**Response:**
```json
{
  "prediction": {
    "2025": 750.2,
    "2030": 700.0
  },
  "confidence": 0.84,
  "methodology": "AI-powered trend analysis",
  "assumptions": [
    "Current investment levels maintained",
    "No major regulatory changes"
  ]
}
```

### Report Generation

#### generateReport
Generate comprehensive sustainability reports.

```http
POST /sustainability/generateReport
Content-Type: application/json

{
  "period": "Q3-2024",
  "region": "Global",
  "reportType": "comprehensive",
  "includeAI": true
}
```

**Response:**
```json
{
  "report": {
    "executive_summary": "Q3 2024 showed strong progress...",
    "kpi_performance": {...},
    "regional_analysis": {...},
    "ai_insights": {...}
  },
  "generatedAt": "2024-10-15T10:30:00Z",
  "metadata": {
    "pages": 25,
    "format": "json",
    "version": "1.0"
  }
}
```

### AI Chat Interface

#### processChatQuery
Process natural language queries using Agentic RAG.

```http
POST /sustainability/processChatQuery
Content-Type: application/json

{
  "query": "How can we improve our packaging sustainability?",
  "sessionId": "session-123",
  "userId": "user-456",
  "context": "{\"source\": \"dashboard\"}"
}
```

**Response:**
```json
{
  "response": "To improve packaging sustainability, focus on three key areas...",
  "confidence": 0.91,
  "agentUsed": "PackagingAgent",
  "sources": [
    {
      "content": "CCEP packaging guidelines...",
      "metadata": {"type": "guideline"}
    }
  ],
  "followUpQuestions": [
    "What are the cost implications?",
    "Which regions should we prioritize?"
  ]
}
```

#### queryInsights
Get AI-powered insights on specific topics.

```http
POST /sustainability/queryInsights
Content-Type: application/json

{
  "question": "What are the key sustainability risks?",
  "context": "risk_assessment",
  "agentType": "regulatory"
}
```

**Response:**
```json
{
  "answer": "Key sustainability risks include regulatory compliance gaps...",
  "confidence": 0.87,
  "insights": [
    {
      "type": "risk",
      "description": "Asia Pacific collection rate shortfall",
      "priority": "high"
    }
  ],
  "recommendations": [
    "Accelerate infrastructure investment",
    "Strengthen regulatory monitoring"
  ]
}
```

### Dashboard Data

#### getDashboardData
Retrieve dashboard KPI data.

```http
POST /sustainability/getDashboardData
Content-Type: application/json

{
  "region": "Global",
  "period": "current",
  "kpis": "[\"ghgReduction\", \"recyclablePackaging\", \"recycledContent\"]"
}
```

**Response:**
```json
{
  "overview": {
    "ghgReduction": {
      "current": 16.9,
      "target": 30.0,
      "progress": 56.3,
      "trend": "improving"
    },
    "recyclablePackaging": {
      "current": 87.3,
      "target": 100.0,
      "progress": 87.3,
      "trend": "improving"
    }
  },
  "lastUpdated": "2024-10-15T10:30:00Z"
}
```

#### getRecommendations
Get AI-generated recommendations.

```http
POST /sustainability/getRecommendations
Content-Type: application/json

{
  "target": "emission_reduction",
  "region": "Asia Pacific",
  "priority": "high"
}
```

**Response:**
```json
[
  "Accelerate renewable energy adoption in manufacturing facilities",
  "Implement energy efficiency measures in high-consumption operations",
  "Optimize transportation routes and modal shift to rail transport",
  "Increase supplier engagement on emission reduction targets"
]
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "The material parameter is required",
    "details": "Material must be one of: PET, Aluminum, Glass, Cardboard",
    "timestamp": "2024-10-15T10:30:00Z"
  }
}
```

### Error Codes

- `INVALID_PARAMETER`: Invalid or missing parameter
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error
- `AI_SERVICE_ERROR`: AI service unavailable
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limiting

API requests are limited to:
- 100 requests per minute per user
- 1000 requests per hour per user
- AI-powered endpoints: 20 requests per minute

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

## Data Formats

### Date/Time
All timestamps use ISO 8601 format: `2024-10-15T10:30:00Z`

### Numbers
- Percentages: 0-100 (e.g., 87.3 for 87.3%)
- Emissions: tonnes CO2e or kg CO2e
- Confidence: 0-1 (e.g., 0.89 for 89%)

### Regions
- `Europe`
- `Asia Pacific`
- `Global`

### Materials
- `PET`
- `Aluminum`
- `Glass`
- `Cardboard`
- `HDPE`
- `Steel`

## Pagination

Large result sets are paginated using OData standards:

```http
GET /sustainability/PackagingMetrics?$top=20&$skip=40
```

Response includes pagination metadata:
```json
{
  "value": [...],
  "@odata.count": 150,
  "@odata.nextLink": "/sustainability/PackagingMetrics?$top=20&$skip=60"
}
```

## Filtering and Sorting

### Filtering Examples
```http
# Filter by region
GET /sustainability/PackagingMetrics?$filter=region eq 'Europe'

# Filter by date range
GET /sustainability/EmissionData?$filter=timestamp ge 2024-01-01T00:00:00Z

# Complex filter
GET /sustainability/PackagingMetrics?$filter=region eq 'Europe' and recyclableContent gt 80
```

### Sorting Examples
```http
# Sort by recyclable content descending
GET /sustainability/PackagingMetrics?$orderby=recyclableContent desc

# Multiple sort criteria
GET /sustainability/EmissionData?$orderby=region asc,timestamp desc
```

## WebSocket Support

Real-time updates available via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:4004/ws/sustainability');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:4004/sustainability',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('user:pass').toString('base64')
  }
});

// Get packaging metrics
const metrics = await client.get('/PackagingMetrics?$top=10');

// Analyze packaging
const analysis = await client.post('/analyzePackaging', {
  material: 'PET'
});
```

### Python
```python
import requests

base_url = 'http://localhost:4004/sustainability'
auth = ('user', 'pass')

# Get emission data
response = requests.get(f'{base_url}/EmissionData', auth=auth)
data = response.json()

# Process chat query
chat_response = requests.post(f'{base_url}/processChatQuery', 
  json={'query': 'What is our sustainability progress?'},
  auth=auth
)
```

## Support

For API support and questions:
- Documentation: `/docs`
- Health Check: `/health`
- API Status: `/status`
- Contact: sustainability-team@ccep.com
