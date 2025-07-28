const { expect } = require('chai');
const sinon = require('sinon');
const AgenticRAGSystem = require('../../srv/lib/agentic-rag');

describe('Agentic RAG System Tests', () => {
    let ragSystem;
    let mockOpenAI;

    beforeEach(() => {
        // Mock OpenAI service
        mockOpenAI = {
            generateEmbedding: sinon.stub().resolves([0.1, 0.2, 0.3]),
            generateResponse: sinon.stub().resolves({
                content: 'Mock AI response',
                confidence: 0.85
            })
        };

        ragSystem = new AgenticRAGSystem(mockOpenAI);
    });

    describe('Initialization', () => {
        it('should initialize with all agents', () => {
            expect(ragSystem.agents).to.have.property('packaging');
            expect(ragSystem.agents).to.have.property('emission');
            expect(ragSystem.agents).to.have.property('supplyChain');
            expect(ragSystem.agents).to.have.property('regulatory');
        });

        it('should initialize vector store', () => {
            expect(ragSystem.vectorStore).to.be.an('object');
            expect(ragSystem.vectorStore).to.have.property('documents');
            expect(ragSystem.vectorStore).to.have.property('embeddings');
        });
    });

    describe('Document Processing', () => {
        it('should add documents to vector store', async () => {
            const document = {
                content: 'CCEP sustainability guidelines',
                metadata: { type: 'guideline', category: 'sustainability' }
            };

            await ragSystem.addDocument(document);
            
            expect(ragSystem.vectorStore.documents).to.have.length(1);
            expect(mockOpenAI.generateEmbedding).to.have.been.calledOnce;
        });

        it('should chunk large documents', async () => {
            const largeDocument = {
                content: 'A'.repeat(5000), // Large document
                metadata: { type: 'report' }
            };

            await ragSystem.addDocument(largeDocument);
            
            // Should create multiple chunks
            expect(ragSystem.vectorStore.documents.length).to.be.greaterThan(1);
        });
    });

    describe('Semantic Search', () => {
        beforeEach(async () => {
            // Add test documents
            await ragSystem.addDocument({
                content: 'PET bottles recycling information',
                metadata: { type: 'packaging', material: 'PET' }
            });
            
            await ragSystem.addDocument({
                content: 'GHG emissions reduction strategies',
                metadata: { type: 'emissions', category: 'climate' }
            });
        });

        it('should find relevant documents', async () => {
            const results = await ragSystem.semanticSearch('PET recycling', 5);
            
            expect(results).to.be.an('array');
            expect(results.length).to.be.greaterThan(0);
            expect(results[0]).to.have.property('content');
            expect(results[0]).to.have.property('similarity');
            expect(results[0]).to.have.property('metadata');
        });

        it('should return results sorted by similarity', async () => {
            const results = await ragSystem.semanticSearch('packaging materials', 5);
            
            for (let i = 1; i < results.length; i++) {
                expect(results[i-1].similarity).to.be.at.least(results[i].similarity);
            }
        });

        it('should filter by similarity threshold', async () => {
            ragSystem.similarityThreshold = 0.9; // High threshold
            const results = await ragSystem.semanticSearch('unrelated query', 5);
            
            results.forEach(result => {
                expect(result.similarity).to.be.at.least(0.9);
            });
        });
    });

    describe('Agent Selection', () => {
        it('should select packaging agent for packaging queries', () => {
            const agent = ragSystem.selectAgent('What is the recyclability of PET bottles?');
            expect(agent.specialization).to.equal('packaging');
        });

        it('should select emission agent for emission queries', () => {
            const agent = ragSystem.selectAgent('How can we reduce GHG emissions?');
            expect(agent.specialization).to.equal('emission');
        });

        it('should select supply chain agent for supplier queries', () => {
            const agent = ragSystem.selectAgent('Evaluate supplier sustainability performance');
            expect(agent.specialization).to.equal('supplyChain');
        });

        it('should select regulatory agent for compliance queries', () => {
            const agent = ragSystem.selectAgent('What are the latest regulatory requirements?');
            expect(agent.specialization).to.equal('regulatory');
        });

        it('should default to packaging agent for unclear queries', () => {
            const agent = ragSystem.selectAgent('General sustainability question');
            expect(agent.specialization).to.equal('packaging');
        });
    });

    describe('Query Processing', () => {
        beforeEach(async () => {
            // Add test knowledge
            await ragSystem.addDocument({
                content: 'CCEP targets 30% GHG reduction by 2030',
                metadata: { type: 'target', category: 'emissions' }
            });
        });

        it('should process queries with context', async () => {
            const result = await ragSystem.processQuery(
                'What is our GHG reduction target?',
                { userId: 'test-user', sessionId: 'test-session' }
            );

            expect(result).to.have.property('answer');
            expect(result).to.have.property('confidence');
            expect(result).to.have.property('sources');
            expect(result).to.have.property('agentUsed');
        });

        it('should include relevant sources', async () => {
            const result = await ragSystem.processQuery('GHG emissions target');

            expect(result.sources).to.be.an('array');
            expect(result.sources.length).to.be.greaterThan(0);
            expect(result.sources[0]).to.have.property('content');
            expect(result.sources[0]).to.have.property('metadata');
        });

        it('should maintain conversation context', async () => {
            const context = { sessionId: 'test-session' };
            
            await ragSystem.processQuery('What is our emission target?', context);
            const result = await ragSystem.processQuery('How are we progressing?', context);

            expect(result.answer).to.include('emission'); // Should understand context
        });
    });

    describe('Agent-Specific Processing', () => {
        describe('Packaging Agent', () => {
            it('should analyze packaging materials', async () => {
                const agent = ragSystem.agents.packaging;
                const result = await agent.processQuery('Analyze PET bottle sustainability');

                expect(result).to.have.property('analysis');
                expect(result).to.have.property('recommendations');
                expect(result).to.have.property('confidence');
            });

            it('should provide material-specific insights', async () => {
                const agent = ragSystem.agents.packaging;
                const result = await agent.processQuery('Compare PET vs aluminum sustainability');

                expect(result.analysis).to.include('PET');
                expect(result.analysis).to.include('aluminum');
            });
        });

        describe('Emission Agent', () => {
            it('should calculate emission reductions', async () => {
                const agent = ragSystem.agents.emission;
                const result = await agent.processQuery('Calculate emission reduction progress');

                expect(result).to.have.property('calculations');
                expect(result).to.have.property('progress');
                expect(result).to.have.property('recommendations');
            });

            it('should provide forecasting', async () => {
                const agent = ragSystem.agents.emission;
                const result = await agent.processQuery('Forecast 2030 emissions');

                expect(result).to.have.property('forecast');
                expect(result).to.have.property('confidence');
            });
        });

        describe('Supply Chain Agent', () => {
            it('should assess supplier risks', async () => {
                const agent = ragSystem.agents.supplyChain;
                const result = await agent.processQuery('Assess supplier sustainability risks');

                expect(result).to.have.property('riskAssessment');
                expect(result).to.have.property('recommendations');
            });
        });

        describe('Regulatory Agent', () => {
            it('should track compliance status', async () => {
                const agent = ragSystem.agents.regulatory;
                const result = await agent.processQuery('Check regulatory compliance status');

                expect(result).to.have.property('complianceStatus');
                expect(result).to.have.property('risks');
                expect(result).to.have.property('actions');
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle OpenAI API errors gracefully', async () => {
            mockOpenAI.generateResponse.rejects(new Error('API Error'));

            const result = await ragSystem.processQuery('Test query');
            
            expect(result).to.have.property('error');
            expect(result.confidence).to.be.below(0.5);
        });

        it('should handle empty queries', async () => {
            const result = await ragSystem.processQuery('');
            
            expect(result).to.have.property('error');
            expect(result.error).to.include('empty');
        });

        it('should handle vector store errors', async () => {
            ragSystem.vectorStore = null; // Simulate error
            
            const result = await ragSystem.processQuery('Test query');
            
            expect(result).to.have.property('error');
        });
    });

    describe('Performance', () => {
        it('should cache embeddings for repeated queries', async () => {
            await ragSystem.processQuery('Test query');
            await ragSystem.processQuery('Test query');
            
            // Should only call embedding generation once due to caching
            expect(mockOpenAI.generateEmbedding.callCount).to.equal(1);
        });

        it('should limit search results appropriately', async () => {
            // Add many documents
            for (let i = 0; i < 20; i++) {
                await ragSystem.addDocument({
                    content: `Document ${i}`,
                    metadata: { index: i }
                });
            }

            const results = await ragSystem.semanticSearch('document', 5);
            expect(results.length).to.equal(5);
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
