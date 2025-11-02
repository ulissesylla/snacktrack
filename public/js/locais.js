document.addEventListener("DOMContentLoaded", async () => {
  // ensure auth
  await Auth.checkAuth();
  const isManager = await Auth.isManager();
  // allow all authenticated users to view the list; only Gerentes see action buttons

  const tbody = document.querySelector("#locaisTable tbody");
  let editId = null;
  // showBanner(msg) and hideBanner() are provided by /js/notify.js (global)
  const load = async () => {
    const res = await fetch("/api/locais?onlyActive=false");
    if (res.status === 200) {
      const j = await res.json();
      tbody.innerHTML = "";
      j.locais.forEach((u) => {
        const tr = document.createElement("tr");
        const toggleLabel = u.status === "Inativo" ? "Ativar" : "Inativar";
        const toggleClass = "btn-toggle";
        tr.innerHTML = `<td>${u.nome}</td><td>${
          u.capacidade_maxima ?? ""
        }</td><td>${u.descricao ?? ""}</td><td>${u.status}</td><td>${
          isManager
            ? `<button data-id="${u.id}" class="btn-edit">Editar</button> <button data-id="${u.id}" class="${toggleClass}">${toggleLabel}</button>`
            : ""
        }</td>`;
        tbody.appendChild(tr);
      });
      document.querySelectorAll(".btn-toggle").forEach((b) =>
        b.addEventListener("click", async (e) => {
          e.preventDefault();
          const id = e.currentTarget.dataset.id;
          const label = (e.currentTarget.textContent || "").trim();
          const newStatus = label === "Ativar" ? "Ativo" : "Inativo";
          // Try to reuse the loaded list to build a full payload so validation passes
          let local = j.locais.find((x) => String(x.id) === String(id));
          try {
            e.currentTarget.disabled = true;
            if (!local) {
              // fallback: fetch single local
              const r = await fetch(`/api/locais/${id}`);
              if (r.ok) {
                const data = await r.json();
                local = data.local;
              }
            }
            if (!local) {
              showBanner("Local não encontrado");
              return;
            }
            const payload = {
              nome: local.nome,
              capacidade_maxima: local.capacidade_maxima ?? null,
              descricao: local.descricao ?? null,
              status: newStatus,
            };
            const res = await fetch(`/api/locais/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              // refresh list after successful update
              await load();
            } else {
              const jerr = await res.json().catch(() => ({}));
              showBanner(jerr.error || "Erro ao atualizar status");
            }
          } catch (err) {
            console.error("Erro ao atualizar status", err);
            showBanner("Erro de rede");
          } finally {
            setTimeout(() => {
              if (e && e.currentTarget) {
                e.currentTarget.disabled = false;
              }
            }, 0);
          }
        })
      );
      document.querySelectorAll(".btn-edit").forEach((b) =>
        b.addEventListener("click", (e) => {
          const id = e.target.dataset.id;
          const local = j.locais.find((x) => String(x.id) === String(id));
          if (!local) {
            showBanner("Local não encontrado");
            return;
          }
          editId = id;
          document.getElementById("modalTitle").textContent = "Editar local";
          btnSubmit.textContent = "Salvar";
          document.getElementById("nome").value = local.nome || "";
          document.getElementById("capacidade").value =
            local.capacidade_maxima ?? "";
          document.getElementById("descricao").value = local.descricao || "";
          document.getElementById("status").value = local.status || "Ativo";
          clearErrors();
          setOpen(true);
        })
      );
    } else {
      tbody.innerHTML = '<tr><td colspan="5">Erro ao carregar locais</td></tr>';
    }
  };

  // Modal-based flow
  const modal = document.getElementById("localModal");
  const form = document.getElementById("localForm");
  const btnNew = document.getElementById("btnNew");
  const btnClose = document.getElementById("modalClose");
  const btnCancel = document.getElementById("btnCancel");
  const btnSubmit = document.getElementById("btnSubmit");

  // Hide the New button for non-managers
  if (!isManager && btnNew) {
    btnNew.style.display = "none";
  }

  const setOpen = (open) => {
    modal.setAttribute("aria-hidden", String(!open));
    if (open) document.getElementById("nome").focus();
    if (!open) {
      editId = null;
      document.getElementById("modalTitle").textContent = "Novo Local";
      btnSubmit.textContent = "Criar";
      form.reset();
      clearErrors();
    }
  };

  btnNew.addEventListener("click", () => setOpen(true));
  btnClose.addEventListener("click", () => setOpen(false));
  btnCancel.addEventListener("click", () => setOpen(false));

  const clearErrors = () => {
    ["nome", "capacidade", "descricao", "status"].forEach((k) => {
      const el = document.getElementById("err-" + k);
      if (el) el.textContent = "";
    });
  };
  const validate = (data) => {
    clearErrors();
    let ok = true;
    if (!data.nome || data.nome.trim().length < 2) {
      document.getElementById("err-nome").textContent = "Nome muito curto";
      ok = false;
    }
    if (data.capacidade) {
      const v = Number(data.capacidade);
      if (Number.isNaN(v) || v <= 0) {
        document.getElementById("err-capacidade").textContent =
          "Capacidade deve ser número positivo";
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
      nome: document.getElementById("nome").value.trim(),
      capacidade_maxima: document.getElementById("capacidade").value,
      descricao: document.getElementById("descricao").value.trim(),
      status: document.getElementById("status").value,
    };
    if (!validate(data)) return;
    submitLocked = true;
    btnSubmit.disabled = true;
    try {
      let res;
      if (editId) {
        res = await fetch(`/api/locais/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/locais", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      if (res.status === 200 || res.status === 201) {
        setOpen(false);
        form.reset();
        load();
      } else {
        const j = await res.json().catch(() => ({}));
        showBanner(
          j.error ||
            (editId ? "Erro ao atualizar local" : "Erro ao criar local")
        );
      }
    } catch (e) {
      console.error(e);
      showBanner("Erro de rede");
    }
    setTimeout(() => {
      submitLocked = false;
      btnSubmit.disabled = false;
    }, 1200);
  });

  load();
});
