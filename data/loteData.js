const db = require("../config/database");

function normalizeDate(val) {
  if (val === undefined || val === null || val === "") return null;
  // Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(val);
  // ISO with time e.g. 2025-11-27T03:00:00.000Z -> take date part
  if (s.indexOf("T") !== -1) return s.split("T")[0];
  // datetime with space e.g. 2025-11-27 03:00:00
  if (s.indexOf(" ") !== -1) return s.split(" ")[0];
  // otherwise assume already YYYY-MM-DD or similar; return as-is
  return s;
}

/**
 * Obter todos os lotes
 * @param {Object} params - Parâmetros de consulta
 * @param {number} params.produto_id - ID do produto (opcional)
 * @param {boolean} params.withExpired - Incluir lotes vencidos (padrão: true)
 * @returns {Array} Lista de lotes
 */
async function findAll({ produto_id, withExpired = true } = {}) {
  let sql = `
    SELECT l.*, p.nome as produto_nome, loc.nome as local_nome
    FROM lotes l
    JOIN produtos p ON l.produto_id = p.id
    LEFT JOIN locais loc ON l.localizacao_id = loc.id
  `;
  
  const params = [];
  const conditions = [];
  
  if (produto_id) {
    conditions.push("l.produto_id = ?");
    params.push(produto_id);
  }
  
  if (!withExpired) {
    conditions.push("(l.data_validade IS NULL OR l.data_validade >= CURDATE())");
  }
  
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  
  sql += " ORDER BY l.data_validade ASC, l.data_entrada ASC";
  
  const rows = await db.query(sql, params);
  return rows;
}

/**
 * Obter lote por ID
 * @param {number} id - ID do lote
 * @returns {Object|null} Lote encontrado ou null
 */
async function findById(id) {
  const sql = `
    SELECT l.*, p.nome as produto_nome, loc.nome as local_nome
    FROM lotes l
    JOIN produtos p ON l.produto_id = p.id
    LEFT JOIN locais loc ON l.localizacao_id = loc.id
    WHERE l.id = ?
    LIMIT 1
  `;
  const rows = await db.query(sql, [id]);
  return rows[0] || null;
}

/**
 * Criar novo lote
 * @param {Object} payload - Dados do lote
 * @returns {Object} Lote criado
 */
