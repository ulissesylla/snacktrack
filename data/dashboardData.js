const db = require("../config/database");

/**
 * Calcular consumo médio por produto e local
 * @param {Object} params - Parâmetros de cálculo
 * @param {number} params.produto_id - ID do produto (obrigatório)
 * @param {number} params.local_id - ID do local (opcional)
 * @param {number} params.periodo_dias - Período em dias (padrão: 30)
 * @returns {Array} Lista de consumos médios calculados
 */
async function calcularConsumoMedioProduto(params = {}) {
  const { produto_id, local_id, periodo_dias = 30 } = params;
  
  if (!produto_id) {
    throw new Error("produto_id é obrigatório para cálculo de consumo médio");
  }
  
  // Calcular data limite (período_dias atrás)
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - periodo_dias);
  const dataLimiteFormatada = dataLimite.toISOString().split('T')[0];
  
  let sql = `
    SELECT 
      m.produto_id,
      p.nome AS produto_nome,
      m.local_origem_id AS local_id,
      l.nome AS local_nome,
      SUM(m.quantidade) AS total_saidas_periodo,
      ? AS periodo_dias,
      ROUND(SUM(m.quantidade) / ?, 2) AS consumo_medio_diario
    FROM movimentacoes m
    LEFT JOIN produtos p ON m.produto_id = p.id
    LEFT JOIN locais l ON m.local_origem_id = l.id
    WHERE m.produto_id = ?
      AND m.tipo IN ('Saída', 'Transferência')
      AND m.data_movimentacao >= ?
  `;
  
  const paramsSql = [periodo_dias, periodo_dias, produto_id, dataLimiteFormatada];
  
  // Se local_id foi especificado, filtrar por ele
  if (local_id) {
    sql += " AND m.local_origem_id = ?";
    paramsSql.push(local_id);
  }
  
  sql += " GROUP BY m.produto_id, m.local_origem_id, p.nome, l.nome";
  
  const rows = await db.query(sql, paramsSql);
  return rows;
}

/**
 * Obter estatísticas de movimentação por período
 * @param {Object} params - Parâmetros de consulta
 * @param {number} params.periodo_dias - Período em dias (padrão: 30)
 * @param {number} params.local_id - ID do local (opcional)
 * @returns {Object} Estatísticas agregadas
 */
async function getEstatisticasMovimentacaoPorPeriodo(params = {}) {
  const { periodo_dias = 30, local_id } = params;
  
  // Calcular data limite (período_dias atrás)
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - periodo_dias);
  const dataLimiteFormatada = dataLimite.toISOString().split('T')[0];
  
  // Query para entradas
  let sqlEntradas = `
    SELECT COUNT(*) as total_entradas
    FROM movimentacoes m
    WHERE m.tipo = 'Entrada'
      AND m.data_movimentacao >= ?
  `;
  
  const paramsEntradas = [dataLimiteFormatada];
  
  // Query para saídas
  let sqlSaidas = `
    SELECT COUNT(*) as total_saidas
    FROM movimentacoes m
    WHERE m.tipo = 'Saída'
      AND m.data_movimentacao >= ?
  `;
  
  const paramsSaidas = [dataLimiteFormatada];
  
  // Query para transferências
  let sqlTransferencias = `
    SELECT COUNT(*) as total_transferencias
    FROM movimentacoes m
    WHERE m.tipo = 'Transferência'
      AND m.data_movimentacao >= ?
  `;
  
  const paramsTransferencias = [dataLimiteFormatada];
  
  // Se local_id foi especificado, filtrar por ele
  if (local_id) {
    sqlEntradas += " AND m.local_destino_id = ?";
    paramsEntradas.push(local_id);
    
    sqlSaidas += " AND m.local_origem_id = ?";
    paramsSaidas.push(local_id);
    
    sqlTransferencias += " AND (m.local_origem_id = ? OR m.local_destino_id = ?)";
    paramsTransferencias.push(local_id);
    paramsTransferencias.push(local_id);
  }
  
  // Executar todas as queries
  const [entradasResult, saidasResult, transferenciasResult] = await Promise.all([
    db.query(sqlEntradas, paramsEntradas),
    db.query(sqlSaidas, paramsSaidas),
    db.query(sqlTransferencias, paramsTransferencias)
  ]);
  
  return {
    total_entradas: entradasResult[0]?.total_entradas || 0,
    total_saidas: saidasResult[0]?.total_saidas || 0,
    total_transferencias: transferenciasResult[0]?.total_transferencias || 0,
    periodo_dias
  };
}

