document.addEventListener("DOMContentLoaded", async () => {
  await Auth.checkAuth();
  const isManager = await Auth.isManager();

  const tbody = document.querySelector("#lotesTable tbody");
  let editId = null;

  // Load products and locations for dropdowns
  const loadDropdownData = async () => {
    // Load products
    const produtosRes = await fetch("/api/produtos?onlyAvailable=true");
    if (produtosRes.ok) {
      const produtosData = await produtosRes.json();
      const produtoSelect = document.getElementById("produto_id");
      produtoSelect.innerHTML = '<option value="">Selecione um produto</option>';
      produtosData.produtos.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = `${p.nome} (${p.categoria})`;
        produtoSelect.appendChild(option);
      });
    }

    // Load locations
    const locaisRes = await fetch("/api/locais");
    if (locaisRes.ok) {
      const locaisData = await locaisRes.json();
      const localSelect = document.getElementById("localizacao_id");
      localSelect.innerHTML = '<option value="">Selecione um local</option>';
      locaisData.locais.forEach(l => {
        if(l.status === 'Ativo') {
          const option = document.createElement("option");
          option.value = l.id;
          option.textContent = l.nome;
          localSelect.appendChild(option);
        }
      });
    }
  };

  // Load lotes
  const load = async () => {
    const res = await fetch("/api/lotes");
    if (res.status === 200) {
      const j = await res.json();
      tbody.innerHTML = "";
      j.lotes.forEach((l) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${l.numero_lote}</td>
          <td>${l.produto_nome || ""}</td>
          <td>${l.quantidade != null ? Number(l.quantidade).toFixed(2) : ""}</td>
          <td>${l.data_validade ? new Date(l.data_validade).toLocaleDateString('pt-BR') : ""}</td>
          <td>${l.data_fabricacao ? new Date(l.data_fabricacao).toLocaleDateString('pt-BR') : ""}</td>
          <td>${l.local_nome || "N/A"}</td>
          <td>${l.data_entrada ? new Date(l.data_entrada).toLocaleDateString('pt-BR') : ""}</td>
          <td>
            ${isManager 
              ? `<button data-id="${l.id}" class="btn-edit">Editar</button>` 
              : ""}
          </td>`;
        tbody.appendChild(tr);
      });

      // Attach handlers
      document.querySelectorAll(".btn-edit").forEach((b) =>
        b.addEventListener("click", async (e) => {
          const id = e.currentTarget.dataset.id;
          const res = await fetch(`/api/lotes/${id}`);
          if (!res.ok) return showBanner("Lote não encontrado", 'error');
          const data = await res.json();
          const lote = data.lote;
          
          if (!lote) return showBanner("Lote não encontrado", 'error');
          editId = id;
          document.getElementById("modalTitle").textContent = "Editar Lote";
          btnSubmit.textContent = "Salvar";
          
          // Populate form
          await loadDropdownData(); // Ensure dropdowns are populated
          setTimeout(() => {
            document.getElementById("produto_id").value = lote.produto_id || "";
            document.getElementById("numero_lote").value = lote.numero_lote || "";
            document.getElementById("quantidade").value = lote.quantidade ?? "";
            document.getElementById("data_validade").value = lote.data_validade || "";
            document.getElementById("data_fabricacao").value = lote.data_fabricacao || "";
            document.getElementById("localizacao_id").value = lote.localizacao_id || "";
            clearErrors();
            setOpen(true);
          }, 200); // Small delay to ensure dropdowns are populated
        })
      );
    } else {
      tbody.innerHTML = '<tr><td colspan="8">Erro ao carregar lotes</td></tr>';
    }
  };

  // Modal elements
  const modal = document.getElementById("loteModal");
  const form = document.getElementById("loteForm");
  const btnNew = document.getElementById("btnNew");
  const btnClose = document.getElementById("modalClose");
  const btnCancel = document.getElementById("btnCancel");
  const btnSubmit = document.getElementById("btnSubmit");

  if (!isManager && btnNew) btnNew.style.display = "none";

  const setOpen = (open) => {
    modal.setAttribute("aria-hidden", String(!open));
    if (open) document.getElementById("numero_lote").focus();
    if (!open) {
      editId = null;
      document.getElementById("modalTitle").textContent = "Novo Lote";
      btnSubmit.textContent = "Criar";
      form.reset();
      clearErrors();
    }
  };

  btnNew.addEventListener("click", async () => {
    await loadDropdownData();
    setOpen(true);
  });
  btnClose.addEventListener("click", () => setOpen(false));
  btnCancel.addEventListener("click", () => setOpen(false));

  const clearErrors = () => {
    [
      "produto_id", "numero_lote", "quantidade", "data_validade", 
      "data_fabricacao", "localizacao_id"
    ].forEach((k) => {
      const el = document.getElementById("err-" + k);
      if (el) el.textContent = "";
    });
  };

  const validate = (data) => {
    clearErrors();
    let ok = true;
    
    if (!data.produto_id) {
      document.getElementById("err-produto_id").textContent = "Produto é obrigatório";
      ok = false;
    }
    
    if (!data.numero_lote || data.numero_lote.trim().length < 1) {
      document.getElementById("err-numero_lote").textContent = "Número do lote é obrigatório";
      ok = false;
    }
    
    if (
      data.quantidade === "" ||
      data.quantidade === null ||
      typeof data.quantidade === "undefined"
    ) {
      document.getElementById("err-quantidade").textContent = "Quantidade é obrigatória";
      ok = false;
    } else {
      const v = Number(data.quantidade);
      if (Number.isNaN(v) || v < 0) {
        document.getElementById("err-quantidade").textContent = "Quantidade deve ser um número não negativo";
        ok = false;
      }
    }
    
    if (data.data_validade && data.data_fabricacao) {
      const validade = new Date(data.data_validade);
      const fabricacao = new Date(data.data_fabricacao);
      if (validade < fabricacao) {
        document.getElementById("err-data_validade").textContent = "Data de validade deve ser posterior à data de fabricação";
        ok = false;
      }
    }
    
    if (data.data_validade) {
      const d = new Date(data.data_validade);
      if (isNaN(d.getTime())) {
        document.getElementById("err-data_validade").textContent = "Data de validade inválida";
        ok = false;
      } else {
        const today = new Date(new Date().toDateString());
        if (d < today) {
          document.getElementById("err-data_validade").textContent = "Data de validade deve ser hoje ou no futuro";
          ok = false;
        }
      }
    }
    
    if (data.data_fabricacao) {
      const d = new Date(data.data_fabricacao);
      if (isNaN(d.getTime())) {
        document.getElementById("err-data_fabricacao").textContent = "Data de fabricação inválida";
        ok = false;
      }
    }
    
    return ok;
  };

  let submitLocked = false;
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (submitLocked) return;
    
    const data = {
      produto_id: document.getElementById("produto_id").value,
      numero_lote: document.getElementById("numero_lote").value.trim(),
      quantidade: document.getElementById("quantidade").value,
      data_validade: document.getElementById("data_validade").value || null,
      data_fabricacao: document.getElementById("data_fabricacao").value || null,
      localizacao_id: document.getElementById("localizacao_id").value || null,
    };
    
    if (!validate(data)) return;
    submitLocked = true;
    btnSubmit.disabled = true;
    
    try {
      let res;
      if (editId) {
        res = await fetch(`/api/lotes/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/lotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      
      if (res.status === 200 || res.status === 201) {
        setOpen(false);
        form.reset();
        await load();
      } else {
        const j = await res.json().catch(() => ({}));
        showBanner(
          j.error ||
            (editId ? "Erro ao atualizar lote" : "Erro ao criar lote"), 
          'error'
        );
      }
    } catch (err) {
      console.error(err);
      showBanner("Erro de rede", 'error');
    }
    
    setTimeout(() => {
      submitLocked = false;
      btnSubmit.disabled = false;
    }, 1200);
  });

  // Initial load
  await loadDropdownData();
  load();
});