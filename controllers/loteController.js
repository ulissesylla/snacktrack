const loteService = require("../services/loteService");

/**
 * Listar todos os lotes
 */
async function listarLotes(req, res) {
  try {
    const params = {
      produto_id: req.query.produto_id ? Number(req.query.produto_id) : undefined,
      withExpired: req.query.withExpired !== "false"  // Default to true
    };

    const lotes = await loteService.listarTodos(params);
    return res.status(200).json({ lotes });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

/**
 * Buscar lote por ID
 */
async function buscarLotePorId(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const lote = await loteService.buscarPorId(id);
    return res.status(200).json({ lote });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

/**
 * Criar novo lote
 */
async function criarLote(req, res) {
  try {
    const payload = {
      produto_id: req.body.produto_id,
      numero_lote: req.body.numero_lote,
      quantidade: req.body.quantidade,
      data_validade: req.body.data_validade,
      data_fabricacao: req.body.data_fabricacao,
      localizacao_id: req.body.localizacao_id || null
    };

    const created = await loteService.criar(payload);
    return res.status(201).json({ lote: created });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

/**
 * Atualizar lote existente
 */
async function atualizarLote(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const payload = {
      produto_id: req.body.produto_id,
      numero_lote: req.body.numero_lote,
      quantidade: req.body.quantidade,
      data_validade: req.body.data_validade,
      data_fabricacao: req.body.data_fabricacao,
      localizacao_id: req.body.localizacao_id
    };

    // Remover propriedades undefined para não sobrescrever com valores indefinidos
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) delete payload[key];
    });

    const updated = await loteService.atualizar(id, payload);
    return res.status(200).json({ lote: updated });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

/**
 * Remover lote
 */
async function removerLote(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const success = await loteService.remover(id);
    if (success) {
      return res.status(200).json({ message: "Lote removido com sucesso" });
    } else {
      return res.status(500).json({ error: "Falha ao remover o lote" });
    }
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

/**
 * Buscar lotes por produto
 */
async function buscarLotesPorProduto(req, res) {
  try {
    const produtoId = Number(req.params.produtoId);
    if (isNaN(produtoId) || produtoId <= 0) {
      return res.status(400).json({ error: "ID do produto inválido" });
    }

    const params = {
      withExpired: req.query.withExpired !== "false"  // Default to true
    };

    const lotes = await loteService.buscarPorProduto(produtoId, params);
    return res.status(200).json({ lotes });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

/**
 * Obter lotes próximos do vencimento
 */
async function getLotesProximosValidade(req, res) {
  try {
    const diasValidade = req.query.dias ? Number(req.query.dias) : 7;
    if (isNaN(diasValidade) || diasValidade <= 0) {
      return res.status(400).json({ error: "Parâmetro dias inválido" });
    }

    const lotes = await loteService.getLotesProximosValidade(diasValidade);
    return res.status(200).json({ lotes });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

/**
 * Obter lotes vencidos
 */
async function getLotesVencidos(req, res) {
  try {
    const lotes = await loteService.getLotesVencidos();
    return res.status(200).json({ lotes });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: "Erro interno" });
  }
}

module.exports = {
  listarLotes,
  buscarLotePorId,
  criarLote,
  atualizarLote,
  removerLote,
  buscarLotesPorProduto,
  getLotesProximosValidade,
  getLotesVencidos
};