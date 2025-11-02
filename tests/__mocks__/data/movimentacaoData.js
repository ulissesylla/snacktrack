// Mock for movimentacaoData
const mockCreate = jest.fn();
const mockGetEstoqueAtual = jest.fn();
const mockGetMovimentacoesByProduto = jest.fn();
const mockGetMovimentacoesByLocal = jest.fn();

module.exports = {
  create: mockCreate,
  getEstoqueAtual: mockGetEstoqueAtual,
  getMovimentacoesByProduto: mockGetMovimentacoesByProduto,
  getMovimentacoesByLocal: mockGetMovimentacoesByLocal,
};