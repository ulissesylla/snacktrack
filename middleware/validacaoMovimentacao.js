const produtoData = require("../data/produtoData");
const localData = require("../data/localData");

async function validarBase(req, res, next) {
  const errors = [];
  const body = req.body || {};
  if (typeof body.produto_id === "undefined") errors.push({ field: "produto_id", message: "produto_id é obrigatório" });
  if (typeof body.quantidade === "undefined") errors.push({ field: "quantidade", message: "quantidade é obrigatória" });
  if (errors.length) return res.status(400).json({ error: "Dados inválidos", details: errors });
  const q = Number(body.quantidade);
  if (Number.isNaN(q) || q <= 0) return res.status(400).json({ error: "Dados inválidos", details: [{ field: "quantidade", message: "Quantidade deve ser número positivo" }] });
  next();
}

async function validarEntrada(req, res, next) {
  await validarBase(req, res, async () => {
    const { produto_id, local_id } = req.body;
    const prod = await produtoData.findById(produto_id);
    if (!prod || prod.status !== "Disponível") return res.status(400).json({ error: "Dados inválidos", details: [{ field: "produto_id", message: "Produto inválido" }] });
    const local = await localData.findById(local_id);
    if (!local || local.status !== "Ativo") return res.status(400).json({ error: "Dados inválidos", details: [{ field: "local_id", message: "Local inválido" }] });
    next();
  });
}

async function validarSaida(req, res, next) {
  await validarBase(req, res, async () => {
    const { produto_id, local_id } = req.body;
    const prod = await produtoData.findById(produto_id);
    if (!prod || prod.status !== "Disponível") return res.status(400).json({ error: "Dados inválidos", details: [{ field: "produto_id", message: "Produto inválido" }] });
    const local = await localData.findById(local_id);
    if (!local || local.status !== "Ativo") return res.status(400).json({ error: "Dados inválidos", details: [{ field: "local_id", message: "Local inválido" }] });
    next();
  });
}

async function validarTransferencia(req, res, next) {
  const body = req.body || {};
  const errors = [];
  if (typeof body.produto_id === "undefined") errors.push({ field: "produto_id", message: "produto_id é obrigatório" });
  if (typeof body.local_origem_id === "undefined") errors.push({ field: "local_origem_id", message: "local_origem_id é obrigatório" });
  if (typeof body.local_destino_id === "undefined") errors.push({ field: "local_destino_id", message: "local_destino_id é obrigatório" });
  if (typeof body.quantidade === "undefined") errors.push({ field: "quantidade", message: "quantidade é obrigatória" });
  if (errors.length) return res.status(400).json({ error: "Dados inválidos", details: errors });
  const q = Number(body.quantidade);
  if (Number.isNaN(q) || q <= 0) return res.status(400).json({ error: "Dados inválidos", details: [{ field: "quantidade", message: "Quantidade deve ser número positivo" }] });
  if (body.local_origem_id === body.local_destino_id) return res.status(400).json({ error: "Dados inválidos", details: [{ field: "local_destino_id", message: "Local destino deve ser diferente do origem" }] });
  const prod = await produtoData.findById(body.produto_id);
  if (!prod || prod.status !== "Disponível") return res.status(400).json({ error: "Dados inválidos", details: [{ field: "produto_id", message: "Produto inválido" }] });
  const origem = await localData.findById(body.local_origem_id);
  if (!origem || origem.status !== "Ativo") return res.status(400).json({ error: "Dados inválidos", details: [{ field: "local_origem_id", message: "Local origem inválido" }] });
  const destino = await localData.findById(body.local_destino_id);
  if (!destino || destino.status !== "Ativo") return res.status(400).json({ error: "Dados inválidos", details: [{ field: "local_destino_id", message: "Local destino inválido" }] });
  next();
}

module.exports = { validarEntrada, validarSaida, validarTransferencia };