/**
 * Obter top produtos por movimentação
 * @param {Object} params - Parâmetros de consulta
 * @param {number} params.limite - Limite de produtos (padrão: 10)
 * @param {number} params.periodo_dias - Período em dias (padrão: 30)
 * @param {number} params.local_id - ID do local (opcional)
 * @returns {Array} Lista de produtos mais movimentados
 */
async function getTopProdutosMovimentacao(params = {}) {
  const { limite = 10, periodo_dias = 30, local_id } = params;
  
  // Calcular data limite (período_dias atrás)
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - periodo_dias);
  const dataLimiteFormatada = dataLimite.toISOString().split('T')[0];
  
  let sql = `
    SELECT 
      m.produto_id,
      p.nome AS produto_nome,
      SUM(m.quantidade) AS total_movimentado
    FROM movimentacoes m
    LEFT JOIN produtos p ON m.produto_id = p.id
    WHERE m.data_movimentacao >= ?
  `;
  
  const paramsSql = [dataLimiteFormatada];
  
  // Se local_id foi especificado, filtrar por ele
  if (local_id) {
    sql += " AND (m.local_origem_id = ? OR m.local_destino_id = ?)";
    paramsSql.push(local_id);
    paramsSql.push(local_id);
  }
  
  sql += `
    GROUP BY m.produto_id, p.nome
    ORDER BY SUM(m.quantidade) DESC
    LIMIT ?
  `;
  
  paramsSql.push(limite);
  
  const rows = await db.query(sql, paramsSql);
  return rows;
}

/**
 * Obter movimentação por local
 * @param {Object} params - Parâmetros de consulta
 * @param {number} params.periodo_dias - Período em dias (padrão: 30)
 * @param {number} params.limite - Limite de locais (padrão: 10)
 * @returns {Array} Lista de locais com maior movimentação
 */
async function getMovimentacaoPorLocal(params = {}) {
  const { periodo_dias = 30, limite = 10 } = params;
  
  // Calcular data limite (período_dias atrás)
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - periodo_dias);
  const dataLimiteFormatada = dataLimite.toISOString().split('T')[0];
  
  const sql = `
    SELECT 
      local_id,
      l.nome AS local_nome,
      SUM(quantidade) AS total_movimentado
    FROM (
      SELECT 
        local_origem_id AS local_id,
        quantidade
      FROM movimentacoes
      WHERE tipo IN ('Saída', 'Transferência')
        AND data_movimentacao >= ?
      
      UNION ALL
      
      SELECT 
        local_destino_id AS local_id,
        quantidade
      FROM movimentacoes
      WHERE tipo IN ('Entrada', 'Transferência')
        AND data_movimentacao >= ?
    ) movs
    LEFT JOIN locais l ON movs.local_id = l.id
    WHERE movs.local_id IS NOT NULL
    GROUP BY local_id, l.nome
    ORDER BY SUM(quantidade) DESC
    LIMIT ?
  `;
  
  const paramsSql = [dataLimiteFormatada, dataLimiteFormatada, limite];
  
  const rows = await db.query(sql, paramsSql);
  return rows;
}

module.exports = { 
  calcularConsumoMedioProduto, 
  getEstatisticasMovimentacaoPorPeriodo,
  getTopProdutosMovimentacao,
  getMovimentacaoPorLocal
};