const alertaData = require("../data/alertaData");
const produtoData = require("../data/produtoData");
const movimentacaoData = require("../data/movimentacaoData");
const localData = require("../data/localData");
const db = require("../config/database");
const { EstoqueService } = require("../services/estoqueService");

/**
 * Detectar alertas de estoque abaixo do mínimo
 */
async function detectarAlertasEstoque() {
  try {
    // Obter todos os produtos ativos com estoque mínimo definido
    const produtos = await produtoData.findAll({ onlyAvailable: false }); // Incluir produtos indisponíveis também
    
    // Obter todos os locais ativos
    const locais = await localData.findAll({ onlyActive: true });
    
    const alertasCriados = [];
    
    for (const produto of produtos) {
      if (produto.status !== 'Disponível' || produto.estoque_minimo <= 0) {
        continue; // Pular produtos indisponíveis ou sem estoque mínimo definido
      }
      
      for (const local of locais) {
        if (local.status !== 'Ativo') {
          continue; // Pular locais inativos
        }
        
        // Calcular estoque atual para o produto neste local
        const estoqueAtual = await movimentacaoData.getEstoqueAtual(produto.id, local.id);
        
        // Verificar se o estoque está abaixo ou igual ao mínimo
        if (estoqueAtual <= produto.estoque_minimo) {
          // Verificar se já existe um alerta ativo para este produto/local/tipo
          const alertaExistente = await alertaData.findByProdutoLocalTipo(
            produto.id, 
            'Estoque Mínimo', // Usando o nome do tipo conforme a tabela
            local.id
          );
          
          if (!alertaExistente) {
            // Criar novo alerta
            const mensagem = `Produto "${produto.nome}" no local "${local.nome}" está com estoque baixo (${estoqueAtual}) abaixo do mínimo (${produto.estoque_minimo})`;
            
            const novoAlerta = await alertaData.create({
              tipo: 'Estoque Mínimo',
              produto_id: produto.id,
              mensagem: mensagem
            });
            
            if (novoAlerta) {
              alertasCriados.push(novoAlerta);
            }
          }
        }
      }
    }
    
    return alertasCriados;
  } catch (error) {
    console.error("Erro ao detectar alertas de estoque:", error);
    throw error;
  }
}

/**
 * Detectar alertas de validade próxima (7 dias)
 */
async function detectarAlertasValidade() {
  try {
    // Obter lotes com data de validade próxima (dentro de 7 dias)
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + 7); // 7 dias a partir de hoje
    
    // Fazer a query para obter lotes com validade próxima que ainda têm estoque
    const sql = `
      SELECT l.*, p.nome as produto_nome 
      FROM lotes l
      JOIN produtos p ON l.produto_id = p.id
      WHERE l.data_validade IS NOT NULL 
      AND l.data_validade <= ?
      AND l.data_validade >= ?
      AND p.status = 'Disponível'
      AND l.quantidade > 0
    `;
    
    const params = [
      dataLimite.toISOString().split('T')[0], // Formato YYYY-MM-DD
      hoje.toISOString().split('T')[0]       // Formato YYYY-MM-DD
    ];
    
    const lotes = await db.query(sql, params);
    
    const alertasCriados = [];
    
    for (const lote of lotes) {
      // Verificar se já existe um alerta ativo para este produto/lote/tipo
      const alertaExistente = await alertaData.findByProdutoLocalTipo(
        lote.produto_id,
        'Lote Vencido', // Using the new alert type for lot expiration
        null, // No specific location for lot-based alerts
        lote.id // Include the lot_id for lot-specific alerts
      );
      
      if (!alertaExistente) {
        // Calcular dias até a validade
        const dataValidade = new Date(lote.data_validade);
        const diferencaDias = Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24));
        
        // Criar novo alerta
        const mensagem = `Lote "${lote.numero_lote}" do produto "${lote.produto_nome}" vence em ${diferencaDias} dia(s) (validade: ${lote.data_validade})`;
        
        const novoAlerta = await alertaData.create({
          tipo: 'Lote Vencido',
          produto_id: lote.produto_id,
          lote_id: lote.id,
          mensagem: mensagem
        });
        
        if (novoAlerta) {
          alertasCriados.push(novoAlerta);
        }
      }
    }
    
    return alertasCriados;
  } catch (error) {
    console.error("Erro ao detectar alertas de validade:", error);
    throw error;
  }
}

/**
 * Criar um novo alerta
 */
async function criarAlerta(dadosAlerta) {
  return await alertaData.create(dadosAlerta);
}

/**
 * Listar alertas ativos (não lidos)
 */
async function listarAlertasAtivos(filtros = {}) {
  const filtro = { ...filtros, lido: false };
  return await alertaData.findAll(filtro);
}

/**
 * Marcar alerta como lido
 */
async function marcarComoLido(alertaId) {
  return await alertaData.update(alertaId, { lida: true });
}

/**
 * Obter alertas recentes para o dashboard
 */
async function getAlertasRecentes(limit = 10) {
  const filtros = { lido: false };
  const alertas = await alertaData.findAll(filtros);
  return alertas.slice(0, limit);
}

/**
 * Executar detecção completa de alertas
 */
async function executarDetecaoAlertas() {
  const alertasEstoque = await detectarAlertasEstoque();
  const alertasValidade = await detectarAlertasValidade();
  
  return {
    estoque: alertasEstoque,
    validade: alertasValidade,
    total: alertasEstoque.length + alertasValidade.length
  };
}

module.exports = { 
  detectarAlertasEstoque, 
  detectarAlertasValidade,
  criarAlerta,
  listarAlertasAtivos,
  marcarComoLido,
  getAlertasRecentes,
  executarDetecaoAlertas
};