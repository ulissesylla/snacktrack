const db = require("../config/database");

/**
 * Inserir nova movimentação. Se `connection` for fornecida, usar essa conexão (transação).
 * movimentacao: { tipo, produto_id, local_origem_id, local_destino_id, quantidade, usuario_id }
 */
async function create(movimentacao, connection = null) {
  const sql = `INSERT INTO movimentacoes (tipo, produto_id, local_origem_id, local_destino_id, quantidade, usuario_id, data_movimentacao) VALUES (?, ?, ?, ?, ?, ?, NOW())`;
  const params = [
    movimentacao.tipo,
    movimentacao.produto_id,
    movimentacao.local_origem_id || null,
    movimentacao.local_destino_id || null,
    movimentacao.quantidade,
    movimentacao.usuario_id || null,
  ];
  const res = await db.query(sql, params, connection);
  const insertId = res.insertId || (res && res.affectedRows ? res.insertId : undefined);
  if (insertId) {
    const rows = await db.query("SELECT * FROM movimentacoes WHERE id = ? LIMIT 1", [insertId], connection);
    return rows[0] || null;
  }
  return null;
}

/**
 * Calcula estoque atual para produto/local via SQL.
 * Retorna number.
 */
async function getEstoqueAtual(produtoId, localId, connection = null) {
  const sql = `
    SELECT COALESCE(SUM(CASE
      WHEN tipo = 'Entrada' AND local_destino_id = ? THEN quantidade
      WHEN tipo = 'Saída' AND local_origem_id = ? THEN -quantidade
      WHEN tipo = 'Transferência' AND local_origem_id = ? THEN -quantidade
      WHEN tipo = 'Transferência' AND local_destino_id = ? THEN quantidade
      ELSE 0 END), 0) AS estoque_atual
    FROM movimentacoes
    WHERE produto_id = ?
  `;
  const params = [localId, localId, localId, localId, produtoId];
  const rows = await db.query(sql, params, connection);
  const val = rows && rows[0] ? rows[0].estoque_atual : 0;
  return Number(val) || 0;
}

async function getMovimentacoesByProduto(produtoId, connection = null) {
  const sql = "SELECT * FROM movimentacoes WHERE produto_id = ? ORDER BY data_movimentacao DESC";
  const rows = await db.query(sql, [produtoId], connection);
  return rows;
}

async function getMovimentacoesByLocal(localId, connection = null) {
  const sql = `SELECT * FROM movimentacoes WHERE local_origem_id = ? OR local_destino_id = ? ORDER BY data_movimentacao DESC`;
  const rows = await db.query(sql, [localId, localId], connection);
  return rows;
}

// Nova função para obter estoque atual por produto e local específicos
async function getEstoqueAtualByProdutoLocal(produtoId, localId, connection = null) {
  const sql = `
    SELECT COALESCE(SUM(CASE
      WHEN tipo = 'Entrada' AND local_destino_id = ? THEN quantidade
      WHEN tipo = 'Saída' AND local_origem_id = ? THEN -quantidade
      WHEN tipo = 'Transferência' AND local_origem_id = ? THEN -quantidade
      WHEN tipo = 'Transferência' AND local_destino_id = ? THEN quantidade
      ELSE 0 END), 0) AS estoque_atual
    FROM movimentacoes
    WHERE produto_id = ?
  `;
  const params = [localId, localId, localId, localId, produtoId];
  const rows = await db.query(sql, params, connection);
  const val = rows && rows[0] ? rows[0].estoque_atual : 0;
  return Number(val) || 0;
}

/**
 * Obter estoque atual para todos os produtos em todos os locais
 * @param {Object} params - Parâmetros de consulta
 * @param {number} params.produto_id - ID do produto (opcional)
 * @param {number} params.local_id - ID do local (opcional)
 * @param {connection} connection - Conexão de banco de dados (opcional)
 * @returns {Array} Lista de estoques atuais
 */
async function getEstoqueAtualTodos(params = {}, connection = null) {
  const { produto_id, local_id } = params;
  
  let sql = `
    SELECT 
      p.id AS produto_id,
      p.nome AS produto_nome,
      l.id AS local_id,
      l.nome AS local_nome,
      COALESCE(SUM(CASE
        WHEN m.tipo = 'Entrada' AND m.local_destino_id = l.id THEN m.quantidade
        WHEN m.tipo = 'Saída' AND m.local_origem_id = l.id THEN -m.quantidade
        WHEN m.tipo = 'Transferência' AND m.local_origem_id = l.id THEN -m.quantidade
        WHEN m.tipo = 'Transferência' AND m.local_destino_id = l.id THEN m.quantidade
        ELSE 0 END), 0) AS estoque_atual
    FROM produtos p
    CROSS JOIN locais l
    LEFT JOIN movimentacoes m ON p.id = m.produto_id
    WHERE p.status = 'Disponível' AND l.status = 'Ativo'
  `;
  
  const queryParams = [];
  
  // Adicionar filtros se fornecidos
  if (produto_id) {
    sql += " AND p.id = ?";
    queryParams.push(produto_id);
  }
  
  if (local_id) {
    sql += " AND l.id = ?";
    queryParams.push(local_id);
  }
  
  sql += " GROUP BY p.id, p.nome, l.id, l.nome HAVING estoque_atual > 0";
  
  const rows = await db.query(sql, queryParams, connection);
  return rows;
}

module.exports = { create, getEstoqueAtual, getMovimentacoesByProduto, getMovimentacoesByLocal, getEstoqueAtualByProdutoLocal, getEstoqueAtualTodos };
