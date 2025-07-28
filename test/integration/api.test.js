const cds = require('@sap/cds');
const { expect } = require('chai');
const request = require('supertest');

describe('API Integration Tests', () => {
    let app, server;

    before(async () => {
        // Start the CAP server
        cds.test.in(__dirname + '/../..');
        app = cds.app;
        server = await cds.serve('all').in(app);
    });

    describe('OData Service Endpoints', () => {
        it('should serve metadata document', async () => {
            const response = await request(app)
                .get('/sustainability/$metadata')
                .expect(200);

            expect(response.headers['content-type']).to.include('application/xml');
            expect(response.text).to.include('PackagingMetrics');
            expect(response.text).to.include('EmissionData');
            expect(response.text).to.include('SustainabilityInsights');
        });

        it('should return packaging metrics', async () => {
            const response = await request(app)
                .get('/sustainability/PackagingMetrics')
                .expect(200);

            expect(response.body).to.have.property('value');
            expect(response.body.value).to.be.an('array');
            
            if (response.body.value.length > 0) {
                const metric = response.body.value[0];
                expect(metric).to.have.property('material');
                expect(metric).to.have.property('recyclableContent');
                expect(metric).to.have.property('region');
            }
        });

        it('should return emission data', async () => {
            const response = await request(app)
                .get('/sustainability/EmissionData')
                .expect(200);

            expect(response.body).to.have.property('value');
            expect(response.body.value).to.be.an('array');
            
            if (response.body.value.length > 0) {
                const emission = response.body.value[0];
                expect(emission).to.have.property('source');
                expect(emission).to.have.property('value');
                expect(emission).to.have.property('unit');
            }
        });

        it('should filter by region', async () => {
            const response = await request(app)
                .get('/sustainability/PackagingMetrics?$filter=region eq \'Europe\'')
                .expect(200);

            expect(response.body.value).to.be.an('array');
            response.body.value.forEach(metric => {
                expect(metric.region).to.equal('Europe');
            });
        });

        it('should support OData query options', async () => {
            const response = await request(app)
                .get('/sustainability/PackagingMetrics?$top=5&$orderby=recyclableContent desc')
                .expect(200);

            expect(response.body.value).to.have.length.at.most(5);
            
            // Check ordering
            for (let i = 1; i < response.body.value.length; i++) {
                expect(response.body.value[i-1].recyclableContent)
                    .to.be.at.least(response.body.value[i].recyclableContent);
            }
        });
    });

    describe('Function Import Endpoints', () => {
        it('should analyze packaging', async () => {
            const response = await request(app)
                .post('/sustainability/analyzePackaging')
                .send({ material: 'PET' })
                .expect(200);

            expect(response.body).to.have.property('analysis');
            expect(response.body).to.have.property('recommendations');
            expect(response.body).to.have.property('confidence');
        });

        it('should predict emissions', async () => {
            const response = await request(app)
                .post('/sustainability/predictEmissions')
                .send({ scenario: 'current_trajectory' })
                .expect(200);

            expect(response.body).to.have.property('prediction');
            expect(response.body).to.have.property('confidence');
            expect(response.body).to.have.property('methodology');
        });

        it('should generate reports', async () => {
            const response = await request(app)
                .post('/sustainability/generateReport')
                .send({ 
                    period: 'Q3-2024',
                    region: 'Global',
                    includeAI: true
                })
                .expect(200);

            expect(response.body).to.have.property('report');
            expect(response.body).to.have.property('generatedAt');
            expect(response.body).to.have.property('metadata');
        });

        it('should query insights', async () => {
            const response = await request(app)
                .post('/sustainability/queryInsights')
                .send({ 
                    question: 'What is our current GHG emission reduction progress?',
                    context: 'dashboard',
                    agentType: 'emission'
                })
                .expect(200);

            expect(response.body).to.have.property('answer');
            expect(response.body).to.have.property('confidence');
            expect(response.body).to.have.property('sources');
        });

        it('should get recommendations', async () => {
            const response = await request(app)
                .post('/sustainability/getRecommendations')
                .send({ target: 'emission_reduction' })
                .expect(200);

            expect(response.body).to.be.an('array');
            expect(response.body.length).to.be.greaterThan(0);
            response.body.forEach(recommendation => {
                expect(recommendation).to.be.a('string');
                expect(recommendation.length).to.be.greaterThan(0);
            });
        });
    });

    describe('AI Chat Integration', () => {
        it('should process chat queries', async () => {
            const response = await request(app)
                .post('/sustainability/processChatQuery')
                .send({
                    query: 'How can we improve our packaging sustainability?',
                    sessionId: 'test-session-123',
                    userId: 'test-user',
                    context: JSON.stringify({ source: 'chat' })
                })
                .expect(200);

            expect(response.body).to.have.property('response');
            expect(response.body).to.have.property('confidence');
            expect(response.body).to.have.property('agentUsed');
            expect(response.body.response).to.be.a('string');
            expect(response.body.response.length).to.be.greaterThan(0);
        });

        it('should maintain conversation context', async () => {
            const sessionId = 'test-session-context';
            
            // First query
            await request(app)
                .post('/sustainability/processChatQuery')
                .send({
                    query: 'Tell me about PET bottle recycling',
                    sessionId: sessionId,
                    userId: 'test-user'
                })
                .expect(200);

            // Follow-up query
            const response = await request(app)
                .post('/sustainability/processChatQuery')
                .send({
                    query: 'What are the challenges?',
                    sessionId: sessionId,
                    userId: 'test-user'
                })
                .expect(200);

            expect(response.body.response).to.include('recycling');
        });
    });

    describe('Dashboard Data Integration', () => {
        it('should get dashboard data', async () => {
            const response = await request(app)
                .post('/sustainability/getDashboardData')
                .send({
                    region: 'Global',
                    period: 'current',
                    kpis: JSON.stringify(['ghgReduction', 'recyclablePackaging'])
                })
                .expect(200);

            expect(response.body).to.have.property('overview');
            expect(response.body.overview).to.have.property('ghgReduction');
            expect(response.body.overview).to.have.property('recyclablePackaging');
        });

        it('should get KPI analysis', async () => {
            const response = await request(app)
                .post('/sustainability/getKPIAnalysis')
                .send({
                    kpiName: 'ghgReduction',
                    region: 'Europe',
                    timeRange: '12months'
                })
                .expect(200);

            expect(response.body).to.have.property('current');
            expect(response.body).to.have.property('target');
            expect(response.body).to.have.property('trend');
            expect(response.body).to.have.property('forecast');
        });

        it('should get alerts', async () => {
            const response = await request(app)
                .post('/sustainability/getAlerts')
                .send({
                    severity: 'all',
                    category: 'sustainability',
                    region: 'Global'
                })
                .expect(200);

            expect(response.body).to.be.an('array');
            response.body.forEach(alert => {
                expect(alert).to.have.property('type');
                expect(alert).to.have.property('message');
                expect(alert).to.have.property('priority');
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid function parameters', async () => {
            const response = await request(app)
                .post('/sustainability/analyzePackaging')
                .send({ material: '' })
                .expect(400);

            expect(response.body).to.have.property('error');
        });

        it('should handle missing required parameters', async () => {
            const response = await request(app)
                .post('/sustainability/queryInsights')
                .send({})
                .expect(400);

            expect(response.body).to.have.property('error');
        });

        it('should handle invalid OData queries', async () => {
            await request(app)
                .get('/sustainability/PackagingMetrics?$filter=invalid_field eq \'value\'')
                .expect(400);
        });
    });

    describe('Performance Tests', () => {
        it('should respond to simple queries quickly', async function() {
            this.timeout(5000);
            
            const start = Date.now();
            await request(app)
                .get('/sustainability/PackagingMetrics?$top=10')
                .expect(200);
            const duration = Date.now() - start;
            
            expect(duration).to.be.below(2000); // Should respond within 2 seconds
        });

        it('should handle concurrent requests', async function() {
            this.timeout(10000);
            
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(
                    request(app)
                        .get('/sustainability/PackagingMetrics?$top=5')
                        .expect(200)
                );
            }
            
            const responses = await Promise.all(promises);
            expect(responses).to.have.length(5);
            responses.forEach(response => {
                expect(response.body).to.have.property('value');
            });
        });
    });

    describe('Security Tests', () => {
        it('should validate input parameters', async () => {
            const response = await request(app)
                .post('/sustainability/queryInsights')
                .send({
                    question: '<script>alert("xss")</script>',
                    context: 'test'
                })
                .expect(400);

            expect(response.body).to.have.property('error');
        });

        it('should handle SQL injection attempts', async () => {
            await request(app)
                .get('/sustainability/PackagingMetrics?$filter=material eq \'PET\'; DROP TABLE PackagingMetrics; --\'')
                .expect(400);
        });
    });

    after(async () => {
        if (server) {
            await server.close();
        }
        await cds.shutdown();
    });
});
