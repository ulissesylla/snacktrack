const produtoData = require("../data/produtoData");
const localData = require("../data/localData");
const movimentacaoData = require("../data/movimentacaoData");
const dashboardData = require("../data/dashboardData");
const db = require("../config/database");
const { EstoqueService } = require("./estoqueService");
const alertaData = require("../data/alertaData");

async function getEstatisticasBasicas() {
  try {
    // Contar produtos ativos
    const totalProdutosResult = await db.query("SELECT COUNT(*) as count FROM produtos WHERE status = 'Disponível'");
    const total_produtos = totalProdutosResult[0]?.count || 0;

    // Contar locais ativos
    const totalLocaisResult = await db.query("SELECT COUNT(*) as count FROM locais WHERE status = 'Ativo'");
    const total_locais = totalLocaisResult[0]?.count || 0;

    // Contar total de movimentações
    const totalMovimentacoesResult = await db.query("SELECT COUNT(*) as count FROM movimentacoes");
    const total_movimentacoes = totalMovimentacoesResult[0]?.count || 0;

    // Contar movimentações do dia atual
    const hoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const movimentacoesHojeResult = await db.query(
      "SELECT COUNT(*) as count FROM movimentacoes WHERE DATE(data_movimentacao) = ?",
      [hoje]
    );
    const movimentacoes_hoje = movimentacoesHojeResult[0]?.count || 0;

    return {
      total_produtos,
      total_locais,
      total_movimentacoes,
      movimentacoes_hoje
    };
  } catch (error) {
    console.error("Erro ao obter estatísticas básicas:", error);
    throw error;
  }
}

async function getUltimasMovimentacoes() {
  try {
    // Consulta SQL para obter as últimas 15 movimentações com joins para obter os nomes
    const sql = `
      SELECT 
        m.id,
        m.data_movimentacao,
        m.tipo,
        m.quantidade,
        p.nome AS produto_nome,
        l1.nome AS local_origem_nome,
        l2.nome AS local_destino_nome
      FROM movimentacoes m
      LEFT JOIN produtos p ON m.produto_id = p.id
      LEFT JOIN locais l1 ON m.local_origem_id = l1.id
      LEFT JOIN locais l2 ON m.local_destino_id = l2.id
      ORDER BY m.data_movimentacao DESC
      LIMIT 15
    `;
    
    const movimentacoes = await db.query(sql);
    
    // Formatando os resultados para garantir consistência
    return movimentacoes.map(m => ({
      id: m.id,
      data_movimentacao: m.data_movimentacao,
      tipo: m.tipo,
      produto_nome: m.produto_nome,
      quantidade: m.quantidade,
      local_origem_nome: m.local_origem_nome,
      local_destino_nome: m.local_destino_nome
    }));
  } catch (error) {
    console.error("Erro ao obter últimas movimentações:", error);
    throw error;
  }
}

/**
 * Calcular consumo médio diário por produto e local
 * @param {Object} params - Parâmetros de cálculo
 * @param {number} params.produto_id - ID do produto (obrigatório)
 * @param {number} params.local_id - ID do local (opcional)
 * @param {number} params.periodo_dias - Período em dias (padrão: 30)
 * @returns {Array} Lista de consumos médios calculados
 */
async function calcularConsumoMedio(params = {}) {
  const { produto_id, local_id, periodo_dias = 30 } = params;
  
  if (!produto_id) {
    throw new Error("produto_id é obrigatório para cálculo de consumo médio");
  }
  
  // Usar a camada de dados para calcular o consumo médio
  return await dashboardData.calcularConsumoMedioProduto({
    produto_id,
    local_id,
    periodo_dias
  });
}

/**
 * Obter estatísticas avançadas para o dashboard
 * @param {Object} params - Parâmetros de consulta
 * @param {number} params.local_id - ID do local (opcional)
 * @param {number} params.periodo_dias - Período em dias (padrão: 30)
 * @returns {Object} Estatísticas avançadas agregadas
 */
