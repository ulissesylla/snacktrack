// Lógica para a página de entrada de estoque

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

    // Carregar dados iniciais
    carregarProdutos();
    carregarLocais();

    // Configurar o formulário
    const form = document.getElementById('formEntrada');
    form.addEventListener('submit', handleSubmit);
});

// Variáveis para controle do formulário
let produtos = [];
let locais = [];
let submitLocked = false; // Para prevenir submissões duplicadas

// Função para carregar produtos
async function carregarProdutos() {
    try {
        const response = await fetch('/api/produtos');
        console.log('Produtos API response status:', response.status);
        const data = await response.json();
        console.log('Produtos API response data:', data);
        
        if (response.ok) {
            // Handle different possible response formats
            produtos = Array.isArray(data) ? data : 
                      (data.produtos ? data.produtos : 
                      (data.data ? data.data : []));
            console.log('Parsed produtos:', produtos);
            preencherSelectProdutos(produtos);
        } else {
            console.error('Erro ao carregar produtos:', data);
            // Usar o sistema de notificações existente (igual produtos.js)
            if (typeof window.showBanner === 'function') {
                window.showBanner('Erro ao carregar produtos: ' + (data.message || 'Erro desconhecido'), 'error');
            } else {
                console.error('Erro ao carregar produtos: ' + (data.message || 'Erro desconhecido'));
            }
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        // Usar o sistema de notificações existente (igual produtos.js)
        if (typeof window.showBanner === 'function') {
            window.showBanner('Erro de rede ao carregar produtos', 'error');
        } else {
            console.error('Erro de rede ao carregar produtos');
        }
    }
}

// Função para carregar locais
async function carregarLocais() {
    try {
        const response = await fetch('/api/locais');
        console.log('Locais API response status:', response.status);
        const data = await response.json();
        console.log('Locais API response data:', data);
        
        if (response.ok) {
            // Handle different possible response formats
            locais = Array.isArray(data) ? data : 
                    (data.locais ? data.locais : 
                    (data.data ? data.data : []));
            console.log('Parsed locais:', locais);
            preencherSelectLocais(locais);
        } else {
            console.error('Erro ao carregar locais:', data);
            // Usar o sistema de notificações existente (igual produtos.js)
            if (typeof window.showBanner === 'function') {
                window.showBanner('Erro ao carregar locais: ' + (data.message || 'Erro desconhecido'), 'error');
            } else {
                console.error('Erro ao carregar locais: ' + (data.message || 'Erro desconhecido'));
            }
        }
    } catch (error) {
        console.error('Erro ao carregar locais:', error);
        // Usar o sistema de notificações existente (igual produtos.js)
        if (typeof window.showBanner === 'function') {
            window.showBanner('Erro de rede ao carregar locais', 'error');
        } else {
            console.error('Erro de rede ao carregar locais');
        }
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
            if (local.status === 'Ativo') { // Apenas locais ativos
                const option = document.createElement('option');
                option.value = local.id;
                option.textContent = local.nome;
                select.appendChild(option);
            }
        });
    }
}

// Função para lidar com o envio do formulário
async function handleSubmit(event) {
    event.preventDefault();
    
    // Prevenir submissões duplicadas
    if (submitLocked) return;
    
    // Coletar dados do formulário
    const formData = {
        produto_id: parseInt(document.getElementById('produtoId').value) || null,
        local_id: parseInt(document.getElementById('localId').value) || null,
        quantidade: parseFloat(document.getElementById('quantidade').value) || null
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
        
        // Enviar dados para a API
        const response = await fetch('/api/movimentacoes/entrada', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Usar o sistema de notificações existente (igual produtos.js)
            if (typeof window.showBanner === 'function') {
                window.showBanner('Entrada registrada com sucesso!', 'success');
            } else {
                console.log('Entrada registrada com sucesso!');
            }
            limparFormulario();
        } else {
            const errorMessage = result.message || result.error || 'Erro ao registrar entrada';
            // Usar o sistema de notificações existente (igual produtos.js)
            if (typeof window.showBanner === 'function') {
                window.showBanner(errorMessage, 'error');
            } else {
                console.error(errorMessage);
            }
        }
    } catch (error) {
        console.error('Erro ao registrar entrada:', error);
        showBanner('Erro de rede ao registrar entrada', 'error');
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
    const campos = ['produtoId', 'localId', 'quantidade'];
    
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
    document.getElementById('formEntrada').reset();
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