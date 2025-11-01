document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const breadcrumbsEl = document.getElementById("breadcrumbs");

  // Initialize breadcrumbs
  const breadcrumbs = new Breadcrumbs(breadcrumbsEl);
  breadcrumbs.render();

  // Navigation links
  document.querySelectorAll(".nav-links a").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const route = a.dataset.route || "home";
      navigateTo(route);
    });
  });

  document.addEventListener("breadcrumb:navigate", (e) => {
    const route = e.detail && e.detail.route;
    if (route) navigateTo(route);
  });

  function navigateTo(route) {
    // Simple routing - update content and breadcrumbs
    const app = document.getElementById("app");
    app.querySelector("h1").textContent = `Página: ${route}`;
    breadcrumbs.add({
      title: route.charAt(0).toUpperCase() + route.slice(1),
      route,
    });
    breadcrumbs.render();
  }

  // Check API health
  fetch("/api/health")
    .then((r) => r.json())
    .then((j) => {
      statusEl.textContent = `API: ${j.ok ? "OK" : "NOK"} — ${j.env}`;
    })
    .catch((err) => {
      statusEl.textContent = `API: indisponível`;
    });
});