async function getEstatisticasAvancadas(params = {}) {
  const { local_id, periodo_dias = 30 } = params;
  
  try {
    // Obter estatísticas de movimentação por período
    const movimentacaoStats = await dashboardData.getEstatisticasMovimentacaoPorPeriodo({
      periodo_dias,
      local_id
    });
    
    // Contar produtos com estoque abaixo do mínimo
    let produtosEstoqueBaixo = 0;
    if (local_id) {
      // Se local_id foi especificado, contar produtos com estoque baixo nesse local específico
      const produtos = await produtoData.findAll({ onlyAvailable: true });
      for (const produto of produtos) {
        const estoqueAtual = await movimentacaoData.getEstoqueAtual(produto.id, local_id);
        if (estoqueAtual <= produto.estoque_minimo) {
          produtosEstoqueBaixo++;
        }
      }
    } else {
      // Se não especificado, contar produtos com estoque baixo em qualquer local
      const produtos = await produtoData.findAll({ onlyAvailable: true });
      const locais = await localData.findAll({ onlyActive: true });
      
      for (const produto of produtos) {
        for (const local of locais) {
          const estoqueAtual = await movimentacaoData.getEstoqueAtual(produto.id, local.id);
          if (estoqueAtual <= produto.estoque_minimo) {
            produtosEstoqueBaixo++;
            break; // Contar o produto apenas uma vez
          }
        }
      }
    }
    
    // Contar produtos com validade próxima (7 dias)
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + 7); // 7 dias a partir de hoje
    
    let produtosValidadeProxima = 0;
    const sqlValidade = `
      SELECT COUNT(*) as count 
      FROM produtos 
      WHERE data_validade IS NOT NULL 
      AND data_validade <= ?
      AND data_validade >= ?
      AND status = 'Disponível'
    `;
    
    const paramsValidade = [
      dataLimite.toISOString().split('T')[0], // Formato YYYY-MM-DD
      hoje.toISOString().split('T')[0]       // Formato YYYY-MM-DD
    ];
    
    const produtosValidadeResult = await db.query(sqlValidade, paramsValidade);
    produtosValidadeProxima = produtosValidadeResult[0]?.count || 0;
    
    // Obter produtos mais movimentados
    const produtosMaisMovimentados = await dashboardData.getTopProdutosMovimentacao({
      periodo_dias,
      local_id,
      limite: 5 // Top 5
    });
    
    return {
      movimentacao_30dias: movimentacaoStats,
      alertas_ativos: {
        estoque_baixo: produtosEstoqueBaixo,
        validade_proxima: produtosValidadeProxima
      },
      produtos_mais_movimentados: produtosMaisMovimentados
    };
  } catch (error) {
    console.error("Erro ao obter estatísticas avançadas:", error);
    throw error;
  }
}

/**
 * Obter produtos mais movimentados
 * @param {Object} params - Parâmetros de consulta
 * @param {number} params.limite - Limite de produtos (padrão: 10)
 * @param {number} params.periodo_dias - Período em dias (padrão: 30)
 * @param {number} params.local_id - ID do local (opcional)
 * @returns {Array} Lista de produtos mais movimentados
 */
async function getProdutosMaisMovimentados(params = {}) {
  const { limite = 10, periodo_dias = 30, local_id } = params;
  
  return await dashboardData.getTopProdutosMovimentacao({
    limite,
    periodo_dias,
    local_id
  });
}

/**
 * Obter locais com maior movimentação
 * @param {Object} params - Parâmetros de consulta
 * @param {number} params.limite - Limite de locais (padrão: 10)
 * @param {number} params.periodo_dias - Período em dias (padrão: 30)
 * @returns {Array} Lista de locais com maior movimentação
 */
async function getLocaisComMaiorMovimentacao(params = {}) {
  const { limite = 10, periodo_dias = 30 } = params;
  
  return await dashboardData.getMovimentacaoPorLocal({
    limite,
    periodo_dias
  });
}

module.exports = { 
  getEstatisticasBasicas, 
  getUltimasMovimentacoes,
  calcularConsumoMedio,
  getEstatisticasAvancadas,
  getProdutosMaisMovimentados,
  getLocaisComMaiorMovimentacao
};