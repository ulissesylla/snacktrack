const bcrypt = require("bcrypt");
const userData = require("../data/userData");

async function createUser({ nome, email, senha, funcao = "Colaborador" }) {
  if (!nome || !email || !senha) throw new Error("Missing fields");
  const existing = await userData.findByEmail(email);
  if (existing) throw new Error("Email already registered");
  const hash = await bcrypt.hash(senha, 10);
  const id = await userData.insert({ nome, email, senha: hash, funcao });
  return { id, nome, email, funcao };
}

async function getUserByEmail(email) {
  return userData.findByEmail(email);
}

async function getAllUsers() {
  return userData.findAll();
}

async function updateUser(id, payload) {
  const allowed = ["nome", "email", "funcao", "status"];
  const data = {};
  allowed.forEach((k) => {
    if (k in payload) data[k] = payload[k];
  });
  await userData.update(id, data);
  const updated = await userData.findById(id);
  return updated;
}

async function deleteUser(id) {
  await userData.softDelete(id);
}

module.exports = {
  createUser,
  getUserByEmail,
  getAllUsers,
  updateUser,
  deleteUser,
};
