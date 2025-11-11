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

async function findAll({ onlyAvailable = true } = {}) {
  const sql = onlyAvailable
    ? "SELECT p.id, p.nome, p.descricao, p.preco, p.unidade_medida, p.categoria, p.estoque_minimo, p.fabricante, p.tipo, p.status, p.data_criacao, COALESCE(v.estoque_atual, 0) as estoque_atual FROM produtos p LEFT JOIN estoque_atual_produtos v ON p.id = v.produto_id WHERE p.status = ? ORDER BY p.id DESC"
    : "SELECT p.id, p.nome, p.descricao, p.preco, p.unidade_medida, p.categoria, p.estoque_minimo, p.fabricante, p.tipo, p.status, p.data_criacao, COALESCE(v.estoque_atual, 0) as estoque_atual FROM produtos p LEFT JOIN estoque_atual_produtos v ON p.id = v.produto_id ORDER BY p.id DESC";
  const params = onlyAvailable ? ["Disponível"] : [];
  const rows = await db.query(sql, params);
  return rows;
}

async function findById(id) {
  const sql =
    "SELECT p.id, p.nome, p.descricao, p.preco, p.unidade_medida, p.categoria, p.estoque_minimo, p.fabricante, p.tipo, p.status, p.data_criacao, COALESCE(v.estoque_atual, 0) as estoque_atual FROM produtos p LEFT JOIN estoque_atual_produtos v ON p.id = v.produto_id WHERE p.id = ? LIMIT 1";
  const rows = await db.query(sql, [id]);
  return rows[0] || null;
}

async function create(payload) {
  // allow optional status on create; default DB will handle if not provided
  const sql = payload.status
    ? "INSERT INTO produtos (nome, descricao, preco, unidade_medida, categoria, estoque_minimo, fabricante, tipo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    : "INSERT INTO produtos (nome, descricao, preco, unidade_medida, categoria, estoque_minimo, fabricante, tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  const params = payload.status
    ? [
        payload.nome,
        payload.descricao || null,
        payload.preco || null,
        payload.unidade_medida || "unidade",
        payload.categoria || null,
        payload.estoque_minimo || 0,
        payload.fabricante || null,
        payload.tipo || "Matéria-prima",
        payload.status,
      ]
    : [
        payload.nome,
        payload.descricao || null,
        payload.preco || null,
        payload.unidade_medida || "unidade",
        payload.categoria || null,
        payload.estoque_minimo || 0,
        payload.fabricante || null,
        payload.tipo || "Matéria-prima",
      ];
  const res = await db.query(sql, params);
  const insertId =
    res.insertId || (res && res.affectedRows ? res.insertId : undefined);
  if (insertId) return findById(insertId);
  const rows = await db.query(
    "SELECT p.id, p.nome, p.descricao, p.preco, p.unidade_medida, p.categoria, p.estoque_minimo, p.fabricante, p.tipo, p.status, p.data_criacao, COALESCE(v.estoque_atual, 0) as estoque_atual FROM produtos p LEFT JOIN estoque_atual_produtos v ON p.id = v.produto_id WHERE p.nome = ? ORDER BY p.id DESC LIMIT 1",
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
    "status",
  ];
  fields.forEach((f) => {
    if (typeof payload[f] !== "undefined") {
      sets.push(`${f} = ?`);
      if (payload[f] === "") {
        params.push(null);
      } else {
        params.push(payload[f]);
      }
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
