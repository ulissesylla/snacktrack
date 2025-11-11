// Lógica para a página de saída de estoque

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

    // Adicionar campo de seleção de lote após o campo de quantidade
    const quantidadeDiv = document.querySelector('#quantidade').closest('.form-group');
    const lotesContainer = document.createElement('div');
    lotesContainer.className = 'form-group';
    lotesContainer.innerHTML = `
      <label for="loteId">Lote (Opcional)</label>
      <select class="form-control" id="loteId" name="lote_id">
        <option value="">Não especificar lote (FIFO)</option>
        <!-- Preenchido via JavaScript -->
      </select>
      <div class="error-message" id="loteError"></div>
    `;
    quantidadeDiv.parentNode.insertBefore(lotesContainer, quantidadeDiv.nextSibling);
    
    // Carregar dados iniciais
    carregarProdutos();
    carregarLocais();

    // Configurar o formulário
    const form = document.getElementById('formSaida');
    form.addEventListener('submit', handleSubmit);

    // Configurar eventos para atualizar o estoque quando produto ou local mudarem
    const produtoSelect = document.getElementById('produtoId');
    const localSelect = document.getElementById('localId');
    const quantidadeInput = document.getElementById('quantidade');
    
    produtoSelect.addEventListener('change', async function() {
        // Limpar local e lote selecionados quando produto mudar
        localSelect.value = '';
        const loteSelect = document.getElementById('loteId');
        loteSelect.innerHTML = '<option value="">Não especificar lote (FIFO)</option>';
        
        // Atualizar a lista de locais para mostrar apenas aqueles com estoque do produto
        const produtoId = produtoSelect.value;
        if (produtoId) {
            await carregarLocaisComEstoque(produtoId);
        } else {
            // Se nenhum produto selecionado, carregar todos os locais ativos
            await carregarLocais();
        }
        
        // Atualizar estoque disponível
        atualizarEstoqueDisponivel();
    });
    
    localSelect.addEventListener('change', async function() {
        // Atualizar os lotes disponíveis quando o local mudar
        await atualizarEstoqueDisponivel();
        const produtoId = document.getElementById('produtoId').value;
        const localId = document.getElementById('localId').value;
        if (produtoId && localId) {
            await carregarLotesPorProdutoLocal(produtoId, localId);
        } else {
            const loteSelect = document.getElementById('loteId');
            loteSelect.innerHTML = '<option value="">Não especificar lote (FIFO)</option>';
        }
    });
    quantidadeInput.addEventListener('input', validarQuantidadeEmTempoReal);
});

// Variáveis para controle do formulário
let produtos = [];
let locais = [];
let estoqueAtual = 0; // Estoque atual do produto selecionado no local selecionado
let submitLocked = false; // Para prevenir submissões duplicadas

