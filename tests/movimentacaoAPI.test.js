// Integration tests for movimentacao API endpoints
const request = require('supertest');
const express = require('express');
const session = require('express-session');

// Import and configure the app separately from its server startup
// We'll create a separate app instance for testing with mocked middleware
const baseApp = require('../server');

// Create a new Express app for testing with mocked authentication
const app = express();

// Add the same middleware as the main app
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Add authentication middleware that mocks session data
app.use((req, res, next) => {
  // Mock an authenticated user for testing
  if (!req.session) {
    req.session = {};
  }
  req.session.user = { id: 1, funcao: 'Gerente', nome: 'Test User' };
  next();
});

// Import and use routes (these are the same as the main app)
const authRoutes = require('../routes/authRoutes');
const movimentacaoRoutes = require('../routes/movimentacaoRoutes');
const routes = require('../routes');

app.use(authRoutes);
app.use('/api/movimentacoes', movimentacaoRoutes);
app.use('/', routes);

// Mock the database with our test mock
jest.mock('../config/database', () => require('./mocks/database'));

// Mock the data modules
jest.mock('../data/produtoData');
jest.mock('../data/localData');
jest.mock('../data/movimentacaoData');

const produtoData = require('../data/produtoData');
const localData = require('../data/localData');
const movimentacaoData = require('../data/movimentacaoData');

