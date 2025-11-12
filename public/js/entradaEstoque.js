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

    // Configurar o campo de opção de lote
    const loteOptionSelect = document.getElementById('loteOption');
    
    // Função para atualizar campos de acordo com a opção selecionada
    function atualizarCamposLote() {
        const option = loteOptionSelect.value;
        
        // Esconder ambos os conjuntos de campos
        document.getElementById('novoLoteFields').style.display = 'none';
        document.getElementById('loteExistentesFields').style.display = 'none';
        document.getElementById('datasLoteFields').style.display = 'none';
        document.getElementById('dataFabricacaoField').style.display = 'none';
        
        // Mostrar o conjunto apropriado com base na seleção
        if (option === 'novo') {
            document.getElementById('novoLoteFields').style.display = 'block';
            document.getElementById('datasLoteFields').style.display = 'block';
            document.getElementById('dataFabricacaoField').style.display = 'block';
            // Mostrar campo de localização para novos lotes
            document.getElementById('localSelectionGroup').style.display = 'block';
        } else if (option === 'existente') {
            document.getElementById('loteExistentesFields').style.display = 'block';
            // Para lotes existentes, não mostramos os campos de data pois eles já estão definidos no lote
            // Esconder o campo de localização pois o lote já tem um local definido
            document.getElementById('localSelectionGroup').style.display = 'none';
        }
    }
    
    // Adicionar listener para quando a opção é alterada
    loteOptionSelect.addEventListener('change', atualizarCamposLote);
    
    // Chamar a função imediatamente para garantir que os campos estejam corretos ao carregar a página
    atualizarCamposLote();

    // Configurar o campo de produto para carregar lotes existentes
    document.getElementById('produtoId').addEventListener('change', function() {
        const produtoId = this.value;
        if (produtoId) {
            carregarLotesPorProduto(produtoId);
        } else {
            const lotesExistentesSelect = document.getElementById('loteExistentes');
            lotesExistentesSelect.innerHTML = '<option value="">Selecione um lote existente</option>';
        }
    });
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

// Função para carregar lotes do produto selecionado
async function carregarLotesPorProduto(produtoId) {
    try {
        const response = await fetch(`/api/lotes/produto/${produtoId}`);
        if (response.ok) {
            const data = await response.json();
            const lotes = data.lotes || [];
            
            const lotesExistentesSelect = document.getElementById('loteExistentes');
            lotesExistentesSelect.innerHTML = '<option value="">Selecione um lote existente</option>';
            
            lotes.forEach(lote => {
                const option = document.createElement('option');
                option.value = lote.id;
                // Mostrar número do lote com data de validade
                const validade = lote.data_validade ? ` - Vence: ${new Date(lote.data_validade).toLocaleDateString('pt-BR')}` : '';
                option.textContent = `${lote.numero_lote} (Qtde: ${lote.quantidade})${validade}`;
                lotesExistentesSelect.appendChild(option);
            });
        } else {
            console.error('Erro ao carregar lotes:', response.status);
        }
    } catch (error) {
        console.error('Erro ao carregar lotes:', error);
    }
}

