const produtoService = require("../services/produtoService");

async function listarProdutos(req, res) {
  try {
    const produtos = await produtoService.listarTodos({
      onlyAvailable: req.query.onlyAvailable !== "false",
    });
    return res.status(200).json({ produtos });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

async function buscarProdutoPorId(req, res) {
  try {
    const id = req.params.id;
    const produto = await produtoService.buscarPorId(id);
    return res.status(200).json({ produto });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

async function criarProduto(req, res) {
  try {
    const payload = {
      nome: req.body.nome,
      descricao: req.body.descricao,
      preco: req.body.preco,
      unidade_medida: req.body.unidade_medida,
      categoria: req.body.categoria,
      estoque_minimo: req.body.estoque_minimo,
      fabricante: req.body.fabricante,
      tipo: req.body.tipo,
    };
    const created = await produtoService.criar(payload);
    return res.status(201).json({ produto: created });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

async function atualizarProduto(req, res) {
  try {
    const id = req.params.id;
    const payload = {
      nome: req.body.nome,
      descricao: req.body.descricao,
      preco: req.body.preco,
      unidade_medida: req.body.unidade_medida,
      categoria: req.body.categoria,
      estoque_minimo: req.body.estoque_minimo,
      fabricante: req.body.fabricante,
      tipo: req.body.tipo,
      status: req.body.status,
    };
    const updated = await produtoService.atualizar(id, payload);
    return res.status(200).json({ produto: updated });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

async function inativarProduto(req, res) {
  try {
    const id = req.params.id;
    const updated = await produtoService.inativar(id);
    return res.status(200).json({ produto: updated });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

module.exports = {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  inativarProduto,
};
