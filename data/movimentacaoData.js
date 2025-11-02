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

module.exports = { create, getEstoqueAtual, getMovimentacoesByProduto, getMovimentacoesByLocal, getEstoqueAtualByProdutoLocal };
