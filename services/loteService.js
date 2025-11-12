const loteData = require("../data/loteData");
const produtoData = require("../data/produtoData");

/**
 * Validar dados de entrada para lote
 * @param {Object} payload - Dados do lote
 * @param {Object} options - Opções de validação
 * @param {boolean} options.isUpdate - Se é uma atualização
 * @returns {Array} Lista de erros de validação
 */
function validateInput(payload = {}, { isUpdate = false } = {}) {
  const errors = [];
  
  if (!isUpdate || typeof payload.produto_id !== "undefined") {
    if (!payload.produto_id) {
      errors.push("produto_id é obrigatório");
    } else {
      const v = Number(payload.produto_id);
      if (isNaN(v) || v <= 0) {
        errors.push("produto_id deve ser um número positivo");
      }
    }
  }
  
  if (!isUpdate || typeof payload.numero_lote !== "undefined") {
    if (!payload.numero_lote || String(payload.numero_lote).trim().length < 1) {
      errors.push("numero_lote é obrigatório e não pode ser vazio");
    } else if (String(payload.numero_lote).trim().length > 50) {
      errors.push("numero_lote deve ter no máximo 50 caracteres");
    }
  }
  
  if (typeof payload.quantidade !== "undefined" && payload.quantidade !== null) {
    const v = Number(payload.quantidade);
    if (isNaN(v) || v < 0) {
      errors.push("quantidade deve ser um número não negativo");
    }
  }
  
  if (typeof payload.data_validade !== "undefined" && payload.data_validade !== null && payload.data_validade !== "") {
    const d = new Date(payload.data_validade);
    if (isNaN(d.getTime())) {
      errors.push("data_validade inválida");
    } else {
      const now = new Date();
      // allow today or future
      if (d < new Date(now.toDateString())) {
        errors.push("data_validade deve ser hoje ou no futuro");
      }
    }
  }
  
  if (typeof payload.data_fabricacao !== "undefined" && payload.data_fabricacao !== null && payload.data_fabricacao !== "") {
    const d = new Date(payload.data_fabricacao);
    if (isNaN(d.getTime())) {
      errors.push("data_fabricacao inválida");
    } else {
      const now = new Date();
      // allow today or past
      if (d > new Date(now.toDateString())) {
        errors.push("data_fabricacao não pode ser uma data futura");
      }
    }
  }
  
  if (typeof payload.data_fabricacao !== "undefined" && payload.data_validade !== "undefined") {
    // Só validar se ambas as datas estiverem presentes
    if (payload.data_fabricacao && payload.data_validade) {
      const fabricacao = new Date(payload.data_fabricacao);
      const validade = new Date(payload.data_validade);
      if (fabricacao > validade) {
        errors.push("data_fabricacao não pode ser posterior à data_validade");
      }
    }
  }
  
  if (typeof payload.localizacao_id !== "undefined" && payload.localizacao_id !== null && payload.localizacao_id !== "") {
    const v = Number(payload.localizacao_id);
    if (isNaN(v) || v <= 0) {
      errors.push("localizacao_id deve ser um número positivo");
    }
  }
  
  return errors;
}

/**
 * Listar todos os lotes
 * @param {Object} params - Parâmetros de consulta
 * @returns {Array} Lista de lotes
 */
async function listarTodos(params = {}) {
  return loteData.findAll(params);
}

/**
 * Obter lote por ID
 * @param {number} id - ID do lote
 * @returns {Object} Lote encontrado
 */
async function buscarPorId(id) {
  const lote = await loteData.findById(id);
  if (!lote) throw { status: 404, message: "Lote não encontrado" };
  return lote;
}

/**
 * Criar novo lote
 * @param {Object} payload - Dados do lote
 * @returns {Object} Lote criado
 */
async function criar(payload = {}) {
  // Validar entrada
  const errors = validateInput(payload, { isUpdate: false });
  if (errors.length) throw { status: 400, message: errors.join("; ") };
  
  // Verificar se produto existe
  const produto = await produtoData.findById(payload.produto_id);
  if (!produto) throw { status: 404, message: "Produto associado não encontrado" };
  
  // Verificar se número de lote já existe para este produto
  const lotesExistentes = await loteData.findByProduto(payload.produto_id);
  const loteExistente = lotesExistentes.find(l => l.numero_lote === payload.numero_lote);
  if (loteExistente) throw { status: 409, message: "Número de lote já existe para este produto" };
  
  const created = await loteData.create(payload);
  return created;
}

