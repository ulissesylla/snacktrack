// Navbar component: renders a consistent top navigation across pages
// Depends on window.Auth being available (auth.js)
document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("navbar-root");
  if (!root) return;

  const header = document.createElement("header");
  header.className = "top-nav";
  header.innerHTML = `
    <div class="container">
      <div class="brand">SnackTrack</div>
      <nav class="nav-links" id="mainNav">
        <a href="#" data-route="home">Início</a>
        <a href="#" data-route="items">Itens</a>
        <a href="#" data-route="reports">Relatórios</a>
        <a href="#" data-route="settings">Configurações</a>
        <div id="navRight" style="margin-left:12px;display:flex;align-items:center;gap:12px"></div>
      </nav>
    </div>
  `;

  root.appendChild(header);

  // navigation behavior for data-route links
  root.querySelectorAll(".nav-links a[data-route]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const route = a.dataset.route;
      // dispatch breadcrumb navigation used by app.js
      window.dispatchEvent(
        new CustomEvent("breadcrumb:navigate", { detail: { route } })
      );
    });
  });

  // Render user section (async)
  const navRight = document.getElementById("navRight");
  try {
    if (window.Auth) {
      const me = await window.Auth.me();
      if (me && me.user) {
        const user = me.user;
        const nameEl = document.createElement("span");
        nameEl.textContent = user.nome;
        nameEl.style.fontWeight = "600";
        navRight.appendChild(nameEl);

        if (user.funcao === "Gerente") {
          const usersLink = document.createElement("a");
          usersLink.href = "/users.html";
          usersLink.textContent = "Usuários";
          usersLink.style.marginLeft = "8px";
          navRight.appendChild(usersLink);
        }

        const logoutBtn = document.createElement("a");
        logoutBtn.href = "#";
        logoutBtn.textContent = "Logout";
        logoutBtn.style.marginLeft = "8px";
        logoutBtn.addEventListener("click", (e) => {
          e.preventDefault();
          window.Auth.logout();
        });
        navRight.appendChild(logoutBtn);
      } else {
        // show login link when not authenticated
        const loginLink = document.createElement("a");
        loginLink.href = "/login.html";
        loginLink.textContent = "Entrar";
        navRight.appendChild(loginLink);
      }
    }
  } catch (err) {
    // ignore
  }
});
