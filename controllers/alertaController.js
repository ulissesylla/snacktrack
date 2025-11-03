const alertaService = require("../services/alertaService");

/**
 * Listar alertas com filtros
 */
async function listarAlertas(req, res) {
  try {
    const { tipo, lido, produto_id } = req.query;
    
    const filtros = {};
    if (tipo) filtros.tipo = tipo;
    if (lido !== undefined) filtros.lido = lido === 'true';
    if (produto_id) filtros.produto_id = parseInt(produto_id);
    
    const alertas = await alertaService.listarAlertasAtivos(filtros);
    return res.status(200).json({ 
      success: true,
      alertas: alertas
    });
  } catch (err) {
    console.error("Erro ao listar alertas:", err);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err) 
    });
  }
}

/**
 * Marcar alerta como lido
 */
async function marcarComoLido(req, res) {
  try {
    const { alerta_id } = req.body;
    
    if (!alerta_id) {
      return res.status(400).json({ 
        error: "Dados inválidos", 
        message: "ID do alerta é obrigatório" 
      });
    }
    
    const resultado = await alertaService.marcarComoLido(alerta_id);
    
    if (resultado) {
      return res.status(200).json({ 
        success: true,
        message: "Alerta marcado como lido"
      });
    } else {
      return res.status(404).json({ 
        error: "Alerta não encontrado" 
      });
    }
  } catch (err) {
    console.error("Erro ao marcar alerta como lido:", err);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err) 
    });
  }
}

/**
 * Obter contagem de alertas não lidos
 */
async function getContagemAlertas(req, res) {
  try {
    const count = await alertaService.getAlertasRecentes();
    // Para obter apenas a contagem, precisamos de uma função específica
    const contagem = await require("../data/alertaData").countNaoLidos();
    return res.status(200).json({ 
      success: true,
      contagem: contagem
    });
  } catch (err) {
    console.error("Erro ao obter contagem de alertas:", err);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err) 
    });
  }
}

/**
 * Executar detecção de alertas (endpoint para testes)
 */
async function executarDetecaoAlertas(req, res) {
  try {
    const resultado = await alertaService.executarDetecaoAlertas();
    return res.status(200).json({ 
      success: true,
      resultado: resultado
    });
  } catch (err) {
    console.error("Erro ao executar detecção de alertas:", err);
    return res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err) 
    });
  }
}

module.exports = { 
  listarAlertas, 
  marcarComoLido, 
  getContagemAlertas,
  executarDetecaoAlertas
};