async function create(payload) {
  const sql = `
    INSERT INTO lotes (produto_id, numero_lote, quantidade, data_validade, data_fabricacao, localizacao_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const safeDataValidade = normalizeDate(payload.data_validade);
  const safeDataFabricacao = normalizeDate(payload.data_fabricacao);
  
  const params = [
    payload.produto_id,
    payload.numero_lote,
    payload.quantidade || 0,
    safeDataValidade,
    safeDataFabricacao,
    payload.localizacao_id || null
  ];
  
  const res = await db.query(sql, params);
  const insertId = res.insertId || (res && res.affectedRows ? res.insertId : undefined);
  
  if (insertId) return findById(insertId);
  
  // Se o insertId não estiver disponível, buscar pelo número de lote e produto
  const checkSql = `
    SELECT l.*, p.nome as produto_nome, loc.nome as local_nome
    FROM lotes l
    JOIN produtos p ON l.produto_id = p.id
    LEFT JOIN locais loc ON l.localizacao_id = loc.id
    WHERE l.numero_lote = ? AND l.produto_id = ?
    ORDER BY l.id DESC
    LIMIT 1
  `;
  
  const checkRows = await db.query(checkSql, [payload.numero_lote, payload.produto_id]);
  return checkRows[0] || null;
}

/**
 * Atualizar lote existente
 * @param {number} id - ID do lote
 * @param {Object} payload - Dados para atualizar
 * @returns {Object} Lote atualizado
 */
async function update(id, payload) {
  const sets = [];
  const params = [];
  
  if (typeof payload.numero_lote !== "undefined") {
    sets.push("numero_lote = ?");
    params.push(payload.numero_lote);
  }
  
  if (typeof payload.quantidade !== "undefined") {
    sets.push("quantidade = ?");
    params.push(payload.quantidade);
  }
  
  if (typeof payload.data_validade !== "undefined") {
    sets.push("data_validade = ?");
    params.push(normalizeDate(payload.data_validade));
  }
  
  if (typeof payload.data_fabricacao !== "undefined") {
    sets.push("data_fabricacao = ?");
    params.push(normalizeDate(payload.data_fabricacao));
  }
  
  if (typeof payload.localizacao_id !== "undefined") {
    sets.push("localizacao_id = ?");
    params.push(payload.localizacao_id === "" ? null : payload.localizacao_id);
  }
  
  if (!sets.length) return findById(id);
  
  const sql = `UPDATE lotes SET ${sets.join(", ")} WHERE id = ?`;
  params.push(id);
  
  await db.query(sql, params);
  return findById(id);
}

/**
 * Inativar/excluir lote (atualmente apenas uma atualização lógica se necessário)
 * @param {number} id - ID do lote
 * @returns {Object} Lote atualizado
 */
async function remove(id) {
  // Para manter consistência com o sistema, vamos apenas remover o registro
  const sql = "DELETE FROM lotes WHERE id = ?";
  await db.query(sql, [id]);
  
  // Verificar se foi excluído
  const checkSql = "SELECT COUNT(*) as count FROM lotes WHERE id = ?";
  const [result] = await db.query(checkSql, [id]);
  return result.count === 0; // Retorna true se foi realmente removido
}

/**
 * Obter lotes por produto
 * @param {number} produtoId - ID do produto
 * @param {Object} options - Opções de filtragem
 * @returns {Array} Lista de lotes do produto
 */
async function findByProduto(produtoId, { withExpired = true } = {}) {
  let sql = `
    SELECT l.*, p.nome as produto_nome, loc.nome as local_nome
    FROM lotes l
    JOIN produtos p ON l.produto_id = p.id
    LEFT JOIN locais loc ON l.localizacao_id = loc.id
    WHERE l.produto_id = ?
  `;
  
  const params = [produtoId];
  
  if (!withExpired) {
    sql += " AND (l.data_validade IS NULL OR l.data_validade >= CURDATE())";
  }
  
  sql += " ORDER BY l.data_validade ASC, l.data_entrada ASC";
  
  const rows = await db.query(sql, params);
  return rows;
}

/**
 * Obter lotes com estoque baixo
 * @param {number} diasValidade - Dias para considerar como "próximo do vencimento"
 * @returns {Array} Lista de lotes próximos do vencimento
 */
async function getLotesProximosValidade(diasValidade = 7) {
  const sql = `
    SELECT l.*, p.nome as produto_nome, loc.nome as local_nome
    FROM lotes l
    JOIN produtos p ON l.produto_id = p.id
    LEFT JOIN locais loc ON l.localizacao_id = loc.id
    WHERE l.data_validade IS NOT NULL
      AND l.data_validade <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      AND l.data_validade >= CURDATE()
      AND l.quantidade > 0
    ORDER BY l.data_validade ASC
  `;
  
  const rows = await db.query(sql, [diasValidade]);
  return rows;
}

/**
 * Obter lotes vencidos
 * @returns {Array} Lista de lotes vencidos
 */
async function getLotesVencidos() {
  const sql = `
    SELECT l.*, p.nome as produto_nome, loc.nome as local_nome
    FROM lotes l
    JOIN produtos p ON l.produto_id = p.id
    LEFT JOIN locais loc ON l.localizacao_id = loc.id
    WHERE l.data_validade IS NOT NULL
      AND l.data_validade < CURDATE()
      AND l.quantidade > 0
    ORDER BY l.data_validade ASC
  `;
  
  const rows = await db.query(sql);
  return rows;
}

module.exports = { 
  findAll, 
  findById, 
  create, 
  update, 
  remove,
  findByProduto,
  getLotesProximosValidade,
  getLotesVencidos 
};