document.addEventListener("DOMContentLoaded", async () => {
  // ensure auth
  await Auth.checkAuth();
  const isManager = await Auth.isManager();
  if (!isManager) {
    document.body.innerHTML =
      '<main class="container"><h2>Proibido</h2><p>Você não tem permissão para ver esta página.</p></main>';
    return;
  }

  const tbody = document.querySelector("#usersTable tbody");
  let editId = null;
  const load = async () => {
    const res = await fetch("/api/usuarios");
    if (res.status === 200) {
      const j = await res.json();
      tbody.innerHTML = "";
      j.users.forEach((u) => {
        const tr = document.createElement("tr");
        // show toggle button: if Active -> Desativar, if Inativo -> Ativar
        const toggleLabel = u.status === "Inativo" ? "Ativar" : "Desativar";
        const toggleClass = "btn-toggle";
        tr.innerHTML = `<td>${u.nome}</td><td>${u.email}</td><td>${u.funcao}</td><td>${u.status}</td><td><button data-id="${u.id}" class="btn-edit">Editar</button> <button data-id="${u.id}" class="${toggleClass}">${toggleLabel}</button></td>`;
        tbody.appendChild(tr);
      });
      // attach toggle handlers
      document.querySelectorAll(".btn-toggle").forEach((b) =>
        b.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          // determine current label to decide new status
          const label = e.target.textContent.trim();
          const newStatus = label === "Ativar" ? "Ativo" : "Inativo";
          // send PUT to update status
          await fetch(`/api/usuarios/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          load();
        })
      );
      // attach edit handlers (populate modal and switch to edit mode)
      document.querySelectorAll(".btn-edit").forEach((b) =>
        b.addEventListener("click", (e) => {
          const id = e.target.dataset.id;
          const user = j.users.find((x) => String(x.id) === String(id));
          if (!user) {
            alert("Usuário não encontrado");
            return;
          }
          // set edit mode
          editId = id;
          document.getElementById("modalTitle").textContent = "Editar usuário";
          btnSubmit.textContent = "Salvar";
          // populate fields; password must be provided again per validation rules
          document.getElementById("nome").value = user.nome || "";
          document.getElementById("email").value = user.email || "";
          document.getElementById("funcao").value =
            user.funcao || "Colaborador";
          document.getElementById("senha").value = "";
          document.getElementById("confirm").value = "";
          clearErrors();
          setOpen(true);
        })
      );
    } else {
      tbody.innerHTML =
        '<tr><td colspan="5">Erro ao carregar usuários</td></tr>';
    }
  };
  // Modal-based creation flow
  const modal = document.getElementById("userModal");
  const form = document.getElementById("userForm");
  const btnNew = document.getElementById("btnNew");
  const btnClose = document.getElementById("modalClose");
  const btnCancel = document.getElementById("btnCancel");
  const btnSubmit = document.getElementById("btnSubmit");

  const setOpen = (open) => {
    modal.setAttribute("aria-hidden", String(!open));
    if (open) {
      // focus first field
      document.getElementById("nome").focus();
    }
    if (!open) {
      // reset edit state when closing
      editId = null;
      document.getElementById("modalTitle").textContent = "Novo usuário";
      btnSubmit.textContent = "Criar";
      form.reset();
      clearErrors();
    }
  };

  btnNew.addEventListener("click", () => setOpen(true));
  btnClose.addEventListener("click", () => setOpen(false));
  btnCancel.addEventListener("click", () => setOpen(false));

  // validation helpers
  const clearErrors = () => {
    ["nome", "email", "senha", "confirm", "funcao"].forEach((k) => {
      const el = document.getElementById("err-" + k);
      if (el) el.textContent = "";
    });
  };
  const validate = (data) => {
    clearErrors();
    let ok = true;
    if (!data.nome || data.nome.trim().length < 3) {
      document.getElementById("err-nome").textContent = "Nome muito curto";
      ok = false;
    }
    if (!data.email || !data.email.includes("@")) {
      document.getElementById("err-email").textContent = "Email inválido";
      ok = false;
    }
    // senha policy: min 10 chars and at least one digit
    if (!data.senha || data.senha.length < 10 || !/\d/.test(data.senha)) {
      document.getElementById("err-senha").textContent =
        "Senha deve ter ao menos 10 caracteres e incluir ao menos um número";
      ok = false;
    }
    if (data.senha !== data.confirm) {
      document.getElementById("err-confirm").textContent =
        "Senhas não coincidem";
      ok = false;
    }
    return ok;
  };

  let submitLocked = false;
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (submitLocked) return;
    const data = {
      nome: document.getElementById("nome").value.trim(),
      email: document.getElementById("email").value.trim(),
      senha: document.getElementById("senha").value,
      confirm: document.getElementById("confirm").value,
      funcao: document.getElementById("funcao").value,
    };
    if (!validate(data)) return;
    // disable submit for a short period to avoid duplicates
    submitLocked = true;
    btnSubmit.disabled = true;
    try {
      let res;
      if (editId) {
        // update existing user
        res = await fetch(`/api/usuarios/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: data.nome,
            email: data.email,
            senha: data.senha,
            funcao: data.funcao,
          }),
        });
      } else {
        // create new
        res = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: data.nome,
            email: data.email,
            senha: data.senha,
            funcao: data.funcao,
          }),
        });
      }
      if (res.status === 201 || res.status === 200) {
        setOpen(false);
        form.reset();
        load();
      } else {
        const j = await res.json().catch(() => ({}));
        alert(
          j.error ||
            (editId ? "Erro ao atualizar usuário" : "Erro ao criar usuário")
        );
      }
    } catch (e) {
      console.error(e);
      alert("Erro de rede");
    }
    // re-enable after 1.2s
    setTimeout(() => {
      submitLocked = false;
      btnSubmit.disabled = false;
    }, 1200);
  });

  load();
});