/**
 * Atualizar lote existente
 * @param {number} id - ID do lote
 * @param {Object} payload - Dados para atualizar
 * @returns {Object} Lote atualizado
 */
async function atualizar(id, payload = {}) {
  // Verificar se lote existe
  const existing = await loteData.findById(id);
  if (!existing) throw { status: 404, message: "Lote não encontrado" };
  
  // Validar entrada
  const errors = validateInput(payload, { isUpdate: true });
  if (errors.length) throw { status: 400, message: errors.join("; ") };
  
  // Verificar se produto existe se for fornecido
  if (typeof payload.produto_id !== "undefined") {
    const produto = await produtoData.findById(payload.produto_id);
    if (!produto) throw { status: 404, message: "Produto associado não encontrado" };
  }
  
  // Verificar se número de lote já existe para este produto (excluindo o próprio lote)
  if (typeof payload.numero_lote !== "undefined") {
    const lotesExistentes = await loteData.findByProduto(payload.produto_id || existing.produto_id);
    const loteExistente = lotesExistentes.find(l => 
      l.numero_lote === payload.numero_lote && l.id !== id
    );
    if (loteExistente) throw { status: 409, message: "Número de lote já existe para este produto" };
  }
  
  const updated = await loteData.update(id, payload);
  return updated;
}

/**
 * Remover/excluir lote
 * @param {number} id - ID do lote
 * @returns {boolean} True se removido com sucesso
 */
async function remover(id) {
  // Verificar se lote existe
  const existing = await loteData.findById(id);
  if (!existing) throw { status: 404, message: "Lote não encontrado" };
  
  // Não permitir remoção de lotes que já tenham movimentações
  // Esta verificação dependeria de uma possível implementação futura
  
  const success = await loteData.remove(id);
  if (!success) throw { status: 500, message: "Falha ao remover o lote" };
  
  return success;
}

/**
 * Buscar lotes por produto
 * @param {number} produtoId - ID do produto
 * @param {Object} params - Parâmetros de filtragem
 * @returns {Array} Lista de lotes do produto
 */
async function buscarPorProduto(produtoId, params = {}) {
  // Verificar se produto existe
  const produto = await produtoData.findById(produtoId);
  if (!produto) throw { status: 404, message: "Produto não encontrado" };
  
  return loteData.findByProduto(produtoId, params);
}

/**
 * Buscar lotes por produto e localização
 * @param {number} produtoId - ID do produto
 * @param {number} localizacaoId - ID da localização
 * @param {Object} params - Parâmetros de filtragem
 * @returns {Array} Lista de lotes do produto na localização específica
 */
async function buscarPorProdutoLocalizacao(produtoId, localizacaoId, params = {}) {
  // Verificar se produto existe
  const produto = await produtoData.findById(produtoId);
  if (!produto) throw { status: 404, message: "Produto não encontrado" };
  
  // Verificar se localização existe
  const local = await require("../data/localData").findById(localizacaoId);
  if (!local) throw { status: 404, message: "Localização não encontrada" };
  
  return loteData.findByProdutoLocalizacao(produtoId, localizacaoId, params);
}

/**
 * Obter lotes próximos do vencimento
 * @param {number} diasValidade - Dias para considerar como próximo do vencimento
 * @returns {Array} Lista de lotes próximos do vencimento
 */
async function getLotesProximosValidade(diasValidade = 7) {
  return loteData.getLotesProximosValidade(diasValidade);
}

/**
 * Obter lotes vencidos
 * @returns {Array} Lista de lotes vencidos
 */
async function getLotesVencidos() {
  return loteData.getLotesVencidos();
}

module.exports = { 
  listarTodos,
  buscarPorId,
  criar,
  atualizar,
  remover,
  buscarPorProduto,
  buscarPorProdutoLocalizacao,
  getLotesProximosValidade,
  getLotesVencidos
};