document.addEventListener("DOMContentLoaded", async () => {
  await Auth.checkAuth();
  const isManager = await Auth.isManager();

  const tbody = document.querySelector("#lotesTable tbody");

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
              ? `<button data-id="${l.id}" class="btn-edit">Detalhes</button>` 
              : ""}
          </td>`;
        tbody.appendChild(tr);
      });

      // Attach handlers
      document.querySelectorAll(".btn-edit").forEach((b) =>
        b.addEventListener("click", async (e) => {
          const id = e.currentTarget.dataset.id;
          // Redirect to entrada page with the lot pre-selected if possible
          window.location.href = `/entrada-estoque.html`;
        })
      );
    } else {
      tbody.innerHTML = '<tr><td colspan="8">Erro ao carregar lotes</td></tr>';
    }
  };

  const btnNew = document.getElementById("btnNew");

  if (!isManager && btnNew) btnNew.style.display = "none";

  btnNew.addEventListener("click", () => {
    // Redirect to entrada page
    window.location.href = "/entrada-estoque.html";
  });

  // Initial load
  load();
});