const cds = require('@sap/cds/lib');
const { expect } = require('chai');

describe('Sustainability Service Tests', () => {
    let sustainabilityService;

    before(async () => {
        // Connect to in-memory database
        cds.test.in(__dirname + '/../..');
        sustainabilityService = await cds.connect.to('SustainabilityService');
    });

    describe('Entity Operations', () => {
        it('should read packaging metrics', async () => {
            const { PackagingMetrics } = sustainabilityService.entities;
            const result = await SELECT.from(PackagingMetrics).limit(5);
            
            expect(result).to.be.an('array');
            expect(result.length).to.be.greaterThan(0);
            expect(result[0]).to.have.property('material');
            expect(result[0]).to.have.property('recyclableContent');
        });

        it('should read emission data', async () => {
            const { EmissionData } = sustainabilityService.entities;
            const result = await SELECT.from(EmissionData).limit(5);
            
            expect(result).to.be.an('array');
            expect(result.length).to.be.greaterThan(0);
            expect(result[0]).to.have.property('source');
            expect(result[0]).to.have.property('value');
        });

        it('should read sustainability insights', async () => {
            const { SustainabilityInsights } = sustainabilityService.entities;
            const result = await SELECT.from(SustainabilityInsights).limit(5);
            
            expect(result).to.be.an('array');
            expect(result.length).to.be.greaterThan(0);
            expect(result[0]).to.have.property('query');
            expect(result[0]).to.have.property('insight');
        });
    });

    describe('Function Imports', () => {
        it('should analyze packaging', async () => {
            const result = await sustainabilityService.send({
                query: 'POST',
                path: '/analyzePackaging',
                data: { material: 'PET' }
            });
            
            expect(result).to.be.an('object');
            expect(result).to.have.property('analysis');
            expect(result).to.have.property('recommendations');
        });

        it('should predict emissions', async () => {
            const result = await sustainabilityService.send({
                query: 'POST',
                path: '/predictEmissions',
                data: { scenario: 'current_trajectory' }
            });
            
            expect(result).to.be.an('object');
            expect(result).to.have.property('prediction');
            expect(result).to.have.property('confidence');
        });

        it('should generate report', async () => {
            const result = await sustainabilityService.send({
                query: 'POST',
                path: '/generateReport',
                data: { period: 'Q3-2024' }
            });
            
            expect(result).to.be.an('object');
            expect(result).to.have.property('report');
            expect(result).to.have.property('generatedAt');
        });

        it('should query insights', async () => {
            const result = await sustainabilityService.send({
                query: 'POST',
                path: '/queryInsights',
                data: { question: 'What is our GHG reduction progress?' }
            });
            
            expect(result).to.be.an('object');
            expect(result).to.have.property('answer');
            expect(result).to.have.property('confidence');
        });

        it('should get recommendations', async () => {
            const result = await sustainabilityService.send({
                query: 'POST',
                path: '/getRecommendations',
                data: { target: 'emission_reduction' }
            });
            
            expect(result).to.be.an('array');
            expect(result.length).to.be.greaterThan(0);
            expect(result[0]).to.be.a('string');
        });
    });

    describe('Data Validation', () => {
        it('should validate packaging metrics data', async () => {
            const { PackagingMetrics } = sustainabilityService.entities;
            const metrics = await SELECT.from(PackagingMetrics);
            
            metrics.forEach(metric => {
                expect(metric.recyclableContent).to.be.a('number');
                expect(metric.recyclableContent).to.be.at.least(0);
                expect(metric.recyclableContent).to.be.at.most(100);
                
                expect(metric.collectionRate).to.be.a('number');
                expect(metric.collectionRate).to.be.at.least(0);
                expect(metric.collectionRate).to.be.at.most(100);
                
                expect(['Europe', 'Asia Pacific']).to.include(metric.region);
            });
        });

        it('should validate emission data', async () => {
            const { EmissionData } = sustainabilityService.entities;
            const emissions = await SELECT.from(EmissionData);
            
            emissions.forEach(emission => {
                expect(emission.value).to.be.a('number');
                expect(emission.value).to.be.at.least(0);
                
                expect(['Packaging', 'Operations', 'Transportation']).to.include(emission.source);
                expect(['kg CO2e', 'tonnes CO2e']).to.include(emission.unit);
            });
        });
    });

    describe('Business Logic', () => {
        it('should calculate correct progress percentages', async () => {
            const { KPITracking } = sustainabilityService.entities;
            const kpis = await SELECT.from(KPITracking);
            
            kpis.forEach(kpi => {
                const expectedProgress = (kpi.currentValue / kpi.targetValue) * 100;
                expect(Math.abs(kpi.achievementPercentage - expectedProgress)).to.be.below(0.1);
            });
        });

        it('should maintain data consistency across regions', async () => {
            const { PackagingMetrics } = sustainabilityService.entities;
            const europeMetrics = await SELECT.from(PackagingMetrics).where({ region: 'Europe' });
            const apiMetrics = await SELECT.from(PackagingMetrics).where({ region: 'Asia Pacific' });
            
            expect(europeMetrics.length).to.be.greaterThan(0);
            expect(apiMetrics.length).to.be.greaterThan(0);
            
            // Europe should generally have higher collection rates
            const avgEuropeCollection = europeMetrics.reduce((sum, m) => sum + m.collectionRate, 0) / europeMetrics.length;
            const avgAPICollection = apiMetrics.reduce((sum, m) => sum + m.collectionRate, 0) / apiMetrics.length;
            
            expect(avgEuropeCollection).to.be.greaterThan(avgAPICollection);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid material analysis', async () => {
            try {
                await sustainabilityService.send({
                    query: 'POST',
                    path: '/analyzePackaging',
                    data: { material: 'INVALID_MATERIAL' }
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Invalid material');
            }
        });

        it('should handle empty queries', async () => {
            try {
                await sustainabilityService.send({
                    query: 'POST',
                    path: '/queryInsights',
                    data: { question: '' }
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Question cannot be empty');
            }
        });
    });

    describe('Performance Tests', () => {
        it('should respond to queries within acceptable time', async function() {
            this.timeout(5000); // 5 second timeout
            
            const startTime = Date.now();
            await sustainabilityService.send({
                query: 'POST',
                path: '/queryInsights',
                data: { question: 'What is our current sustainability performance?' }
            });
            const endTime = Date.now();
            
            expect(endTime - startTime).to.be.below(3000); // Should respond within 3 seconds
        });

        it('should handle concurrent requests', async function() {
            this.timeout(10000); // 10 second timeout
            
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(
                    sustainabilityService.send({
                        query: 'POST',
                        path: '/analyzePackaging',
                        data: { material: 'PET' }
                    })
                );
            }
            
            const results = await Promise.all(promises);
            expect(results).to.have.length(5);
            results.forEach(result => {
                expect(result).to.have.property('analysis');
            });
        });
    });

    after(async () => {
        await cds.shutdown();
    });
});
