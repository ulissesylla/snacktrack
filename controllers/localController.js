const localService = require("../services/localService");

async function listarLocais(req, res) {
  try {
    const locals = await localService.listarTodos({
      onlyActive: req.query.onlyActive !== "false",
    });
    return res.status(200).json({ locais: locals });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

async function buscarLocalPorId(req, res) {
  try {
    const id = req.params.id;
    const local = await localService.buscarPorId(id);
    return res.status(200).json({ local });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

async function criarLocal(req, res) {
  try {
    const payload = {
      nome: req.body.nome,
      capacidade_maxima: req.body.capacidade_maxima,
      descricao: req.body.descricao,
    };
    const created = await localService.criar(payload);
    return res.status(201).json({ local: created });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

async function atualizarLocal(req, res) {
  try {
    const id = req.params.id;
    const payload = {
      nome: req.body.nome,
      capacidade_maxima: req.body.capacidade_maxima,
      descricao: req.body.descricao,
      status: req.body.status,
    };
    const updated = await localService.atualizar(id, payload);
    return res.status(200).json({ local: updated });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

async function inativarLocal(req, res) {
  try {
    const id = req.params.id;
    const updated = await localService.inativar(id);
    return res.status(200).json({ local: updated });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

module.exports = {
  listarLocais,
  buscarLocalPorId,
  criarLocal,
  atualizarLocal,
  inativarLocal,
};