// Função para lidar com o envio do formulário
async function handleSubmit(event) {
    event.preventDefault();
    
    // Prevenir submissões duplicadas
    if (submitLocked) return;
    
    // Obter opção selecionada para lote
    const loteOption = document.getElementById('loteOption').value;
    let loteId = null;
    let localId = null;
    let numeroLote = null;
    let dataValidade = null;
    let dataFabricacao = null;
    
    if (loteOption === 'novo') {
        // Preparar dados para novo lote
        numeroLote = document.getElementById('numeroLote').value.trim() || null;
        dataValidade = document.getElementById('dataValidade').value || null;
        dataFabricacao = document.getElementById('dataFabricacao').value || null;
        // Usar o local selecionado no formulário para novos lotes
        localId = parseInt(document.getElementById('localId').value) || null;
    } else if (loteOption === 'existente') {
        // Pegar ID do lote existente selecionado
        loteId = document.getElementById('loteExistentes').value || null;
        if (!loteId) {
            showBanner('Por favor, selecione um lote existente', 'error');
            return;
        }
        
        // Para lotes existentes, precisamos obter o local atual do lote
        // Isso será feito no backend ou precisamos fazer uma requisição aqui
        try {
            const loteResponse = await fetch(`/api/lotes/${loteId}`);
            if (!loteResponse.ok) {
                showBanner('Erro ao obter informações do lote', 'error');
                return;
            }
            const loteData = await loteResponse.json();
            localId = loteData.lote.localizacao_id; // O local atual do lote existente
            
            if (!localId) {
                showBanner('O lote selecionado não tem uma localização definida', 'error');
                return;
            }
        } catch (error) {
            console.error('Erro ao obter localização do lote:', error);
            showBanner('Erro ao obter localização do lote', 'error');
            return;
        }
    }
    
    // Coletar dados do formulário
    const formData = {
        produto_id: parseInt(document.getElementById('produtoId').value) || null,
        local_id: localId,  // Local depende da opção selecionada
        quantidade: parseFloat(document.getElementById('quantidade').value) || null,
        lote_id: loteId || null,  // Passar o ID do lote existente se selecionado
        // Informações para criar novo lote ou adicionar a existente
        numero_lote: numeroLote,
        data_validade: dataValidade,
        data_fabricacao: dataFabricacao,
        lote_option: loteOption  // Indicar se é para novo lote ou existente
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
        console.log(formData);
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
    
    // Validação específica para opção de lote
    if (dados.lote_option === 'novo' && !dados.numero_lote) {
        erros.push({ campo: 'numeroLote', mensagem: 'Número do lote é obrigatório para novo lote' });
    }
    
    if (dados.data_validade && dados.data_fabricacao) {
        const validade = new Date(dados.data_validade);
        const fabricacao = new Date(dados.data_fabricacao);
        if (validade < fabricacao) {
            erros.push({ campo: 'dataValidade', mensagem: 'Data de validade deve ser posterior à data de fabricação' });
        }
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
        let mensagem;
        
        // Para campos especiais que não seguem o padrão campoId -> campoError
        switch(erro.campo) {
            case 'numeroLote':
                mensagem = document.getElementById('numeroLoteError');
                break;
            case 'dataValidade':
                mensagem = document.getElementById('dataValidadeError');
                break;
            case 'dataFabricacao':
                mensagem = document.getElementById('dataFabricacaoError');
                break;
            case 'loteExistentes':
                mensagem = document.getElementById('loteExistentesError');
                break;
            default:
                mensagem = document.getElementById(erro.campo.replace('Id', 'Error'));
                break;
        }
        
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
    const campos = ['produtoId', 'localId', 'quantidade', 'numeroLote', 'dataValidade', 'dataFabricacao', 'loteExistentes'];
    
    campos.forEach(campo => {
        const input = document.getElementById(campo);
        let mensagem;
        
        // Para campos especiais que não seguem o padrão campoId -> campoError
        switch(campo) {
            case 'numeroLote':
                mensagem = document.getElementById('numeroLoteError');
                break;
            case 'dataValidade':
                mensagem = document.getElementById('dataValidadeError');
                break;
            case 'dataFabricacao':
                mensagem = document.getElementById('dataFabricacaoError');
                break;
            case 'loteExistentes':
                mensagem = document.getElementById('loteExistentesError');
                break;
            default:
                mensagem = document.getElementById(campo.replace('Id', 'Error'));
                break;
        }
        
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
    
    // Selecionar a opção padrão
    const loteOptionSelect = document.getElementById('loteOption');
    loteOptionSelect.value = 'novo';
    
    // Esconder campos de lote e redefinir para opção padrão
    document.getElementById('novoLoteFields').style.display = 'none';
    document.getElementById('loteExistentesFields').style.display = 'none';
    document.getElementById('datasLoteFields').style.display = 'none';
    document.getElementById('dataFabricacaoField').style.display = 'none';
    
    // Mostrar campo de localização novamente (padrão para nova criação de lote)
    document.getElementById('localSelectionGroup').style.display = 'block';
    
    // Limpar também os campos específicos de lote
    document.getElementById('numeroLote')?.removeAttribute('value');
    document.getElementById('dataValidade')?.removeAttribute('value');
    document.getElementById('dataFabricacao')?.removeAttribute('value');
    
    // Limpar lista de lotes existentes
    const lotesExistentesSelect = document.getElementById('loteExistentes');
    if (lotesExistentesSelect) {
        lotesExistentesSelect.innerHTML = '<option value="">Selecione um lote existente</option>';
    }
    
    // Chamar a função para atualizar campos de lotes após resetar o formulário
    // Isso garante que os campos fiquem visíveis/ocultos de acordo com a opção selecionada (novo)
    setTimeout(() => {
        // Aplicar a mesma lógica usada no event listener de 'change'
        const option = loteOptionSelect.value;
        
        // Esconder ambos os conjuntos de campos
        document.getElementById('novoLoteFields').style.display = 'none';
        document.getElementById('loteExistentesFields').style.display = 'none';
        document.getElementById('datasLoteFields').style.display = 'none';
        document.getElementById('dataFabricacaoField').style.display = 'none';
        document.getElementById('localSelectionGroup').style.display = 'none'; // Reset display state
        
        // Mostrar o conjunto apropriado com base na seleção
        if (option === 'novo') {
            document.getElementById('novoLoteFields').style.display = 'block';
            document.getElementById('datasLoteFields').style.display = 'block';
            document.getElementById('dataFabricacaoField').style.display = 'block';
            document.getElementById('localSelectionGroup').style.display = 'block';
        } else if (option === 'existente') {
            document.getElementById('loteExistentesFields').style.display = 'block';
            // Para lotes existentes, não mostramos os campos de data pois eles já estão definidos no lote
            document.getElementById('localSelectionGroup').style.display = 'none';
        }
    }, 0);
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