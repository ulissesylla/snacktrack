const historicoData = require("../data/historicoData");

/**
 * Listar movimentações filtradas com paginação
 * @param {Object} params - Parâmetros de busca
 * @param {string} params.data_inicio - Data inicial (formato YYYY-MM-DD)
 * @param {string} params.data_fim - Data final (formato YYYY-MM-DD)
 * @param {number} params.produto_id - ID do produto
 * @param {string} params.tipo - Tipo de movimentação
 * @param {number} params.local_id - ID do local
 * @param {number} params.pagina - Página atual (padrão: 1)
 * @param {number} params.limite - Limite por página (padrão: 50, máx: 100)
 * @returns {Object} Resultado com movimentações e metadados de paginação
 */
async function listarMovimentacoesFiltradas(params = {}) {
  // Validação e sanitização dos parâmetros
  const pagina = Math.max(1, parseInt(params.pagina) || 1);
  let limite = parseInt(params.limite) || 50;
  limite = Math.min(limite, 100); // Máximo de 100 por página
  
  // Validar datas se fornecidas
  if (params.data_inicio && !isValidDate(params.data_inicio)) {
    throw new Error("Data início inválida");
  }
  if (params.data_fim && !isValidDate(params.data_fim)) {
    throw new Error("Data fim inválida");
  }
  if (params.data_inicio && params.data_fim && params.data_inicio > params.data_fim) {
    throw new Error("Data início não pode ser maior que data fim");
  }
  
  // Validar tipo de movimentação se fornecido
  if (params.tipo && !['Entrada', 'Saída', 'Transferência'].includes(params.tipo)) {
    throw new Error("Tipo de movimentação inválido");
  }
  
  // Preparar filtros
  const filters = {
    data_inicio: params.data_inicio,
    data_fim: params.data_fim,
    produto_id: params.produto_id ? parseInt(params.produto_id) : null,
    tipo: params.tipo,
    local_id: params.local_id ? parseInt(params.local_id) : null,
    offset: (pagina - 1) * limite,
    limit: limite
  };
  
  // Remover filtros nulos para não afetar a query
  Object.keys(filters).forEach(key => {
    if (filters[key] === null || filters[key] === undefined) {
      delete filters[key];
    }
  });
  
  // Buscar movimentações
  const movimentacoes = await historicoData.findByFilters(filters);
  
  // Contar total para paginação
  const totalRegistros = await historicoData.countByFilters({
    data_inicio: params.data_inicio,
    data_fim: params.data_fim,
    produto_id: params.produto_id ? parseInt(params.produto_id) : null,
    tipo: params.tipo,
    local_id: params.local_id ? parseInt(params.local_id) : null
  });
  
  const totalPaginas = Math.ceil(totalRegistros / limite);
  
  return {
    movimentacoes,
    paginacao: {
      pagina_atual: pagina,
      limite_por_pagina: limite,
      total_registros: totalRegistros,
      total_paginas: totalPaginas
    }
  };
}

/**
 * Validar se uma string é uma data válida no formato YYYY-MM-DD
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {boolean} True se for uma data válida
 */
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString === date.toISOString().split('T')[0];
}

module.exports = { listarMovimentacoesFiltradas };