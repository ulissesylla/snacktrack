const db = require("../config/database");

async function findAll({ onlyAvailable = true } = {}) {
  const sql = onlyAvailable
    ? "SELECT id, nome, descricao, preco, unidade_medida, categoria, estoque_minimo, fabricante, tipo, data_validade, status, data_criacao FROM produtos WHERE status = ? ORDER BY id DESC"
    : "SELECT id, nome, descricao, preco, unidade_medida, categoria, estoque_minimo, fabricante, tipo, data_validade, status, data_criacao FROM produtos ORDER BY id DESC";
  const params = onlyAvailable ? ["Disponível"] : [];
  const rows = await db.query(sql, params);
  return rows;
}

async function findById(id) {
  const sql =
    "SELECT id, nome, descricao, preco, unidade_medida, categoria, estoque_minimo, fabricante, tipo, data_validade, status, data_criacao FROM produtos WHERE id = ? LIMIT 1";
  const rows = await db.query(sql, [id]);
  return rows[0] || null;
}

async function create(payload) {
  const sql =
    "INSERT INTO produtos (nome, descricao, preco, unidade_medida, categoria, estoque_minimo, fabricante, tipo, data_validade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const params = [
    payload.nome,
    payload.descricao || null,
    payload.preco || null,
    payload.unidade_medida || "unidade",
    payload.categoria || null,
    payload.estoque_minimo || 0,
    payload.fabricante || null,
    payload.tipo || "Matéria-prima",
    payload.data_validade || null,
  ];
  const res = await db.query(sql, params);
  const insertId =
    res.insertId || (res && res.affectedRows ? res.insertId : undefined);
  if (insertId) return findById(insertId);
  const rows = await db.query(
    "SELECT * FROM produtos WHERE nome = ? ORDER BY id DESC LIMIT 1",
    [payload.nome]
  );
  return rows[0] || null;
}

async function update(id, payload) {
  const sets = [];
  const params = [];
  const fields = [
    "nome",
    "descricao",
    "preco",
    "unidade_medida",
    "categoria",
    "estoque_minimo",
    "fabricante",
    "tipo",
    "data_validade",
    "status",
  ];
  fields.forEach((f) => {
    if (typeof payload[f] !== "undefined") {
      sets.push(`${f} = ?`);
      params.push(payload[f]);
    }
  });
  if (!sets.length) return findById(id);
  const sql = `UPDATE produtos SET ${sets.join(", ")} WHERE id = ?`;
  params.push(id);
  await db.query(sql, params);
  return findById(id);
}

async function inactivate(id) {
  const sql = "UPDATE produtos SET status = ? WHERE id = ?";
  await db.query(sql, ["Indisponível", id]);
  return findById(id);
}

module.exports = { findAll, findById, create, update, inactivate };
