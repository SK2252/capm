const express = require('express');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './config/.env' });

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS and proper headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
});

// Serve static files from the webapp directory
app.use(express.static(path.join(__dirname, 'app/sustainability-dashboard/webapp')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        gemini_model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });
});

// Serve the main index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/sustainability-dashboard/webapp/index.html'));
});

// Mock API endpoints for testing
app.get('/sustainability/$metadata', (req, res) => {
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0">
    <edmx:DataServices>
        <Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="SustainabilityService">
            <EntityContainer Name="EntityContainer">
                <EntitySet Name="PackagingMetrics" EntityType="SustainabilityService.PackagingMetrics"/>
            </EntityContainer>
            <EntityType Name="PackagingMetrics">
                <Key>
                    <PropertyRef Name="ID"/>
                </Key>
                <Property Name="ID" Type="Edm.Guid" Nullable="false"/>
                <Property Name="material" Type="Edm.String"/>
                <Property Name="region" Type="Edm.String"/>
                <Property Name="recyclableContent" Type="Edm.Decimal"/>
            </EntityType>
        </Schema>
    </edmx:DataServices>
</edmx:Edmx>`);
});

// Mock data endpoint
app.get('/sustainability/PackagingMetrics', (req, res) => {
    res.json({
        value: [
            {
                ID: "1",
                material: "PET",
                region: "Europe",
                recyclableContent: 85.5
            },
            {
                ID: "2", 
                material: "Aluminum",
                region: "Asia Pacific",
                recyclableContent: 95.2
            }
        ]
    });
});

app.listen(PORT, () => {
    console.log('🚀 CCEP Sustainability Analytics Platform Started');
    console.log('📊 Dashboard: http://localhost:' + PORT);
    console.log('❤️  Health: http://localhost:' + PORT + '/health');
    console.log('🤖 ML Model: ' + (process.env.GEMINI_MODEL || 'gemini-1.5-flash'));
    console.log('✅ Server running on port ' + PORT);
});
