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

module.exports = { getStats, getUltimasMovimentacoes };