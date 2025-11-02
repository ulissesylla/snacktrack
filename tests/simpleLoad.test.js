// Simple test to check if the module loads
describe('Simple Load Test', () => {
  test('should load EstoqueService without error', () => {
    expect(() => {
      require('../services/estoqueService');
    }).not.toThrow();
  });
});