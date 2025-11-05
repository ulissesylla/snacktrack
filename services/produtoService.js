const produtoData = require("../data/produtoData");

const UNIDADES = ["unidade", "kg", "litro"];
const CATEGORIAS = ["doce", "salgado", "bebida", "matéria-prima"];
const TIPOS = ["Matéria-prima", "Produto semiacabado", "Produto acabado"];

function validateInput(payload = {}, { isUpdate = false } = {}) {
  const errors = [];
  if (!isUpdate || typeof payload.nome !== "undefined") {
    if (!payload.nome || String(payload.nome).trim().length < 2)
      errors.push("nome é obrigatório e deve ter ao menos 2 caracteres");
  }
  // Prevent estoque_atual from being set manually as it's a calculated field
  if (typeof payload.estoque_atual !== "undefined") {
    errors.push("estoque_atual não pode ser definido manualmente");
  }
  // preco: obrigatório no create, opcional no update. Quando presente deve ser positivo
  if (!isUpdate) {
    if (
      payload.preco === undefined ||
      payload.preco === null ||
      payload.preco === ""
    ) {
      errors.push("preco é obrigatório");
    }
  }
  if (
    typeof payload.preco !== "undefined" &&
    payload.preco !== null &&
    payload.preco !== ""
  ) {
    const v = Number(payload.preco);
    if (Number.isNaN(v) || v <= 0)
      errors.push("preco deve ser número positivo");
  }
  if (
    typeof payload.estoque_minimo !== "undefined" &&
    payload.estoque_minimo !== null
  ) {
    const v = Number(payload.estoque_minimo);
    if (Number.isNaN(v) || v < 0)
      errors.push("estoque_minimo deve ser número não negativo");
  }
  if (
    typeof payload.unidade_medida !== "undefined" &&
    payload.unidade_medida !== null
  ) {
    if (!UNIDADES.includes(payload.unidade_medida))
      errors.push("unidade_medida inválida");
  }
  if (typeof payload.categoria !== "undefined" && payload.categoria !== null) {
    if (!CATEGORIAS.includes(payload.categoria))
      errors.push("categoria inválida");
  }
  if (typeof payload.tipo !== "undefined" && payload.tipo !== null) {
    if (!TIPOS.includes(payload.tipo)) errors.push("tipo inválido");
  }
  if (
    typeof payload.data_validade !== "undefined" &&
    payload.data_validade !== null &&
    payload.data_validade !== ""
  ) {
    const d = new Date(payload.data_validade);
    if (isNaN(d.getTime())) errors.push("data_validade inválida");
    else {
      const now = new Date();
      // allow today or future
      if (d < new Date(now.toDateString()))
        errors.push("data_validade deve ser hoje ou no futuro");
    }
  }
  return errors;
}

async function listarTodos({ onlyAvailable = true } = {}) {
  return produtoData.findAll({ onlyAvailable });
}

async function buscarPorId(id) {
  const p = await produtoData.findById(id);
  if (!p) throw { status: 404, message: "Produto não encontrado" };
  return p;
}

async function criar(payload = {}) {
  const errors = validateInput(payload, { isUpdate: false });
  if (errors.length) throw { status: 400, message: errors.join("; ") };
  const created = await produtoData.create(payload);
  return created;
}

async function atualizar(id, payload = {}) {
  const existing = await produtoData.findById(id);
  if (!existing) throw { status: 404, message: "Produto não encontrado" };
  const errors = validateInput(payload, { isUpdate: true });
  if (errors.length) throw { status: 400, message: errors.join("; ") };
  const updated = await produtoData.update(id, payload);
  return updated;
}

async function inativar(id) {
  const existing = await produtoData.findById(id);
  if (!existing) throw { status: 404, message: "Produto não encontrado" };
  // future: ensure no active movimentacoes
  const updated = await produtoData.inactivate(id);
  return updated;
}

module.exports = { listarTodos, buscarPorId, criar, atualizar, inativar };
