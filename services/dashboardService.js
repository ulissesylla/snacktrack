const produtoData = require("../data/produtoData");
const localData = require("../data/localData");
const movimentacaoData = require("../data/movimentacaoData");
const db = require("../config/database");

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

module.exports = { getEstatisticasBasicas, getUltimasMovimentacoes };