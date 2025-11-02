const localData = require("../data/localData");

function validateInput({ nome, capacidade_maxima, descricao } = {}) {
  const errors = [];
  if (!nome || String(nome).trim().length < 2)
    errors.push("Nome é obrigatório e deve ter ao menos 2 caracteres");
  if (typeof capacidade_maxima !== "undefined" && capacidade_maxima !== null) {
    const v = Number(capacidade_maxima);
    if (Number.isNaN(v) || v <= 0)
      errors.push("capacidade_maxima deve ser um número positivo");
  }
  return errors;
}

async function listarTodos({ onlyActive = true } = {}) {
  return localData.findAll({ onlyActive });
}

async function buscarPorId(id) {
  const local = await localData.findById(id);
  if (!local) throw { status: 404, message: "Local não encontrado" };
  return local;
}

async function criar({
  nome,
  capacidade_maxima = null,
  descricao = null,
} = {}) {
  const errors = validateInput({ nome, capacidade_maxima, descricao });
  if (errors.length) throw { status: 400, message: errors.join("; ") };
  const created = await localData.create({
    nome,
    capacidade_maxima,
    descricao,
  });
  return created;
}

async function atualizar(id, payload = {}) {
  const existing = await localData.findById(id);
  if (!existing) throw { status: 404, message: "Local não encontrado" };
  const errors = validateInput(payload);
  if (errors.length) throw { status: 400, message: errors.join("; ") };
  const updated = await localData.update(id, payload);
  return updated;
}

async function inativar(id) {
  const existing = await localData.findById(id);
  if (!existing) throw { status: 404, message: "Local não encontrado" };
  // future: check inventory items linked to this local
  const updated = await localData.inactivate(id);
  return updated;
}

module.exports = { listarTodos, buscarPorId, criar, atualizar, inativar };
