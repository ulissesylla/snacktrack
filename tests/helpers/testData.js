// Test data helper functions
// Provides functions to create and manage test data

// Create a test user
function createTestUser(data = {}) {
  return {
    id: data.id || 1,
    nome: data.nome || 'Test User',
    email: data.email || 'test@example.com',
    senha_hash: data.senha_hash || 'hashed_password',
    funcao: data.funcao || 'Gerente', // or 'Colaborador'
    status: data.status || 'Ativo',
    data_criacao: data.data_criacao || new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
}

// Create a test product
function createTestProduct(data = {}) {
  return {
    id: data.id || 1,
    nome: data.nome || 'Test Product',
    descricao: data.descricao || 'Test product description',
    preco: data.preco || 10.50,
    unidade_medida: data.unidade_medida || 'unidade',
    categoria: data.categoria || 'doce',
    estoque_minimo: data.estoque_minimo || 5,
    fabricante: data.fabricante || 'Test Manufacturer',
    tipo: data.tipo || 'Produto acabado',
    status: data.status || 'Disponível',
    data_criacao: data.data_criacao || new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
}

// Create a test local
function createTestLocal(data = {}) {
  return {
    id: data.id || 1,
    nome: data.nome || 'Test Local',
    capacidade_maxima: data.capacidade_maxima || 100,
    descricao: data.descricao || 'Test location description',
    status: data.status || 'Ativo',
    data_criacao: data.data_criacao || new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
}

// Create a test lote
function createTestLote(data = {}) {
  return {
    id: data.id || 1,
    produto_id: data.produto_id || 1,
    numero_lote: data.numero_lote || 'LOT-001',
    quantidade: data.quantidade || 10,
    data_validade: data.data_validade || null,
    data_fabricacao: data.data_fabricacao || null,
    data_entrada: data.data_entrada || new Date().toISOString().slice(0, 19).replace('T', ' '),
    localizacao_id: data.localizacao_id || null,
  };
}

// Create a test movimentacao
function createTestMovimentacao(data = {}) {
  return {
    id: data.id || 1,
    tipo: data.tipo || 'Entrada', // 'Entrada', 'Saída', or 'Transferência'
    produto_id: data.produto_id || 1,
    lote_id: data.lote_id || null,  // Added lote_id field
    local_origem_id: data.local_origem_id || null,
    local_destino_id: data.local_destino_id || 1,
    quantidade: data.quantidade || 10,
    usuario_id: data.usuario_id || 1,
    data_movimentacao: data.data_movimentacao || new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
}

// Reset all test data
function resetTestData() {
  // This would reset the mock database state if needed
  // Currently handled by the mock implementation
}

module.exports = {
  createTestUser,
  createTestProduct,
  createTestLocal,
  createTestLote,
  createTestMovimentacao,
  resetTestData
};