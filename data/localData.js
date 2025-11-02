const db = require("../config/database");

async function findAll({ onlyActive = true } = {}) {
  const sql = onlyActive
    ? "SELECT id, nome, capacidade_maxima, descricao, status, data_criacao FROM locais WHERE status = ? ORDER BY id DESC"
    : "SELECT id, nome, capacidade_maxima, descricao, status, data_criacao FROM locais ORDER BY id DESC";
  const params = onlyActive ? ["Ativo"] : [];
  const rows = await db.query(sql, params);
  return rows;
}

async function findById(id) {
  const sql =
    "SELECT id, nome, capacidade_maxima, descricao, status, data_criacao FROM locais WHERE id = ? LIMIT 1";
  const rows = await db.query(sql, [id]);
  return rows[0] || null;
}

async function create({ nome, capacidade_maxima = null, descricao = null }) {
  const sql =
    "INSERT INTO locais (nome, capacidade_maxima, descricao) VALUES (?, ?, ?)";
  const res = await db.query(sql, [nome, capacidade_maxima, descricao]);
  // mysql2 returns an OKPacket for inserts when using execute; query wrapper returns rows, so try to fetch by last insert id
  const insertId =
    res.insertId || (res && res.affectedRows ? res.insertId : undefined);
  if (insertId) return findById(insertId);
  // fallback: return the created row by the best effort (last inserted with same name)
  const rows = await db.query(
    "SELECT * FROM locais WHERE nome = ? ORDER BY id DESC LIMIT 1",
    [nome]
  );
  return rows[0] || null;
}

async function update(
  id,
  { nome, capacidade_maxima = null, descricao = null, status }
) {
  // build dynamic set
  const sets = [];
  const params = [];
  if (typeof nome !== "undefined") {
    sets.push("nome = ?");
    params.push(nome);
  }
  if (typeof capacidade_maxima !== "undefined") {
    sets.push("capacidade_maxima = ?");
    params.push(capacidade_maxima);
  }
  if (typeof descricao !== "undefined") {
    sets.push("descricao = ?");
    params.push(descricao);
  }
  if (typeof status !== "undefined") {
    sets.push("status = ?");
    params.push(status);
  }
  if (!sets.length) return findById(id);
  const sql = `UPDATE locais SET ${sets.join(", ")} WHERE id = ?`;
  params.push(id);
  await db.query(sql, params);
  return findById(id);
}

async function inactivate(id) {
  const sql = "UPDATE locais SET status = ? WHERE id = ?";
  await db.query(sql, ["Inativo", id]);
  return findById(id);
}

module.exports = { findAll, findById, create, update, inactivate };
