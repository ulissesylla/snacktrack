const db = require("../config/database");

/**
 * Buscar movimentações com filtros
 * @param {Object} filters - Filtros de busca
 * @param {string} filters.data_inicio - Data inicial (formato YYYY-MM-DD)
 * @param {string} filters.data_fim - Data final (formato YYYY-MM-DD)
 * @param {number} filters.produto_id - ID do produto
 * @param {string} filters.tipo - Tipo de movimentação
 * @param {number} filters.local_id - ID do local (origem ou destino)
 * @param {number} filters.offset - Offset para paginação
 * @param {number} filters.limit - Limite de registros
 * @returns {Array} Lista de movimentações com nomes formatados
 */
async function findByFilters(filters = {}) {
  let sql = `
    SELECT 
      m.id,
      m.data_movimentacao,
      m.tipo,
      m.produto_id,
      p.nome AS produto_nome,
      m.quantidade,
      m.local_origem_id,
      l1.nome AS local_origem_nome,
      m.local_destino_id,
      l2.nome AS local_destino_nome,
      m.usuario_id,
      u.nome AS usuario_nome
    FROM movimentacoes m
    LEFT JOIN produtos p ON m.produto_id = p.id
    LEFT JOIN locais l1 ON m.local_origem_id = l1.id
    LEFT JOIN locais l2 ON m.local_destino_id = l2.id
    LEFT JOIN usuarios u ON m.usuario_id = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  // Aplicar filtros
  if (filters.data_inicio && filters.data_fim) {
    sql += " AND m.data_movimentacao BETWEEN ? AND ?";
    params.push(filters.data_inicio + ' 00:00:00');
    params.push(filters.data_fim + ' 23:59:59');
  } else if (filters.data_inicio) {
    sql += " AND m.data_movimentacao >= ?";
    params.push(filters.data_inicio + ' 00:00:00');
  } else if (filters.data_fim) {
    sql += " AND m.data_movimentacao <= ?";
    params.push(filters.data_fim + ' 23:59:59');
  }
  
  if (filters.produto_id) {
    sql += " AND m.produto_id = ?";
    params.push(filters.produto_id);
  }
  
  if (filters.tipo) {
    sql += " AND m.tipo = ?";
    params.push(filters.tipo);
  }
  
  if (filters.local_id) {
    sql += " AND (m.local_origem_id = ? OR m.local_destino_id = ?)";
    params.push(filters.local_id);
    params.push(filters.local_id);
  }
  
  // Ordenação padrão: data_movimentacao decrescente
  sql += " ORDER BY m.data_movimentacao DESC";
  
  // Paginação
  if (filters.limit) {
    sql += " LIMIT ?";
    params.push(filters.limit);
    
    if (filters.offset) {
      sql += " OFFSET ?";
      params.push(filters.offset);
    }
  }
  
  const rows = await db.query(sql, params);
  return rows;
}

/**
 * Contar movimentações com filtros para paginação
 * @param {Object} filters - Filtros de contagem
 * @returns {number} Total de registros
 */
async function countByFilters(filters = {}) {
  let sql = `
    SELECT COUNT(*) as count
    FROM movimentacoes m
    LEFT JOIN produtos p ON m.produto_id = p.id
    LEFT JOIN locais l1 ON m.local_origem_id = l1.id
    LEFT JOIN locais l2 ON m.local_destino_id = l2.id
    LEFT JOIN usuarios u ON m.usuario_id = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  // Aplicar os mesmos filtros
  if (filters.data_inicio && filters.data_fim) {
    sql += " AND m.data_movimentacao BETWEEN ? AND ?";
    params.push(filters.data_inicio + ' 00:00:00');
    params.push(filters.data_fim + ' 23:59:59');
  } else if (filters.data_inicio) {
    sql += " AND m.data_movimentacao >= ?";
    params.push(filters.data_inicio + ' 00:00:00');
  } else if (filters.data_fim) {
    sql += " AND m.data_movimentacao <= ?";
    params.push(filters.data_fim + ' 23:59:59');
  }
  
  if (filters.produto_id) {
    sql += " AND m.produto_id = ?";
    params.push(filters.produto_id);
  }
  
  if (filters.tipo) {
    sql += " AND m.tipo = ?";
    params.push(filters.tipo);
  }
  
  if (filters.local_id) {
    sql += " AND (m.local_origem_id = ? OR m.local_destino_id = ?)";
    params.push(filters.local_id);
    params.push(filters.local_id);
  }
  
  const rows = await db.query(sql, params);
  return rows[0]?.count || 0;
}

module.exports = { findByFilters, countByFilters };