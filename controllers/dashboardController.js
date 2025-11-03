const dashboardService = require("../services/dashboardService");

async function getStats(req, res) {
  try {
    const estatisticas = await dashboardService.getEstatisticasBasicas();
    return res.status(200).json({ 
      success: true,
      estatisticas: estatisticas
    });
  } catch (err) {
    console.error("Erro ao obter estatísticas do dashboard:", err);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err) 
    });
  }
}

async function getUltimasMovimentacoes(req, res) {
  try {
    const movimentacoes = await dashboardService.getUltimasMovimentacoes();
    return res.status(200).json({ 
      success: true,
      movimentacoes: movimentacoes
    });
  } catch (err) {
    console.error("Erro ao obter últimas movimentações do dashboard:", err);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err) 
    });
  }
}

/**
 * Obter consumo médio de produtos
 */
async function getConsumoMedio(req, res) {
  try {
    const { produto_id, local_id, periodo_dias } = req.query;
    
    // Validar parâmetros obrigatórios
    if (!produto_id) {
      return res.status(400).json({ 
        error: "Parâmetro inválido", 
        message: "produto_id é obrigatório" 
      });
    }
    
    const params = {
      produto_id: parseInt(produto_id),
      local_id: local_id ? parseInt(local_id) : null,
      periodo_dias: periodo_dias ? parseInt(periodo_dias) : 30
    };
    
    const consumo_medio = await dashboardService.calcularConsumoMedio(params);
    
    return res.status(200).json({ 
      success: true,
      consumo_medio: consumo_medio
    });
  } catch (err) {
    console.error("Erro ao obter consumo médio:", err);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err) 
    });
  }
}

/**
 * Obter estatísticas avançadas do dashboard
 */
async function getEstatisticasAvancadas(req, res) {
  try {
    const { local_id, periodo_dias } = req.query;
    
    const params = {
      local_id: local_id ? parseInt(local_id) : null,
      periodo_dias: periodo_dias ? parseInt(periodo_dias) : 30
    };
    
    const estatisticas = await dashboardService.getEstatisticasAvancadas(params);
    
    return res.status(200).json({ 
      success: true,
      estatisticas: estatisticas
    });
  } catch (err) {
    console.error("Erro ao obter estatísticas avançadas:", err);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err) 
    });
  }
}

/**
 * Obter rankings de produtos e locais mais movimentados
 */
async function getRankings(req, res) {
  try {
    const { limite, periodo_dias, local_id } = req.query;
    
    const params = {
      limite: limite ? parseInt(limite) : 10,
      periodo_dias: periodo_dias ? parseInt(periodo_dias) : 30,
      local_id: local_id ? parseInt(local_id) : null
    };
    
    // Obter produtos mais movimentados
    const produtosMaisMovimentados = await dashboardService.getProdutosMaisMovimentados(params);
    
    // Obter locais com maior movimentação
    const locaisMaisMovimentados = await dashboardService.getLocaisComMaiorMovimentacao({
      limite: params.limite,
      periodo_dias: params.periodo_dias
    });
    
    return res.status(200).json({ 
      success: true,
      rankings: {
        produtos_mais_movimentados: produtosMaisMovimentados,
        locais_mais_movimentados: locaisMaisMovimentados
      }
    });
  } catch (err) {
    console.error("Erro ao obter rankings:", err);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err) 
    });
  }
}

/**
 * Obter estoque atual de todos os produtos
 */
async function getEstoqueAtual(req, res) {
  try {
    const { produto_id, local_id } = req.query;
    
    const params = {};
    if (produto_id) params.produto_id = parseInt(produto_id);
    if (local_id) params.local_id = parseInt(local_id);
    
    const estoque = await dashboardService.getEstoqueAtualTodos(params);
    
    return res.status(200).json({ 
      success: true,
      estoque: estoque
    });
  } catch (err) {
    console.error("Erro ao obter estoque atual:", err);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err) 
    });
  }
}

module.exports = { 
  getStats, 
  getUltimasMovimentacoes,
  getConsumoMedio,
  getEstatisticasAvancadas,
  getRankings,
  getEstoqueAtual
};