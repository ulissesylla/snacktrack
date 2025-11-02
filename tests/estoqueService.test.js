// Unit tests for EstoqueService
// Jest will automatically use the mocks from __mocks__ directory
jest.mock('../config/database');
jest.mock('../data/produtoData');
jest.mock('../data/localData');
jest.mock('../data/movimentacaoData');

const { EstoqueService, ErroEstoqueInsuficiente, ErroLocalInvalido, ErroProdutoInvalido } = require('../services/estoqueService');
const movimentacaoData = require('../data/movimentacaoData');
const produtoData = require('../data/produtoData');
const localData = require('../data/localData');
const { createTestProduct, createTestLocal, createTestMovimentacao } = require('./helpers/testData');

describe('EstoqueService', () => {
  beforeEach(() => {
    // Reset mock implementations before each test
    jest.clearAllMocks();
  });

  describe('registrarEntrada', () => {
    test('should successfully register an entry when all data is valid', async () => {
      // Arrange
      const produto = createTestProduct({ id: 1, status: 'Disponível' });
      const local = createTestLocal({ id: 1, status: 'Ativo' });
      const movimentacao = createTestMovimentacao({
        tipo: 'Entrada',
        produto_id: 1,
        local_destino_id: 1,
        quantidade: 10,
        usuario_id: 1
      });
      
      produtoData.findById.mockResolvedValue(produto);
      localData.findById.mockResolvedValue(local);
      movimentacaoData.create.mockResolvedValue(movimentacao);

      // Act
      const result = await EstoqueService.registrarEntrada(1, 1, 10, 1);

      // Assert
      expect(result.success).toBe(true);
      expect(movimentacaoData.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'Entrada',
          produto_id: 1,
          local_origem_id: null,  // The Movimentacao model sets this to null for entries
          local_destino_id: 1,
          quantidade: 10,
          usuario_id: 1
        }),
        undefined  // connection object is undefined in this mock
      );
    });

    test('should throw ErroProdutoInvalido if product does not exist or is unavailable', async () => {
      // Arrange
      produtoData.findById.mockResolvedValue(null); // Product not found

      // Act & Assert
      await expect(EstoqueService.registrarEntrada(999, 1, 10, 1))
        .rejects
        .toThrow(ErroProdutoInvalido);
    });

    test('should throw ErroLocalInvalido if local does not exist or is inactive', async () => {
      // Arrange
      const produto = createTestProduct({ id: 1, status: 'Disponível' });
      produtoData.findById.mockResolvedValue(produto);
      localData.findById.mockResolvedValue(null); // Local not found

      // Act & Assert
      await expect(EstoqueService.registrarEntrada(1, 999, 10, 1))
        .rejects
        .toThrow(ErroLocalInvalido);
    });
  });

  describe('registrarSaida', () => {
    test('should successfully register an exit when there is sufficient stock', async () => {
      // Arrange
      const produto = createTestProduct({ id: 1, status: 'Disponível' });
      const local = createTestLocal({ id: 1, status: 'Ativo' });
      const movimentacao = createTestMovimentacao({
        tipo: 'Saída',
        produto_id: 1,
        local_origem_id: 1,
        quantidade: 5,
        usuario_id: 1
      });
      
      produtoData.findById.mockResolvedValue(produto);
      localData.findById.mockResolvedValue(local);
      movimentacaoData.getEstoqueAtual.mockResolvedValue(10); // 10 units in stock
      movimentacaoData.create.mockResolvedValue(movimentacao);

      // Act
      const result = await EstoqueService.registrarSaida(1, 1, 5, 1);

      // Assert
      expect(result.success).toBe(true);
      expect(movimentacaoData.getEstoqueAtual).toHaveBeenCalledWith(1, 1, undefined); // connection object is undefined in this mock
      expect(movimentacaoData.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'Saída',
          produto_id: 1,
          local_origem_id: 1,
          local_destino_id: null,  // The Movimentacao model sets this to null for exits
          quantidade: 5,
          usuario_id: 1
        }),
        undefined  // connection object is undefined in this mock
      );
    });

    test('should throw ErroEstoqueInsuficiente if there is insufficient stock', async () => {
      // Arrange
      const produto = createTestProduct({ id: 1, status: 'Disponível' });
      const local = createTestLocal({ id: 1, status: 'Ativo' });
      
      produtoData.findById.mockResolvedValue(produto);
      localData.findById.mockResolvedValue(local);
      movimentacaoData.getEstoqueAtual.mockResolvedValue(3); // Only 3 in stock

      // Act & Assert
      await expect(EstoqueService.registrarSaida(1, 1, 10, 1))
        .rejects
        .toThrow(ErroEstoqueInsuficiente);
    });

    test('should throw ErroProdutoInvalido if product does not exist', async () => {
      // Arrange
      produtoData.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(EstoqueService.registrarSaida(999, 1, 5, 1))
        .rejects
        .toThrow(ErroProdutoInvalido);
    });
  });

  describe('transferir', () => {
    test('should successfully transfer between locations when all data is valid', async () => {
      // Arrange
      const produto = createTestProduct({ id: 1, status: 'Disponível' });
      const origem = createTestLocal({ id: 1, status: 'Ativo' });
      const destino = createTestLocal({ id: 2, status: 'Ativo' });
      const movimentacao = createTestMovimentacao({
        tipo: 'Transferência',
        produto_id: 1,
        local_origem_id: 1,
        local_destino_id: 2,
        quantidade: 5,
        usuario_id: 1
      });
      
      produtoData.findById.mockResolvedValue(produto);
      localData.findById.mockImplementation((id) => {
        if (id === 1) return origem;
        if (id === 2) return destino;
        return null;
      });
      movimentacaoData.getEstoqueAtual.mockResolvedValue(10); // 10 units in origem
      movimentacaoData.create.mockResolvedValue(movimentacao);

      // Act
      const result = await EstoqueService.transferir(1, 1, 2, 5, 1);

      // Assert
      expect(result.success).toBe(true);
      expect(movimentacaoData.getEstoqueAtual).toHaveBeenCalledWith(1, 1, undefined); // connection object is undefined in this mock
      expect(movimentacaoData.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'Transferência',
          produto_id: 1,
          local_origem_id: 1,
          local_destino_id: 2,
          quantidade: 5,
          usuario_id: 1
        }),
        undefined  // connection object is undefined in this mock
      );
    });

    test('should throw ErroLocalInvalido if origin and destination are the same', async () => {
      // Act & Assert
      await expect(EstoqueService.transferir(1, 1, 1, 5, 1))
        .rejects
        .toThrow(ErroLocalInvalido);
    });

    test('should throw ErroEstoqueInsuficiente if origin has insufficient stock', async () => {
      // Arrange
      const produto = createTestProduct({ id: 1, status: 'Disponível' });
      const origem = createTestLocal({ id: 1, status: 'Ativo' });
      const destino = createTestLocal({ id: 2, status: 'Ativo' });
      
      produtoData.findById.mockResolvedValue(produto);
      localData.findById.mockImplementation((id) => {
        if (id === 1) return origem;
        if (id === 2) return destino;
        return null;
      });
      movimentacaoData.getEstoqueAtual.mockResolvedValue(3); // Only 3 in origem

      // Act & Assert
      await expect(EstoqueService.transferir(1, 1, 2, 5, 1))
        .rejects
        .toThrow(ErroEstoqueInsuficiente);
    });

    test('should throw ErroProdutoInvalido if product does not exist', async () => {
      // Arrange
      produtoData.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(EstoqueService.transferir(999, 1, 2, 5, 1))
        .rejects
        .toThrow(ErroProdutoInvalido);
    });
  });
});

describe('obterEstoqueAtual', () => {
  beforeEach(() => {
    // Reset mock implementations before each test
    jest.clearAllMocks();
  });

  test('should return current stock when produto_id and local_id are provided', async () => {
    // Note: This tests the controller function obterEstoqueAtual
    // which is not part of EstoqueService but of movimentacaoController
    // This test would need to be in movimentacaoAPI.test.js instead
  });
});