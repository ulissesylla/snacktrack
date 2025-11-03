// Lógica para a página dashboard principal

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação
    if (!window.Auth) {
        window.location.href = '/login.html';
        return;
    }
    
    const user = await window.Auth.checkAuth();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // Carregar dados iniciais do dashboard
    carregarEstatisticas();
    carregarEstoqueAtual();
    carregarUltimasMovimentacoes();
    carregarContagemAlertas();

    // Configurar atualização automática a cada 2 minutos (120000 ms)
    setInterval(() => {
        carregarEstatisticas();
        carregarEstoqueAtual();
        carregarUltimasMovimentacoes();
        carregarContagemAlertas();
    }, 120000); // 2 minutos
});

// Função para carregar estatísticas básicas
async function carregarEstatisticas() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        
        if (response.ok) {
            atualizarCardsEstatisticas(data.estatisticas);
        } else {
            console.error('Erro ao carregar estatísticas:', data);
            if (typeof window.showBanner === 'function') {
                window.showBanner('Erro ao carregar estatísticas: ' + (data.message || 'Erro desconhecido'));
            } else {
                console.error('Erro ao carregar estatísticas: ' + (data.message || 'Erro desconhecido'));
            }
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        if (typeof window.showBanner === 'function') {
            window.showBanner('Erro de rede ao carregar estatísticas');
        }
    }
}

// Função para atualizar os cards de estatísticas
function atualizarCardsEstatisticas(estatisticas) {
    // Atualizar card de produtos
    const totalProdutosEl = document.getElementById('totalProdutos');
    if (totalProdutosEl) {
        totalProdutosEl.textContent = estatisticas.total_produtos || 0;
    }
    
    // Atualizar card de locais
    const totalLocaisEl = document.getElementById('totalLocais');
    if (totalLocaisEl) {
        totalLocaisEl.textContent = estatisticas.total_locais || 0;
    }
    
    // Atualizar card de movimentações
    const totalMovimentacoesEl = document.getElementById('totalMovimentacoes');
    if (totalMovimentacoesEl) {
        totalMovimentacoesEl.textContent = estatisticas.total_movimentacoes || 0;
    }
    
    // Atualizar card de movimentações hoje
    const movimentacoesHojeEl = document.getElementById('movimentacoesHoje');
    if (movimentacoesHojeEl) {
        movimentacoesHojeEl.textContent = estatisticas.movimentacoes_hoje || 0;
    }
}

// Função para carregar estoque atual
async function carregarEstoqueAtual() {
    try {
        const response = await fetch('/api/dashboard/estoque-atual');
        const data = await response.json();
        
        if (response.ok) {
            preencherTabelaEstoque(data.estoque);
        } else {
            console.error('Erro ao carregar estoque atual:', data);
            if (typeof window.showBanner === 'function') {
                window.showBanner('Erro ao carregar estoque atual: ' + (data.message || 'Erro desconhecido'));
            } else {
                console.error('Erro ao carregar estoque atual: ' + (data.message || 'Erro desconhecido'));
            }
        }
    } catch (error) {
        console.error('Erro ao carregar estoque atual:', error);
        if (typeof window.showBanner === 'function') {
            window.showBanner('Erro de rede ao carregar estoque atual');
        }
    }
}

// Função para preencher a tabela de estoque
function preencherTabelaEstoque(estoque) {
    const tbody = document.querySelector('#estoqueTable tbody');
    if (!tbody) {
        console.error('Tabela de estoque não encontrada');
        return;
    }
    
    // Limpar conteúdo existente
    tbody.innerHTML = '';
    
    // Verificar se há dados
    if (!estoque || estoque.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4">Nenhum estoque encontrado</td>';
        tbody.appendChild(tr);
        return;
    }
    
    // Adicionar linhas para cada item de estoque
    estoque.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.produto_nome || 'Produto não identificado'}</td>
            <td>${item.local_nome || 'Local não identificado'}</td>
            <td>${item.estoque_atual || 0}</td>
            <td>${item.consumo_medio || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Função para carregar últimas movimentações
async function carregarUltimasMovimentacoes() {
    try {
        const response = await fetch('/api/dashboard/ultimas-movimentacoes');
        const data = await response.json();
        
        if (response.ok) {
            preencherTabelaMovimentacoes(data.movimentacoes);
        } else {
            console.error('Erro ao carregar últimas movimentações:', data);
            if (typeof window.showBanner === 'function') {
                window.showBanner('Erro ao carregar últimas movimentações: ' + (data.message || 'Erro desconhecido'));
            } else {
                console.error('Erro ao carregar últimas movimentações: ' + (data.message || 'Erro desconhecido'));
            }
        }
    } catch (error) {
        console.error('Erro ao carregar últimas movimentações:', error);
        if (typeof window.showBanner === 'function') {
            window.showBanner('Erro de rede ao carregar últimas movimentações');
        }
    }
}

// Função para preencher a tabela de movimentações
function preencherTabelaMovimentacoes(movimentacoes) {
    const tbody = document.querySelector('#movimentacoesTable tbody');
    if (!tbody) {
        console.error('Tabela de movimentações não encontrada');
        return;
    }
    
    // Limpar conteúdo existente
    tbody.innerHTML = '';
    
    // Verificar se há dados
    if (!movimentacoes || movimentacoes.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5">Nenhuma movimentação encontrada</td>';
        tbody.appendChild(tr);
        return;
    }
    
    // Adicionar linhas para cada movimentação (limitar a 15 registros)
    const movimentacoesLimitadas = movimentacoes.slice(0, 15);
    movimentacoesLimitadas.forEach(mov => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${mov.data_movimentacao ? new Date(mov.data_movimentacao).toLocaleDateString('pt-BR') : ''}</td>
            <td>${mov.tipo || ''}</td>
            <td>${mov.produto_nome || ''}</td>
            <td>${mov.quantidade || 0}</td>
            <td>${mov.local_origem_nome || mov.local_destino_nome || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Função para carregar contagem de alertas
async function carregarContagemAlertas() {
    try {
        const response = await fetch('/api/alertas/contagem');
        const data = await response.json();
        
        if (response.ok) {
            atualizarBadgeAlertas(data.contagem);
        } else {
            console.error('Erro ao carregar contagem de alertas:', data);
            if (typeof window.showBanner === 'function') {
                window.showBanner('Erro ao carregar contagem de alertas: ' + (data.message || 'Erro desconhecido'));
            } else {
                console.error('Erro ao carregar contagem de alertas: ' + (data.message || 'Erro desconhecido'));
            }
        }
    } catch (error) {
        console.error('Erro ao carregar contagem de alertas:', error);
        if (typeof window.showBanner === 'function') {
            window.showBanner('Erro de rede ao carregar contagem de alertas');
        }
    }
}

// Função para atualizar o badge de alertas
function atualizarBadgeAlertas(contagem) {
    const badgeEl = document.getElementById('alertasBadge');
    if (!badgeEl) {
        console.error('Badge de alertas não encontrado');
        return;
    }
    
    // Atualizar conteúdo do badge
    if (contagem > 0) {
        badgeEl.textContent = contagem;
        badgeEl.classList.remove('hidden');
    } else {
        badgeEl.classList.add('hidden');
    }
}