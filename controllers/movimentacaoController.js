const {
  EstoqueService,
  ErroEstoqueInsuficiente,
  ErroLocalInvalido,
  ErroProdutoInvalido,
} = require("../services/estoqueService");
const movimentacaoData = require("../data/movimentacaoData");

async function registrarEntrada(req, res) {
  try {
    const usuarioId =
      req.session && req.session.user ? req.session.user.id : null;
    const { produto_id, local_id, quantidade, lote_id, numero_lote, data_validade, data_fabricacao, lote_option } = req.body;
    
    // Preparar dados do lote
    const loteData = lote_option ? {
      lote_id,
      numero_lote,
      data_validade,
      data_fabricacao,
      lote_option
    } : null;
    
    const result = await EstoqueService.registrarEntrada(
      produto_id,
      local_id,
      quantidade,
      usuarioId,
      loteData
    );
    return res
      .status(201)
      .json({ 
        success: true, 
        movimentacao: result.movimentacao,
        lote_id: result.loteId  // Retornar o ID do lote criado (se aplicável)
      });
  } catch (err) {
    return handleError(err, res);
  }
}

async function registrarSaida(req, res) {
  try {
    const usuarioId =
      req.session && req.session.user ? req.session.user.id : null;
    const { produto_id, local_id, quantidade, observacao } = req.body;
    const result = await EstoqueService.registrarSaida(
      produto_id,
      local_id,
      quantidade,
      usuarioId,
      observacao
    );
    return res
      .status(201)
      .json({
        success: true,
        movimentacao: result.movimentacao,
        estoque_anterior: result.estoqueAnterior,
      });
  } catch (err) {
    return handleError(err, res);
  }
}

async function registrarTransferencia(req, res) {
  try {
    const usuarioId =
      req.session && req.session.user ? req.session.user.id : null;
    const { produto_id, local_origem_id, local_destino_id, quantidade } =
      req.body;
    const result = await EstoqueService.transferir(
      produto_id,
      local_origem_id,
      local_destino_id,
      quantidade,
      usuarioId
    );
    return res
      .status(201)
      .json({ success: true, movimentacao: result.movimentacao });
  } catch (err) {
    return handleError(err, res);
  }
}

async function listarHistorico(req, res) {
  try {
    const { produto_id, local_id, limit = 100 } = req.query;
    let rows = [];
    if (produto_id)
      rows = await movimentacaoData.getMovimentacoesByProduto(
        (productId = produto_id)
      );
    else if (local_id)
      rows = await movimentacaoData.getMovimentacoesByLocal(local_id);
    else rows = await movimentacaoData.getMovimentacoesByProduto(null); // fallback: empty
    return res.status(200).json({ movimentacoes: rows, total: rows.length });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Erro interno", message: err.message || String(err) });
  }
}

// Nova função para obter estoque atual por produto e local
async function obterEstoqueAtual(req, res) {
  try {
    const { produto_id, local_id } = req.query;
    
    // Validação dos parâmetros
    if (!produto_id || !local_id) {
      return res.status(400).json({ 
        error: "Parâmetros inválidos", 
        message: "produto_id e local_id são obrigatórios" 
      });
    }

    // Chama a função de dados para obter o estoque atual
    const estoque = await movimentacaoData.getEstoqueAtualByProdutoLocal(produto_id, local_id);
    
    return res.status(200).json({ 
      estoque_atual: estoque,
      produto_id: parseInt(produto_id),
      local_id: parseInt(local_id)
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Erro interno", message: err.message || String(err) });
  }
}

// Nova função para histórico com filtros
const historicoService = require("../services/historicoService");

async function listarHistoricoAvancado(req, res) {
  try {
    const {
      data_inicio,
      data_fim,
      produto_id,
      tipo,
      local_id,
      pagina,
      limite
    } = req.query;

    // Chama o serviço para obter movimentações filtradas
    const resultado = await historicoService.listarMovimentacoesFiltradas({
      data_inicio,
      data_fim,
      produto_id,
      tipo,
      local_id,
      pagina,
      limite
    });

    return res.status(200).json({
      success: true,
      movimentacoes: resultado.movimentacoes,
      paginacao: resultado.paginacao
    });
  } catch (err) {
    console.error("Erro ao listar histórico de movimentações:", err);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err) 
    });
  }
}

function handleError(err, res) {
  // domain errors
  if (err && err.code === "ESTOQUE_INSUFICIENTE") {
    return res
      .status(err.status || 422)
      .json({ error: err.code, message: err.message });
  }
  if (err && err.name === "ErroEstoqueInsuficiente") {
    return res
      .status(err.status || 422)
      .json({
        error: err.code || "ESTOQUE_INSUFICIENTE",
        message: err.message,
      });
  }
  if (err && err.name === "ErroLocalInvalido") {
    return res
      .status(err.status || 400)
      .json({ error: err.code || "LOCAL_INVALIDO", message: err.message });
  }
  if (err && err.name === "ErroProdutoInvalido") {
    return res
      .status(err.status || 400)
      .json({ error: err.code || "PRODUTO_INVALIDO", message: err.message });
  }
  // validation errors passed as {status, message}
  if (err && err.status === 400)
    return res
      .status(400)
      .json({ error: "Dados inválidos", message: err.message });
  return res
    .status(500)
    .json({ error: "Erro interno", message: err.message || String(err) });
}

module.exports = {
  registrarEntrada,
  registrarSaida,
  registrarTransferencia,
  listarHistorico, // Manter o método original
  listarHistoricoAvancado, // Novo método para histórico avançado
  obterEstoqueAtual,
};
