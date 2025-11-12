const db = require("../config/database");

/**
 * Inserir nova movimentação. Se `connection` for fornecida, usar essa conexão (transação).
 * movimentacao: { tipo, produto_id, lote_id, local_origem_id, local_destino_id, quantidade, usuario_id }
 */
async function create(movimentacao, connection = null) {
  // Use transaction if no connection provided
  const useTransaction = !connection;
  let conn = connection;

  try {
    if (useTransaction) {
      conn = await db.getConnection();
      await conn.beginTransaction();
    }

    // Insert the movement record
    const sql = `INSERT INTO movimentacoes (tipo, produto_id, lote_id, local_origem_id, local_destino_id, quantidade, usuario_id, observacao, data_movimentacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    const params = [
      movimentacao.tipo,
      movimentacao.produto_id,
      movimentacao.lote_id || null,
      movimentacao.local_origem_id || null,
      movimentacao.local_destino_id || null,
      movimentacao.quantidade,
      movimentacao.usuario_id || null,
      movimentacao.observacao || null,
    ];
    const res = await db.query(sql, params, conn);
    const insertId = res.insertId || (res && res.affectedRows ? res.insertId : undefined);
    
    if (insertId) {
      // Update lot quantities based on movement type
      if (movimentacao.tipo === 'Entrada' && movimentacao.lote_id) {
        // For entries, increase the lot quantity
        const updateSql = `
          UPDATE lotes 
          SET quantidade = quantidade + ?
          WHERE id = ?
        `;
        await db.query(updateSql, [movimentacao.quantidade, movimentacao.lote_id], conn);
      } else if (movimentacao.tipo === 'Saída' && movimentacao.lote_id) {
        // For exits, decrease the lot quantity
        const updateSql = `
          UPDATE lotes 
          SET quantidade = quantidade - ?
          WHERE id = ?
        `;
        await db.query(updateSql, [movimentacao.quantidade, movimentacao.lote_id], conn);
      } else if (movimentacao.tipo === 'Transferência' && movimentacao.lote_id) {
        // For transfers, update the lot's location
        const updateLocationSql = `
          UPDATE lotes 
          SET localizacao_id = ?
          WHERE id = ?
        `;
        await db.query(updateLocationSql, [movimentacao.local_destino_id, movimentacao.lote_id], conn);
      }
      // Note: In the new schema, we no longer directly update the product's estoque_atual 
      // as it's calculated via the view from the lots table

      const rows = await db.query("SELECT * FROM movimentacoes WHERE id = ? LIMIT 1", [insertId], conn);
      
      if (useTransaction) {
        await conn.commit();
      }
      
      return rows[0] || null;
    }
    
    if (useTransaction) {
      await conn.commit();
    }
    return null;
  } catch (error) {
    if (useTransaction && conn) {
      await conn.rollback();
    }
    throw error;
  } finally {
    if (useTransaction && conn) {
      conn.release();
    }
  }
}

/**
 * Calcula estoque atual para produto/local via SQL.
 * Retorna number.
 */
async function getEstoqueAtual(produtoId, localId, connection = null) {
  // In the new lot-based system, we calculate stock by summing lot quantities
  // where the lot's location matches the requested location
  const sql = `
    SELECT COALESCE(SUM(l.quantidade), 0) AS estoque_atual
    FROM lotes l
    WHERE l.produto_id = ? AND l.localizacao_id = ?
  `;
  const params = [produtoId, localId];
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
    SELECT COALESCE(SUM(l.quantidade), 0) AS estoque_atual
    FROM lotes l
    WHERE l.produto_id = ? AND l.localizacao_id = ?
  `;
  const params = [produtoId, localId];
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
      loc.id AS local_id,
      loc.nome AS local_nome,
      COALESCE(SUM(lt.quantidade), 0) AS estoque_atual
    FROM produtos p
    CROSS JOIN locais loc
    LEFT JOIN lotes lt ON lt.produto_id = p.id AND lt.localizacao_id = loc.id
    WHERE p.status = 'Disponível' AND loc.status = 'Ativo'
  `;
  
  const queryParams = [];
  
  // Adicionar filtros se fornecidos
  if (produto_id) {
    sql += " AND p.id = ?";
    queryParams.push(produto_id);
  }
  
  if (local_id) {
    sql += " AND loc.id = ?";
    queryParams.push(local_id);
  }
  
  sql += " GROUP BY p.id, p.nome, loc.id, loc.nome HAVING estoque_atual > 0";
  
  const rows = await db.query(sql, queryParams, connection);
  return rows;
}

module.exports = { create, getEstoqueAtual, getMovimentacoesByProduto, getMovimentacoesByLocal, getEstoqueAtualByProdutoLocal, getEstoqueAtualTodos };
