const db = require("../config/database");

async function findByEmail(email) {
  const rows = await db.query(
    "SELECT * FROM usuarios WHERE email = ? LIMIT 1",
    [email]
  );
  return rows && rows.length ? rows[0] : null;
}

async function findById(id) {
  const rows = await db.query(
    "SELECT id, nome, email, funcao, status, data_criacao FROM usuarios WHERE id = ? LIMIT 1",
    [id]
  );
  return rows && rows.length ? rows[0] : null;
}

async function findAll() {
  const rows = await db.query(
    "SELECT id, nome, email, funcao, status FROM usuarios"
  );
  return rows;
}

async function insert({ nome, email, senha, funcao }) {
  const res = await db.query(
    "INSERT INTO usuarios (nome, email, senha, funcao) VALUES (?, ?, ?, ?)",
    [nome, email, senha, funcao]
  );
  return res && res.insertId ? res.insertId : null;
}

async function update(id, data) {
  const sets = [];
  const params = [];
  Object.keys(data).forEach((k) => {
    sets.push(`${k} = ?`);
    params.push(data[k]);
  });
  if (!sets.length) return;
  params.push(id);
  await db.query(`UPDATE usuarios SET ${sets.join(", ")} WHERE id = ?`, params);
}

async function softDelete(id) {
  await db.query("UPDATE usuarios SET status = ? WHERE id = ?", [
    "Inativo",
    id,
  ]);
}

module.exports = { findByEmail, findById, findAll, insert, update, softDelete };
