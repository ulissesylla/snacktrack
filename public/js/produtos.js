document.addEventListener("DOMContentLoaded", async () => {
  await Auth.checkAuth();
  const isManager = await Auth.isManager();

  const tbody = document.querySelector("#produtosTable tbody");
  let editId = null;

  // load products (client-side filters will be applied later if needed)
  const load = async () => {
    const res = await fetch("/api/produtos?onlyAvailable=false");
    if (res.status === 200) {
      const j = await res.json();
      tbody.innerHTML = "";
      j.produtos.forEach((p) => {
        const tr = document.createElement("tr");
        const toggleLabel = p.status === "Indisponível" ? "Ativar" : "Inativar";
        tr.innerHTML = `<td>${p.nome}</td><td>${p.categoria || ""}</td><td>${
          p.tipo || ""
        }</td><td>${
          p.preco != null ? Number(p.preco).toFixed(2) : ""
        }</td><td>${p.estoque_minimo ?? ""}</td><td>${p.status}</td><td>${
          isManager
            ? `<button data-id="${p.id}" class="btn-edit">Editar</button> <button data-id="${p.id}" class="btn-toggle">${toggleLabel}</button>`
            : ""
        }</td>`;
        tbody.appendChild(tr);
      });

      // attach handlers
      document.querySelectorAll(".btn-edit").forEach((b) =>
        b.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const prod = j.produtos.find((x) => String(x.id) === String(id));
          if (!prod) return showBanner("Produto não encontrado", 'error');
          editId = id;
          document.getElementById("modalTitle").textContent = "Editar Produto";
          btnSubmit.textContent = "Salvar";
          // populate
          document.getElementById("nome").value = prod.nome || "";
          document.getElementById("descricao").value = prod.descricao || "";
          document.getElementById("preco").value = prod.preco ?? "";
          document.getElementById("unidade_medida").value =
            prod.unidade_medida || "unidade";
          document.getElementById("categoria").value =
            prod.categoria || "matéria-prima";
          document.getElementById("estoque_minimo").value =
            prod.estoque_minimo ?? "";
          document.getElementById("fabricante").value = prod.fabricante || "";
          document.getElementById("tipo").value = prod.tipo || "Matéria-prima";
          document.getElementById("data_validade").value = prod.data_validade
            ? prod.data_validade.split("T")[0]
            : "";
          document.getElementById("status").value = prod.status || "Disponível";
          clearErrors();
          setOpen(true);
        })
      );

      document.querySelectorAll(".btn-toggle").forEach((b) =>
        b.addEventListener("click", async (e) => {
          const id = e.currentTarget.dataset.id;
          const label = (e.currentTarget.textContent || "").trim();
          const newStatus = label === "Ativar" ? "Disponível" : "Indisponível";
          try {
            e.currentTarget.disabled = true;
            // fetch product to build full payload (backend validation requires preco)
            const r = await fetch(`/api/produtos/${id}`);
            if (!r.ok) return showBanner("Produto não encontrado", 'error');
            const data = await r.json();
            const prod = data.produto;
            const payload = {
              nome: prod.nome,
              descricao: prod.descricao || null,
              preco: prod.preco,
              unidade_medida: prod.unidade_medida,
              categoria: prod.categoria,
              estoque_minimo: prod.estoque_minimo,
              fabricante: prod.fabricante,
              tipo: prod.tipo,
              data_validade: prod.data_validade,
              status: newStatus,
            };
            const up = await fetch(`/api/produtos/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (up.ok) await load();
            else {
              const jerr = await up.json().catch(() => ({}));
              showBanner(jerr.error || "Erro ao atualizar produto", 'error');
            }
          } catch (err) {
            console.error(err);
            showBanner("Erro de rede", 'error');
          } finally {
            setTimeout(() => {
              if (e && e.currentTarget) {
                e.currentTarget.disabled = false;
              }
            }, 0);
          }
        })
      );
    } else {
      tbody.innerHTML =
        '<tr><td colspan="7">Erro ao carregar produtos</td></tr>';
    }
  };

  // modal
  const modal = document.getElementById("produtoModal");
  const form = document.getElementById("produtoForm");
  const btnNew = document.getElementById("btnNew");
  const btnClose = document.getElementById("modalClose");
  const btnCancel = document.getElementById("btnCancel");
  const btnSubmit = document.getElementById("btnSubmit");

  if (!isManager && btnNew) btnNew.style.display = "none";

  const setOpen = (open) => {
    modal.setAttribute("aria-hidden", String(!open));
    if (open) document.getElementById("nome").focus();
    if (!open) {
      editId = null;
      document.getElementById("modalTitle").textContent = "Novo Produto";
      btnSubmit.textContent = "Criar";
      form.reset();
      clearErrors();
    }
  };

  btnNew.addEventListener("click", () => setOpen(true));
  btnClose.addEventListener("click", () => setOpen(false));
  btnCancel.addEventListener("click", () => setOpen(false));

  const clearErrors = () => {
    [
      "nome",
      "descricao",
      "preco",
      "unidade_medida",
      "categoria",
      "estoque_minimo",
      "fabricante",
      "tipo",
      "data_validade",
      "status",
    ].forEach((k) => {
      const el = document.getElementById("err-" + k);
      if (el) el.textContent = "";
    });
  };

  const validate = (data) => {
    clearErrors();
    let ok = true;
    if (!data.nome || data.nome.trim().length < 2) {
      document.getElementById("err-nome").textContent =
        "Nome obrigatório (min 2)";
      ok = false;
    }
    if (
      data.preco === "" ||
      data.preco === null ||
      typeof data.preco === "undefined"
    ) {
      document.getElementById("err-preco").textContent = "Preço obrigatório";
      ok = false;
    } else {
      const v = Number(data.preco);
      if (Number.isNaN(v) || v <= 0) {
        document.getElementById("err-preco").textContent =
          "Preço deve ser número positivo";
        ok = false;
      }
    }
    if (data.estoque_minimo) {
      const v = Number(data.estoque_minimo);
      if (Number.isNaN(v) || v < 0) {
        document.getElementById("err-estoque_minimo").textContent =
          "Estoque mínimo inválido";
        ok = false;
      }
    }
    if (data.data_validade) {
      const d = new Date(data.data_validade);
      if (isNaN(d.getTime())) {
        document.getElementById("err-data_validade").textContent =
          "Data inválida";
        ok = false;
      } else {
        const today = new Date(new Date().toDateString());
        if (d < today) {
          document.getElementById("err-data_validade").textContent =
            "Data deve ser hoje ou no futuro";
          ok = false;
        }
      }
    }
    return ok;
  };

  let submitLocked = false;
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (submitLocked) return;
    const data = {
      nome: document.getElementById("nome").value.trim(),
      descricao: document.getElementById("descricao").value.trim(),
      preco: document.getElementById("preco").value,
      unidade_medida: document.getElementById("unidade_medida").value,
      categoria: document.getElementById("categoria").value,
      estoque_minimo: document.getElementById("estoque_minimo").value,
      fabricante: document.getElementById("fabricante").value.trim(),
      tipo: document.getElementById("tipo").value,
      data_validade: document.getElementById("data_validade").value || null,
      status: document.getElementById("status").value,
    };
    if (!validate(data)) return;
    submitLocked = true;
    btnSubmit.disabled = true;
    try {
      let res;
      if (editId) {
        res = await fetch(`/api/produtos/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/produtos", {
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
            (editId ? "Erro ao atualizar produto" : "Erro ao criar produto"), 'error'
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

  load();
});