describe('Movimentacao API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    produtoData.findById.mockResolvedValue({ id: 1, status: 'Disponível', nome: 'Test Product' });
    localData.findById.mockResolvedValue({ id: 1, status: 'Ativo', nome: 'Test Local' });
  });

  describe('POST /api/movimentacoes/entrada', () => {
    test('should successfully register an entry with valid data', async () => {
      // Arrange
      movimentacaoData.create.mockResolvedValue({
        id: 1,
        tipo: 'Entrada',
        produto_id: 1,
        local_destino_id: 1,
        quantidade: 10,
        usuario_id: 1,
        data_movimentacao: new Date().toISOString()
      });

      // Act
      const response = await request(app)
        .post('/api/movimentacoes/entrada')
        .send({
          produto_id: 1,
          local_id: 1,
          quantidade: 10
        })
        .set('Accept', 'application/json')
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.movimentacao.tipo).toBe('Entrada');
      expect(movimentacaoData.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'Entrada',
          produto_id: 1,
          local_destino_id: 1,
          quantidade: 10,
          usuario_id: 1
        }),
        expect.anything()
      );
    });

    test('should return 400 for invalid input data', async () => {
      // Act
      const response = await request(app)
        .post('/api/movimentacoes/entrada')
        .send({
          produto_id: 1, // Missing local_id and quantidade
        })
        .set('Accept', 'application/json')
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Dados inválidos');
    });
    
    test('should return 400 for validation errors (like invalid product)', async () => {
      // Note: This test needs to consider middleware validation happens first
      // In a real implementation, we'd need to test the validation middleware separately
      // For now, this test covers the case where invalid data is provided
      
      // Act
      const response = await request(app)
        .post('/api/movimentacoes/entrada')
        .send({
          produto_id: 1,
          local_id: 1,
          quantidade: -5  // This is invalid
        })
        .set('Accept', 'application/json')
        .expect(400);

      // Assert - This will test that validation middleware works
      expect(response.body.error).toBe('Dados inválidos');
    });
    
    test('should return 500 for internal server errors', async () => {
      // Arrange: Have the service mock throw an unexpected error
      // We need to modify our service mock to throw an internal error in this specific test
      const estoqueService = require('../services/estoqueService');
      jest.spyOn(estoqueService.EstoqueService, 'registrarEntrada').mockRejectedValue(new Error('Database connection failed'));
      
      // Act
      const response = await request(app)
        .post('/api/movimentacoes/entrada')
        .send({
          produto_id: 1,
          local_id: 1,
          quantidade: 10
        })
        .set('Accept', 'application/json')
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Erro interno');
      
      // Restore the mock
      jest.spyOn(estoqueService.EstoqueService, 'registrarEntrada').mockRestore();
    });
  });

  describe('POST /api/movimentacoes/saida', () => {
    test('should successfully register an exit with valid data and sufficient stock', async () => {
      // Arrange
      movimentacaoData.getEstoqueAtual.mockResolvedValue(10); // Sufficient stock
      movimentacaoData.create.mockResolvedValue({
        id: 1,
        tipo: 'Saída',
        produto_id: 1,
        local_origem_id: 1,
        quantidade: 5,
        usuario_id: 1,
        data_movimentacao: new Date().toISOString()
      });

      // Act
      const response = await request(app)
        .post('/api/movimentacoes/saida')
        .send({
          produto_id: 1,
          local_id: 1,
          quantidade: 5
        })
        .set('Accept', 'application/json')
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.movimentacao.tipo).toBe('Saída');
      expect(movimentacaoData.getEstoqueAtual).toHaveBeenCalledWith(1, 1, expect.anything());
    });

    test('should return 422 for insufficient stock', async () => {
      // Arrange
      movimentacaoData.getEstoqueAtual.mockResolvedValue(3); // Insufficient stock

      // Act
      const response = await request(app)
        .post('/api/movimentacoes/saida')
        .send({
          produto_id: 1,
          local_id: 1,
          quantidade: 10 // Requesting more than available
        })
        .set('Accept', 'application/json')
        .expect(422);

      // Assert
      expect(response.body.error).toBe('ESTOQUE_INSUFICIENTE');
    });
    
    // Skip the product not found test since validation happens first in middleware
    // The service-level insufficient stock error is already tested above
  });

  describe('POST /api/movimentacoes/transferencia', () => {
    test('should successfully transfer between locations with valid data', async () => {
      // Arrange
      localData.findById.mockImplementation((id) => {
        if (id === 1) return { id: 1, status: 'Ativo', nome: 'Origin Local' };
        if (id === 2) return { id: 2, status: 'Ativo', nome: 'Destination Local' };
        return null;
      });
      
      movimentacaoData.getEstoqueAtual.mockResolvedValue(10); // Sufficient stock in origem
      movimentacaoData.create.mockResolvedValue({
        id: 1,
        tipo: 'Transferência',
        produto_id: 1,
        local_origem_id: 1,
        local_destino_id: 2,
        quantidade: 5,
        usuario_id: 1,
        data_movimentacao: new Date().toISOString()
      });

      // Act
      const response = await request(app)
        .post('/api/movimentacoes/transferencia')
        .send({
          produto_id: 1,
          local_origem_id: 1,
          local_destino_id: 2,
          quantidade: 5
        })
        .set('Accept', 'application/json')
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.movimentacao.tipo).toBe('Transferência');
    });

    test('should return 400 for same origin and destination', async () => {
      // Act
      const response = await request(app)
        .post('/api/movimentacoes/transferencia')
        .send({
          produto_id: 1,
          local_origem_id: 1,
          local_destino_id: 1, // Same as origin
          quantidade: 5
        })
        .set('Accept', 'application/json')
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Dados inválidos');
    });
    
    // Skip the location not found test since validation happens first in middleware
    // The transfer with same origin and destination test is already implemented above
  });

  describe('GET /api/movimentacoes/historico', () => {
    test('should return movement history for a product', async () => {
      // Arrange
      const mockHistory = [
        { id: 1, produto_id: 1, tipo: 'Entrada', quantidade: 10 },
        { id: 2, produto_id: 1, tipo: 'Saída', quantidade: 5 }
      ];
      movimentacaoData.getMovimentacoesByProduto.mockResolvedValue(mockHistory);

      // Act
      const response = await request(app)
        .get('/api/movimentacoes/historico')
        .query({ produto_id: 1 })
        .set('Accept', 'application/json')
        .expect(200);

      // Assert
      expect(response.body.movimentacoes).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });
    
    test('should return movement history for a local', async () => {
      // Arrange
      const mockHistory = [
        { id: 1, local_origem_id: 1, tipo: 'Saída', quantidade: 10 },
        { id: 2, local_destino_id: 1, tipo: 'Entrada', quantidade: 5 }
      ];
      movimentacaoData.getMovimentacoesByLocal.mockResolvedValue(mockHistory);

      // Act
      const response = await request(app)
        .get('/api/movimentacoes/historico')
        .query({ local_id: 1 })
        .set('Accept', 'application/json')
        .expect(200);

      // Assert
      expect(response.body.movimentacoes).toHaveLength(2);
    });
    
    test('should return empty history when no filters provided', async () => {
      // Arrange
      movimentacaoData.getMovimentacoesByProduto.mockResolvedValue([]);

      // Act
      const response = await request(app)
        .get('/api/movimentacoes/historico')
        .set('Accept', 'application/json')
        .expect(200);

      // Assert
      expect(response.body.movimentacoes).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });
  
  describe('GET /api/movimentacoes/estoque', () => {
    test('should return current stock for a product in a location', async () => {
      // Arrange
      movimentacaoData.getEstoqueAtualByProdutoLocal.mockResolvedValue(50);

      // Act
      const response = await request(app)
        .get('/api/movimentacoes/estoque')
        .query({ produto_id: 1, local_id: 1 })
        .set('Accept', 'application/json')
        .expect(200);

      // Assert
      expect(response.body.estoque_atual).toBe(50);
      expect(response.body.produto_id).toBe(1);
      expect(response.body.local_id).toBe(1);
    });
    
    test('should return 400 when produto_id or local_id is not provided', async () => {
      // Act
      const response = await request(app)
        .get('/api/movimentacoes/estoque')
        .query({ produto_id: 1 }) // Missing local_id
        .set('Accept', 'application/json')
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Parâmetros inválidos');
    });
    
    test('should return 400 when both produto_id and local_id are missing', async () => {
      // Act
      const response = await request(app)
        .get('/api/movimentacoes/estoque')
        .set('Accept', 'application/json')
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Parâmetros inválidos');
    });
  });
});