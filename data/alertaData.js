const db = require("../config/database");

/**
 * Criar um novo alerta
 * @param {Object} alertaData - Dados do alerta
 * @param {string} alertaData.tipo - Tipo do alerta
 * @param {number} alertaData.produto_id - ID do produto
 * @param {number} alertaData.lote_id - ID do lote (opcional)
 * @param {string} alertaData.mensagem - Mensagem do alerta
 * @param {boolean} alertaData.lida - Status de leitura (padrão: false)
 */
async function create(alertaData) {
  const sql = `INSERT INTO alertas (tipo, produto_id, lote_id, mensagem, lida) VALUES (?, ?, ?, ?, ?)`;
  const params = [
    alertaData.tipo,
    alertaData.produto_id,
    alertaData.lote_id || null,
    alertaData.mensagem,
    alertaData.lida !== undefined ? alertaData.lida : false
  ];
  
  const result = await db.query(sql, params);
  const insertId = result.insertId || (result && result.affectedRows ? result.insertId : undefined);
  
  if (insertId) {
    const rows = await db.query("SELECT * FROM alertas WHERE id = ? LIMIT 1", [insertId]);
    return rows[0] || null;
  }
  return null;
}

/**
 * Buscar alerta específico para evitar duplicatas
 * @param {number} produto_id - ID do produto
 * @param {string} tipo - Tipo do alerta
 * @param {number} local_id - ID do local (opcional)
 * @param {number} lote_id - ID do lote (opcional)
 */
async function findByProdutoLocalTipo(produto_id, tipo, local_id = null, lote_id = null) {
  let sql = "SELECT * FROM alertas WHERE produto_id = ? AND tipo = ? AND lida = FALSE";
  const params = [produto_id, tipo];
  
  if (local_id) {
    sql += " AND local_id = ?"; // Ajustar se for adicionado local_id na tabela
    params.push(local_id);
  }
  
  if (lote_id) {
    sql += " AND lote_id = ?";
    params.push(lote_id);
  }
  
  sql += " LIMIT 1";
  
  const rows = await db.query(sql, params);
  return rows[0] || null;
}

/**
 * Listar alertas com filtros
 * @param {Object} filters - Filtros de busca
 * @param {string} filters.tipo - Filtrar por tipo de alerta
 * @param {boolean} filters.lido - Filtrar por status de leitura
 * @param {number} filters.produto_id - Filtrar por produto
 * @param {number} filters.lote_id - Filtrar por lote (opcional)
 */
async function findAll(filters = {}) {
  let sql = `SELECT a.id, a.tipo, a.produto_id, a.lote_id, a.mensagem, a.lida, a.data_alerta,
                    p.nome as produto_nome,
                    l.numero_lote
             FROM alertas a
             LEFT JOIN produtos p ON a.produto_id = p.id
             LEFT JOIN lotes l ON a.lote_id = l.id
             WHERE 1=1`;
  const params = [];
  
  if (filters.tipo) {
    sql += " AND a.tipo = ?";
    params.push(filters.tipo);
  }
  
  if (filters.lido !== undefined && filters.lido !== null) {
    sql += " AND a.lida = ?";
    params.push(filters.lido);
  }
  
  if (filters.produto_id) {
    sql += " AND a.produto_id = ?";
    params.push(filters.produto_id);
  }
  
  if (filters.lote_id) {
    sql += " AND a.lote_id = ?";
    params.push(filters.lote_id);
  }
  
  sql += " ORDER BY a.data_alerta DESC";
  
  const rows = await db.query(sql, params);
  return rows;
}

/**
 * Atualizar alerta (marcar como lido)
 * @param {number} id - ID do alerta
 * @param {Object} updates - Campos para atualizar
 */
async function update(id, updates) {
  const sets = [];
  const params = [];
  
  if (updates.lida !== undefined) {
    sets.push("lida = ?");
    params.push(updates.lida);
  }
  
  if (updates.mensagem) {
    sets.push("mensagem = ?");
    params.push(updates.mensagem);
  }
  
  if (!sets.length) return findById(id); // nothing to update
  
  const sql = `UPDATE alertas SET ${sets.join(", ")} WHERE id = ?`;
  params.push(id);
  
  await db.query(sql, params);
  return findById(id);
}

/**
 * Buscar alerta por ID
 * @param {number} id - ID do alerta
 */
async function findById(id) {
  const sql = `SELECT a.id, a.tipo, a.produto_id, a.lote_id, a.mensagem, a.lida, a.data_alerta,
                      p.nome as produto_nome,
                      l.numero_lote
               FROM alertas a
               LEFT JOIN produtos p ON a.produto_id = p.id
               LEFT JOIN lotes l ON a.lote_id = l.id
               WHERE a.id = ? LIMIT 1`;
  const rows = await db.query(sql, [id]);
  return rows[0] || null;
}

/**
 * Contar alertas não lidos
 */
async function countNaoLidos() {
  const sql = "SELECT COUNT(*) as count FROM alertas WHERE lida = FALSE";
  const rows = await db.query(sql);
  return rows[0]?.count || 0;
}

/**
 * Remover alertas antigos (opcional, para manutenção)
 * @param {Date} dataLimite - Data limite para remoção
 */
async function deleteOld(dataLimite) {
  const sql = "DELETE FROM alertas WHERE data_alerta < ?";
  const params = [dataLimite];
  return await db.query(sql, params);
}

module.exports = { 
  create, 
  findByProdutoLocalTipo, 
  findAll, 
  update, 
  findById, 
  countNaoLidos,
  deleteOld
};