// Função para carregar produtos
async function carregarProdutos() {
    try {
        const response = await fetch('/api/produtos');
        const data = await response.json();
        
        if (response.ok) {
            produtos = Array.isArray(data) ? data : 
                      (data.produtos ? data.produtos : 
                      (data.data ? data.data : []));
            preencherSelectProdutos(produtos);
        } else {
            console.error('Erro ao carregar produtos:', data);
            showBanner('Erro ao carregar produtos: ' + (data.message || 'Erro desconhecido'), 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showBanner('Erro de rede ao carregar produtos', 'error');
    }
}

// Função para carregar locais
async function carregarLocais() {
    try {
        const response = await fetch('/api/locais');
        const data = await response.json();
        
        if (response.ok) {
            locais = Array.isArray(data) ? data : 
                    (data.locais ? data.locais : 
                    (data.data ? data.data : []));
            preencherSelectLocais(locais);
        } else {
            console.error('Erro ao carregar locais:', data);
            showBanner('Erro ao carregar locais: ' + (data.message || 'Erro desconhecido'), 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar locais:', error);
        showBanner('Erro de rede ao carregar locais', 'error');
    }
}

// Função para carregar locais que têm estoque do produto selecionado
async function carregarLocaisComEstoque(produtoId) {
    try {
        // Obter todos os locais primeiro
        const locaisResponse = await fetch('/api/locais');
        const locaisData = await locaisResponse.json();
        
        if (!locaisResponse.ok) {
            console.error('Erro ao carregar locais:', locaisData);
            showBanner('Erro ao carregar locais: ' + (locaisData.message || 'Erro desconhecido'), 'error');
            await carregarLocais(); // Fallback to default behavior
            return;
        }
        
        // Filtrar apenas locais ativos
        const locaisAtivos = Array.isArray(locaisData) ? locaisData : 
                           (locaisData.locais ? locaisData.locais : []);
        
        // Para cada local ativo, verificar o estoque do produto
        const locaisComEstoque = [];
        
        for (const local of locaisAtivos) {
            if (local.status === 'Ativo') {
                // Obter estoque específico para este produto-neste-local
                const estoqueResponse = await fetch(`/api/movimentacoes/estoque?produto_id=${produtoId}&local_id=${local.id}`);
                const estoqueData = await estoqueResponse.json();
                
                if (estoqueResponse.ok && estoqueData.estoque_atual > 0) {
                    // Adicionar local com estoque info
                    locaisComEstoque.push({
                        id: local.id,
                        nome: local.nome,
                        estoque_atual: estoqueData.estoque_atual
                    });
                }
            }
        }
        
        if (locaisComEstoque.length > 0) {
            preencherSelectLocais(locaisComEstoque);
        } else {
            // Se nenhum local tiver estoque, mostrar mensagem e limpar opções
            document.getElementById('localId').innerHTML = '<option value="">Nenhum local com estoque</option>';
            showBanner('Nenhum local com estoque disponível para este produto', 'warning');
        }
    } catch (error) {
        console.error('Erro ao carregar locais com estoque:', error);
        showBanner('Erro de rede ao carregar locais com estoque', 'error');
        // Em caso de erro de rede, carregar todos os locais ativos
        await carregarLocais();
    }
}

// Função para carregar lotes do produto no local selecionado
async function carregarLotesPorProdutoLocal(produtoId, localId) {
    try {
        // Primeiro obter todos os lotes do produto
        const response = await fetch(`/api/lotes/produto/${produtoId}`);
        if (response.ok) {
            const data = await response.json();
            const lotes = data.lotes || [];
            
            // Agora filtrar apenas os lotes que estão no local selecionado e têm estoque
            const lotesFiltrados = [];
            
            for (const lote of lotes) {
                // Verificar estoque específico para este lote
                const estoqueResponse = await fetch(`/api/movimentacoes/estoque?produto_id=${produtoId}&local_id=${localId}`);
                const estoqueData = await estoqueResponse.json();
                
                // Note: Atualmente não temos uma API que retorna estoque por lote e local
                // Por enquanto, mostraremos todos os lotes do produto no local
                if (estoqueData.estoque_atual > 0) {
                    lotesFiltrados.push(lote);
                }
            }
            
            const loteSelect = document.getElementById('loteId');
            loteSelect.innerHTML = '<option value="">Não especificar lote (FIFO)</option>';
            
            lotesFiltrados.forEach(lote => {
                const option = document.createElement('option');
                option.value = lote.id;
                // Mostrar número do lote com data de validade
                const validade = lote.data_validade ? ` - Vence: ${new Date(lote.data_validade).toLocaleDateString('pt-BR')}` : '';
                option.textContent = `${lote.numero_lote} (Qtde: ${lote.quantidade})${validade}`;
                loteSelect.appendChild(option);
            });
        } else {
            console.error('Erro ao carregar lotes:', response.status);
        }
    } catch (error) {
        console.error('Erro ao carregar lotes:', error);
    }
}

// Função para preencher o select de produtos
function preencherSelectProdutos(produtos) {
    const select = document.getElementById('produtoId');
    if (!select) {
        console.error('Produto select element not found');
        return;
    }
    
    select.innerHTML = '<option value="">Selecione um produto</option>';
    
    if (produtos && Array.isArray(produtos)) {
        produtos.forEach(produto => {
            if (produto.status === 'Disponível') { // Apenas produtos disponíveis
                const option = document.createElement('option');
                option.value = produto.id;
                option.textContent = `${produto.nome} (${produto.unidade_medida || 'un'})`;
                select.appendChild(option);
            }
        });
    }
}

// Função para preencher o select de locais
function preencherSelectLocais(locais) {
    const select = document.getElementById('localId');
    if (!select) {
        console.error('Local select element not found');
        return;
    }
    
    select.innerHTML = '<option value="">Selecione um local</option>';
    
    if (locais && Array.isArray(locais)) {
        locais.forEach(local => {
            // Se o parâmetro for um objeto completo de local (com id e nome), usamos esse formato
            // Se o parâmetro for um objeto com id, nome e estoque_atual (do estoque endpoint), também suportamos
            const id = local.id || local.local_id;
            const nome = local.nome || local.local_nome;
            if (nome) { // Apenas locais com nome válido
                const option = document.createElement('option');
                option.value = id;
                option.textContent = nome;
                select.appendChild(option);
            }
        });
    }
}

// Função para atualizar o estoque disponível exibido
async function atualizarEstoqueDisponivel() {
    const produtoId = document.getElementById('produtoId').value;
    const localId = document.getElementById('localId').value;
    const estoqueDiv = document.getElementById('estoqueDisponivel');
    
    if (!produtoId || !localId) {
        estoqueDiv.textContent = 'Selecione produto e local para ver o estoque';
        estoqueDiv.className = 'estoque-info'; // Reset style
        estoqueAtual = 0;
        return;
    }
    
    try {
        const response = await fetch(`/api/movimentacoes/estoque?produto_id=${produtoId}&local_id=${localId}`);
        const data = await response.json();
        
        if (response.ok) {
            estoqueAtual = data.estoque_atual || 0;
            estoqueDiv.textContent = `Estoque disponível: ${estoqueAtual}`;
            
            // Atualizar a classe CSS baseado no estoque
            if (estoqueAtual === 0) {
                estoqueDiv.className = 'estoque-info estoque-zero';
            } else {
                estoqueDiv.className = 'estoque-info estoque-disponivel';
            }
            
            // Validar quantidade atual (se já foi digitada)
            validarQuantidadeEmTempoReal();
        } else {
            console.error('Erro ao obter estoque:', data);
            estoqueDiv.textContent = 'Erro ao obter estoque';
            estoqueDiv.className = 'estoque-info estoque-erro';
            estoqueAtual = 0;
        }
    } catch (error) {
        console.error('Erro de rede ao obter estoque:', error);
        estoqueDiv.textContent = 'Erro de rede ao obter estoque';
        estoqueDiv.className = 'estoque-info estoque-erro';
        estoqueAtual = 0;
    }
}

// Função para validar quantidade em tempo real (quando usuário digita)
function validarQuantidadeEmTempoReal() {
    const quantidadeInput = document.getElementById('quantidade');
    const quantidade = parseFloat(quantidadeInput.value) || 0;
    const estoqueDiv = document.getElementById('estoqueDisponivel');
    
    if (!quantidadeInput.value) {
        // Limpa estilos se não houver valor
        quantidadeInput.classList.remove('estoque-baixo', 'estoque-acima', 'estoque-normal');
        return;
    }
    
    // Validar quantidade baseado no estoque disponível
    if (quantidade > estoqueAtual) {
        // Quantidade acima do estoque disponível - ERRO
        quantidadeInput.classList.remove('estoque-normal', 'estoque-baixo');
        quantidadeInput.classList.add('estoque-acima');
        
        // Desabilitar o botão de submit
        const btnSubmit = document.getElementById('btnSubmit');
        btnSubmit.disabled = true;
        
        // Mostrar mensagem de erro
        const quantidadeError = document.getElementById('quantidadeError');
        quantidadeError.textContent = `Quantidade solicitada (${quantidade}) excede o estoque disponível (${estoqueAtual})`;
        quantidadeError.classList.add('show');
    } else if (quantidade > estoqueAtual * 0.8) {
        // Quantidade acima de 80% do estoque - AVISO
        quantidadeInput.classList.remove('estoque-normal', 'estoque-acima');
        quantidadeInput.classList.add('estoque-baixo');
        
        // Reabilitar botão de submit se estiver desabilitado
        const btnSubmit = document.getElementById('btnSubmit');
        btnSubmit.disabled = false;
        
        // Limpar mensagem de erro
        const quantidadeError = document.getElementById('quantidadeError');
        quantidadeError.classList.remove('show');
        quantidadeError.textContent = '';
    } else {
        // Quantidade normal - OK
        quantidadeInput.classList.remove('estoque-baixo', 'estoque-acima');
        quantidadeInput.classList.add('estoque-normal');
        
        // Reabilitar botão de submit
        const btnSubmit = document.getElementById('btnSubmit');
        btnSubmit.disabled = false;
        
        // Limpar mensagem de erro
        const quantidadeError = document.getElementById('quantidadeError');
        quantidadeError.classList.remove('show');
        quantidadeError.textContent = '';
    }
}

// Função para lidar com o envio do formulário
async function handleSubmit(event) {
    event.preventDefault();
    
    // Prevenir submissões duplicadas
    if (submitLocked) return;
    
    // Verificar se quantidade não excede estoque antes de enviar
    const quantidade = parseFloat(document.getElementById('quantidade').value) || 0;
    if (quantidade > estoqueAtual) {
        showBanner(`Quantidade solicitada (${quantidade}) excede o estoque disponível (${estoqueAtual})`, 'error');
        return;
    }
    
    // Coletar dados do formulário
    const formData = {
        produto_id: parseInt(document.getElementById('produtoId').value) || null,
        local_id: parseInt(document.getElementById('localId').value) || null,
        quantidade: parseFloat(document.getElementById('quantidade').value) || null,
        lote_id: document.getElementById('loteId').value || null
    };

    // Validar formulário
    const erros = validarFormulario(formData);
    
    if (erros.length > 0) {
        // Mostrar erros de validação
        mostrarErros(erros);
        return;
    }
    
    // Limpar erros anteriores
    limparErros();
    
    try {
        // Travar submissão para prevenir duplicação
        submitLocked = true;
        document.getElementById('btnSubmit').classList.add('loading');

        // Enviar dados para a API de saída
        const response = await fetch('/api/movimentacoes/saida', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showBanner('Saída registrada com sucesso!', 'success');
            limparFormulario();
            // Atualizar o estoque exibido após a saída
            await atualizarEstoqueDisponivel();
            
            // Limpar o campo de lotes também
            const loteSelect = document.getElementById('loteId');
            if (loteSelect) {
                loteSelect.innerHTML = '<option value="">Não especificar lote (FIFO)</option>';
            }
        } else {
            const errorMessage = result.message || result.error || 'Erro ao registrar saída';
            showBanner(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Erro ao registrar saída:', error);
        showBanner('Erro de rede ao registrar saída', 'error');
    } finally {
        // Desbloquear submissão
        submitLocked = false;
        document.getElementById('btnSubmit').classList.remove('loading');
    }
}

// Função para validar o formulário
function validarFormulario(dados) {
    const erros = [];
    
    if (!dados.produto_id) {
        erros.push({ campo: 'produtoId', mensagem: 'Produto é obrigatório' });
    }
    
    if (!dados.local_id) {
        erros.push({ campo: 'localId', mensagem: 'Local é obrigatório' });
    }
    
    if (!dados.quantidade) {
        erros.push({ campo: 'quantidade', mensagem: 'Quantidade é obrigatória' });
    } else if (dados.quantidade <= 0) {
        erros.push({ campo: 'quantidade', mensagem: 'Quantidade deve ser positiva' });
    } else if (dados.quantidade > estoqueAtual) {
        erros.push({ campo: 'quantidade', mensagem: `Quantidade excede estoque disponível (${estoqueAtual})` });
    }
    
    return erros;
}

// Função para mostrar erros de validação
function mostrarErros(erros) {
    // Limpar erros anteriores
    limparErros();
    
    // Adicionar classes de erro e mostrar mensagens
    erros.forEach(erro => {
        const campo = document.getElementById(erro.campo);
        const mensagem = document.getElementById(erro.campo.replace('Id', 'Error'));
        
        if (campo) {
            campo.classList.add('error');
        }
        
        if (mensagem) {
            mensagem.textContent = erro.mensagem;
            mensagem.classList.add('show');
        }
    });
}

// Função para limpar erros de validação
function limparErros() {
    // Remover classes de erro e mensagens
    const campos = ['produtoId', 'localId', 'quantidade', 'loteId'];
    
    campos.forEach(campo => {
        const input = document.getElementById(campo);
        const mensagem = document.getElementById(campo.replace('Id', 'Error'));
        
        if (input) {
            input.classList.remove('error');
        }
        
        if (mensagem) {
            mensagem.classList.remove('show');
            mensagem.textContent = '';
        }
    });
}

// Função para limpar o formulário
function limparFormulario() {
    document.getElementById('formSaida').reset();
    
    // Limpar o display de estoque
    const estoqueDiv = document.getElementById('estoqueDisponivel');
    estoqueDiv.textContent = 'Selecione produto e local para ver o estoque';
    estoqueDiv.className = 'estoque-info';
    estoqueAtual = 0;
    
    // Remover classes de validação visual
    const quantidadeInput = document.getElementById('quantidade');
    quantidadeInput.classList.remove('estoque-normal', 'estoque-baixo', 'estoque-acima');
}

// Função para mostrar/ocultar loading
function showLoading(show, message = '') {
    const btnSubmit = document.getElementById('btnSubmit');
    if (!btnSubmit) {
        console.error('Submit button not found');
        return;
    }
    
    const btnText = btnSubmit.querySelector('.btn-text');
    const btnLoading = btnSubmit.querySelector('.btn-loading');
    
    if (!btnText || !btnLoading) {
        console.error('Button text or loading elements not found');
        return;
    }
    
    if (show) {
        btnSubmit.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        btnLoading.textContent = message || 'Carregando...';
    } else {
        btnSubmit.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}