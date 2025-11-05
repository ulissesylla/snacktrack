// Lógica para a página de transferência de estoque

document.addEventListener("DOMContentLoaded", async function () {
  // Verificar autenticação
  if (!window.Auth) {
    window.location.href = "/login.html";
    return;
  }

  const user = await window.Auth.checkAuth();
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  // Carregar dados iniciais
  carregarProdutos();
  carregarLocais();

  // Configurar o formulário
  const form = document.getElementById("formTransferencia");
  form.addEventListener("submit", handleSubmit);

  // Configurar eventos para atualizar o estoque quando produto ou local de origem mudarem
  const produtoSelect = document.getElementById("produtoId");
  const localOrigemSelect = document.getElementById("localOrigemId");
  const localDestinoSelect = document.getElementById("localDestinoId");
  const quantidadeInput = document.getElementById("quantidade");

  produtoSelect.addEventListener("change", async function () {
    // Limpar locais selecionados quando produto mudar
    localOrigemSelect.value = "";
    localDestinoSelect.value = "";

    // Atualizar a lista de locais de origem para mostrar apenas aqueles com estoque do produto
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

  localOrigemSelect.addEventListener("change", async function () {
    atualizarEstoqueDisponivel();
    // Atualizar o select de destino para excluir o local de origem
    await atualizarSelectDestino();
  });

  localDestinoSelect.addEventListener("change", validarLocaisDiferentes);
  quantidadeInput.addEventListener("input", validarQuantidadeEmTempoReal);
});

// Variáveis para controle do formulário
let produtos = [];
let locais = [];
let estoqueAtual = 0; // Estoque atual do produto no local de origem
let submitLocked = false; // Para prevenir submissões duplicadas

// Função para carregar produtos
async function carregarProdutos() {
  try {
    const response = await fetch("/api/produtos");
    const data = await response.json();

    if (response.ok) {
      produtos = Array.isArray(data)
        ? data
        : data.produtos
        ? data.produtos
        : data.data
        ? data.data
        : [];
      preencherSelectProdutos(produtos);
    } else {
      console.error("Erro ao carregar produtos:", data);
      showBanner(
        "Erro ao carregar produtos: " + (data.message || "Erro desconhecido"),
        "error"
      );
    }
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    showBanner("Erro de rede ao carregar produtos", "error");
  }
}

// Função para carregar locais
async function carregarLocais() {
  try {
    const response = await fetch("/api/locais");
    const data = await response.json();

    if (response.ok) {
      locais = Array.isArray(data)
        ? data
        : data.locais
        ? data.locais
        : data.data
        ? data.data
        : [];
      preencherSelectLocaisOrigem(locais);
      preencherSelectLocaisDestino(locais);
    } else {
      console.error("Erro ao carregar locais:", data);
      showBanner(
        "Erro ao carregar locais: " + (data.message || "Erro desconhecido"),
        "error"
      );
    }
  } catch (error) {
    console.error("Erro ao carregar locais:", error);
    showBanner("Erro de rede ao carregar locais", "error");
  }
}

// Função para carregar locais de origem que têm estoque do produto selecionado
async function carregarLocaisComEstoque(produtoId) {
  try {
    // Obter todos os locais primeiro
    const locaisResponse = await fetch("/api/locais");
    const locaisData = await locaisResponse.json();

    if (!locaisResponse.ok) {
      console.error("Erro ao carregar locais:", locaisData);
      showBanner(
        "Erro ao carregar locais: " +
          (locaisData.message || "Erro desconhecido"),
        "error"
      );
      await carregarLocais(); // Fallback to default behavior
      return;
    }

    // Filtrar apenas locais ativos
    const locaisAtivos = Array.isArray(locaisData)
      ? locaisData
      : locaisData.locais
      ? locaisData.locais
      : [];

    // Para cada local ativo, verificar o estoque do produto
    const locaisComEstoque = [];

    for (const local of locaisAtivos) {
      if (local.status === "Ativo") {
        // Obter estoque específico para este produto-neste-local
        const estoqueResponse = await fetch(
          `/api/movimentacoes/estoque?produto_id=${produtoId}&local_id=${local.id}`
        );
        const estoqueData = await estoqueResponse.json();

        if (estoqueResponse.ok && estoqueData.estoque_atual > 0) {
          // Adicionar local com estoque info
          locaisComEstoque.push({
            id: local.id,
            nome: local.nome,
            estoque_atual: estoqueData.estoque_atual,
            status: local.status,
          });
        }
      }
    }

    if (locaisComEstoque.length > 0) {
      preencherSelectLocaisOrigem(locaisComEstoque);
    } else {
      // Se nenhum local tiver estoque, mostrar mensagem e limpar opções
      document.getElementById("localOrigemId").innerHTML =
        '<option value="">Nenhum local com estoque</option>';
      showBanner(
        "Nenhum local com estoque disponível para este produto",
        "warning"
      );
    }
  } catch (error) {
    console.error("Erro ao carregar locais com estoque:", error);
    showBanner("Erro de rede ao carregar locais com estoque", "error");
    // Em caso de erro de rede, carregar todos os locais ativos
    await carregarLocais();
  }
}

// Função para preencher o select de produtos
function preencherSelectProdutos(produtos) {
  const select = document.getElementById("produtoId");
  if (!select) {
    console.error("Produto select element not found");
    return;
  }

  select.innerHTML = '<option value="">Selecione um produto</option>';

  if (produtos && Array.isArray(produtos)) {
    produtos.forEach((produto) => {
      if (produto.status === "Disponível") {
        // Apenas produtos disponíveis
        const option = document.createElement("option");
        option.value = produto.id;
        option.textContent = `${produto.nome} (${
          produto.unidade_medida || "un"
        })`;
        select.appendChild(option);
      }
    });
  }
}

// Função para preencher o select de locais de origem
function preencherSelectLocaisOrigem(locais) {
  const selectOrigem = document.getElementById("localOrigemId");
  if (!selectOrigem) {
    console.error("Local origem select element not found");
    return;
  }

  selectOrigem.innerHTML =
    '<option value="">Selecione o local de origem</option>';

  if (locais && Array.isArray(locais)) {
    locais.forEach((local) => {
      const id = local.id || local.local_id;
      const nome = local.nome || local.local_nome;

      // More robust status check - handle both cases
      const isActive = local.status === "Ativo" || local.status === undefined;

      if (nome && id && isActive) {
        const option = document.createElement("option");
        option.value = id;
        // Show stock information if available
        if (local.estoque_atual !== undefined) {
          option.textContent = `${nome} (Estoque: ${local.estoque_atual})`;
        } else {
          option.textContent = nome;
        }
        selectOrigem.appendChild(option);
      }
    });
  }
}

// Função para preencher o select de locais de destino
function preencherSelectLocaisDestino(locais) {
  const selectDestino = document.getElementById("localDestinoId");
  if (!selectDestino) {
    console.error("Local destino select element not found");
    return;
  }

  selectDestino.innerHTML =
    '<option value="">Selecione o local de destino</option>';

  if (locais && Array.isArray(locais)) {
    locais.forEach((local) => {
      const id = local.id || local.local_id;
      const nome = local.nome || local.local_nome;

      // More robust status check
      const isActive = local.status === "Ativo" || local.status === undefined;

      if (nome && id && isActive) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = nome;
        selectDestino.appendChild(option);
      }
    });
  }
}

// Função para atualizar o estoque disponível exibido (no local de origem)
async function atualizarEstoqueDisponivel() {
  const produtoId = document.getElementById("produtoId").value;
  const localOrigemId = document.getElementById("localOrigemId").value;
  const estoqueDiv = document.getElementById("estoqueDisponivel");

  if (!produtoId || !localOrigemId) {
    estoqueDiv.textContent =
      "Selecione produto e local de origem para ver o estoque";
    estoqueDiv.className = "estoque-info"; // Reset style
    estoqueAtual = 0;
    return;
  }

  try {
    const response = await fetch(
      `/api/movimentacoes/estoque?produto_id=${produtoId}&local_id=${localOrigemId}`
    );
    const data = await response.json();

    if (response.ok) {
      estoqueAtual = data.estoque_atual || 0;
      estoqueDiv.textContent = `Estoque disponível no local de origem: ${estoqueAtual}`;

      // Atualizar a classe CSS baseado no estoque
      if (estoqueAtual === 0) {
        estoqueDiv.className = "estoque-info estoque-zero";
      } else {
        estoqueDiv.className = "estoque-info estoque-disponivel";
      }

      // Validar quantidade atual (se já foi digitada)
      validarQuantidadeEmTempoReal();
    } else {
      console.error("Erro ao obter estoque:", data);
      estoqueDiv.textContent = "Erro ao obter estoque";
      estoqueDiv.className = "estoque-info estoque-erro";
      estoqueAtual = 0;
    }
  } catch (error) {
    console.error("Erro de rede ao obter estoque:", error);
    estoqueDiv.textContent = "Erro de rede ao obter estoque";
    estoqueDiv.className = "estoque-info estoque-erro";
    estoqueAtual = 0;
  }
}

// Função para atualizar o select de destino para excluir o local de origem
async function atualizarSelectDestino() {
  const localOrigemId = document.getElementById("localOrigemId").value;

  // Obter todos os locais ativos novamente para ter a lista completa
  try {
    const response = await fetch("/api/locais");
    const data = await response.json();

    if (response.ok) {
      const allLocais = Array.isArray(data)
        ? data
        : data.locais
        ? data.locais
        : data.data
        ? data.data
        : [];

      // Filtrar para excluir o local de origem e manter apenas locais ativos
      const filteredLocais = allLocais.filter(
        (local) => local.id != localOrigemId && local.status === "Ativo"
      );

      // Preencher apenas o select de destino
      preencherSelectLocaisDestino(filteredLocais);
    } else {
      console.error("Erro ao carregar locais para destino:", data);
      // Em caso de erro, usar a lista existente exceto o local de origem
      const filteredLocais = locais.filter(
        (local) => local.id != localOrigemId && local.status === "Ativo"
      );
      preencherSelectLocaisDestino(filteredLocais);
    }
  } catch (error) {
    console.error("Erro de rede ao carregar locais para destino:", error);
    // Em caso de erro de rede, usar a lista existente exceto o local de origem
    const filteredLocais = locais.filter(
      (local) => local.id != localOrigemId && local.status === "Ativo"
    );
    preencherSelectLocaisDestino(filteredLocais);
  }
}

// Função para validar que os locais de origem e destino são diferentes
function validarLocaisDiferentes() {
  const localOrigemId = document.getElementById("localOrigemId").value;
  const localDestinoId = document.getElementById("localDestinoId").value;
  const btnSubmit = document.getElementById("btnSubmit");
  const localDestinoError = document.getElementById("localDestinoError");

  if (localOrigemId && localDestinoId && localOrigemId === localDestinoId) {
    // Locais são iguais - erro
    localDestinoError.textContent =
      "Local de origem e destino devem ser diferentes";
    localDestinoError.classList.add("show");
    btnSubmit.disabled = true;
    return false;
  } else {
    // Locais são diferentes ou um deles não está selecionado ainda
    localDestinoError.classList.remove("show");
    localDestinoError.textContent = "";
    // Não habilitar o botão se outros erros existirem
    if (estoqueAtual > 0) {
      btnSubmit.disabled = false;
    }
    return true;
  }
}

// Função para validar quantidade em tempo real (quando usuário digita)
function validarQuantidadeEmTempoReal() {
  const quantidadeInput = document.getElementById("quantidade");
  const quantidade = parseFloat(quantidadeInput.value) || 0;
  const estoqueDiv = document.getElementById("estoqueDisponivel");

  if (!quantidadeInput.value) {
    // Limpa estilos se não houver valor
    quantidadeInput.classList.remove(
      "estoque-baixo",
      "estoque-acima",
      "estoque-normal"
    );
    return;
  }

  // Validar quantidade baseado no estoque disponível no local de origem
  if (quantidade > estoqueAtual) {
    // Quantidade acima do estoque disponível - ERRO
    quantidadeInput.classList.remove("estoque-normal", "estoque-baixo");
    quantidadeInput.classList.add("estoque-acima");

    // Desabilitar o botão de submit
    const btnSubmit = document.getElementById("btnSubmit");
    btnSubmit.disabled = true;

    // Mostrar mensagem de erro
    const quantidadeError = document.getElementById("quantidadeError");
    quantidadeError.textContent = `Quantidade solicitada (${quantidade}) excede o estoque disponível (${estoqueAtual})`;
    quantidadeError.classList.add("show");
  } else if (quantidade > estoqueAtual * 0.8) {
    // Quantidade acima de 80% do estoque - AVISO
    quantidadeInput.classList.remove("estoque-normal", "estoque-acima");
    quantidadeInput.classList.add("estoque-baixo");

    // Reabilitar botão de submit se estiver desabilitado por outro motivo
    const btnSubmit = document.getElementById("btnSubmit");
    if (btnSubmit.disabled) {
      // Só reabilitar se os locais forem diferentes
      if (validarLocaisDiferentes()) {
        btnSubmit.disabled = false;
      }
    }

    // Limpar mensagem de erro
    const quantidadeError = document.getElementById("quantidadeError");
    quantidadeError.classList.remove("show");
    quantidadeError.textContent = "";
  } else {
    // Quantidade normal - OK
    quantidadeInput.classList.remove("estoque-baixo", "estoque-acima");
    quantidadeInput.classList.add("estoque-normal");

    // Reabilitar botão de submit se necessário
    const btnSubmit = document.getElementById("btnSubmit");
    if (btnSubmit.disabled) {
      // Só reabilitar se os locais forem diferentes
      if (validarLocaisDiferentes()) {
        btnSubmit.disabled = false;
      }
    }

    // Limpar mensagem de erro
    const quantidadeError = document.getElementById("quantidadeError");
    quantidadeError.classList.remove("show");
    quantidadeError.textContent = "";
  }
}

// Função para lidar com o envio do formulário
async function handleSubmit(event) {
  event.preventDefault();

  // Prevenir submissões duplicadas
  if (submitLocked) return;

  // Verificar se quantidade não excede estoque no local de origem
  const quantidade =
    parseFloat(document.getElementById("quantidade").value) || 0;
  if (quantidade > estoqueAtual) {
    showBanner(
      `Quantidade solicitada (${quantidade}) excede o estoque disponível (${estoqueAtual})`,
      "error"
    );
    return;
  }

  // Verificar se locais de origem e destino são diferentes
  const localOrigemId = document.getElementById("localOrigemId").value;
  const localDestinoId = document.getElementById("localDestinoId").value;
  if (localOrigemId === localDestinoId) {
    showBanner("Local de origem e destino devem ser diferentes", "error");
    return;
  }

  // Coletar dados do formulário
  const formData = {
    produto_id: parseInt(document.getElementById("produtoId").value) || null,
    local_origem_id:
      parseInt(document.getElementById("localOrigemId").value) || null,
    local_destino_id:
      parseInt(document.getElementById("localDestinoId").value) || null,
    quantidade: parseFloat(document.getElementById("quantidade").value) || null,
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
    document.getElementById("btnSubmit").classList.add("loading");

    // Enviar dados para a API de transferência
    const response = await fetch("/api/movimentacoes/transferencia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      showBanner("Transferência registrada com sucesso!", "success");
      limparFormulario();
      // Atualizar o estoque exibido após a transferência
      await atualizarEstoqueDisponivel();
    } else {
      const errorMessage =
        result.message || result.error || "Erro ao registrar transferência";
      showBanner(errorMessage, "error");
    }
  } catch (error) {
    console.error("Erro ao registrar transferência:", error);
    showBanner("Erro de rede ao registrar transferência", "error");
  } finally {
    // Desbloquear submissão
    submitLocked = false;
    document.getElementById("btnSubmit").classList.remove("loading");
  }
}

// Função para validar o formulário
function validarFormulario(dados) {
  const erros = [];

  if (!dados.produto_id) {
    erros.push({ campo: "produtoId", mensagem: "Produto é obrigatório" });
  }

  if (!dados.local_origem_id) {
    erros.push({
      campo: "localOrigemId",
      mensagem: "Local de origem é obrigatório",
    });
  }

  if (!dados.local_destino_id) {
    erros.push({
      campo: "localDestinoId",
      mensagem: "Local de destino é obrigatório",
    });
  }

  if (
    dados.local_origem_id &&
    dados.local_destino_id &&
    dados.local_origem_id === dados.local_destino_id
  ) {
    erros.push({
      campo: "localDestinoId",
      mensagem: "Local de origem e destino devem ser diferentes",
    });
  }

  if (!dados.quantidade) {
    erros.push({ campo: "quantidade", mensagem: "Quantidade é obrigatória" });
  } else if (dados.quantidade <= 0) {
    erros.push({
      campo: "quantidade",
      mensagem: "Quantidade deve ser positiva",
    });
  } else if (dados.quantidade > estoqueAtual) {
    erros.push({
      campo: "quantidade",
      mensagem: `Quantidade excede estoque disponível (${estoqueAtual})`,
    });
  }

  return erros;
}

// Função para mostrar erros de validação
function mostrarErros(erros) {
  // Limpar erros anteriores
  limparErros();

  // Adicionar classes de erro e mostrar mensagens
  erros.forEach((erro) => {
    const campo = document.getElementById(erro.campo);
    const mensagem = document.getElementById(erro.campo.replace("Id", "Error"));

    if (campo) {
      campo.classList.add("error");
    }

    if (mensagem) {
      mensagem.textContent = erro.mensagem;
      mensagem.classList.add("show");
    }
  });
}

// Função para limpar erros de validação
function limparErros() {
  // Remover classes de erro e mensagens
  const campos = ["produtoId", "localOrigemId", "localDestinoId", "quantidade"];

  campos.forEach((campo) => {
    const input = document.getElementById(campo);
    const mensagem = document.getElementById(campo.replace("Id", "Error"));

    if (input) {
      input.classList.remove("error");
    }

    if (mensagem) {
      mensagem.classList.remove("show");
      mensagem.textContent = "";
    }
  });
}

// Função para limpar o formulário
function limparFormulario() {
  document.getElementById("formTransferencia").reset();

  // Limpar o display de estoque
  const estoqueDiv = document.getElementById("estoqueDisponivel");
  estoqueDiv.textContent =
    "Selecione produto e local de origem para ver o estoque";
  estoqueDiv.className = "estoque-info";
  estoqueAtual = 0;

  // Remover classes de validação visual
  const quantidadeInput = document.getElementById("quantidade");
  quantidadeInput.classList.remove(
    "estoque-normal",
    "estoque-baixo",
    "estoque-acima"
  );

  // Reabilitar botão se os problemas forem corrigidos
  const btnSubmit = document.getElementById("btnSubmit");
  btnSubmit.disabled = false;
}

// Função para mostrar/ocultar loading
function showLoading(show, message = "") {
  const btnSubmit = document.getElementById("btnSubmit");
  if (!btnSubmit) {
    console.error("Submit button not found");
    return;
  }

  const btnText = btnSubmit.querySelector(".btn-text");
  const btnLoading = btnSubmit.querySelector(".btn-loading");

  if (!btnText || !btnLoading) {
    console.error("Button text or loading elements not found");
    return;
  }

  if (show) {
    btnSubmit.disabled = true;
    btnText.style.display = "none";
    btnLoading.style.display = "inline";
    btnLoading.textContent = message || "Carregando...";
  } else {
    btnSubmit.disabled = false;
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
  }
}
