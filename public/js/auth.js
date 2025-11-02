const Auth = {
  async login(email, senha) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    return res.json();
  },
  async logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login.html";
  },
  async me() {
    const res = await fetch("/api/auth/me");
    if (res.status === 200) return res.json();
    return null;
  },
  async checkAuth() {
    const me = await this.me();
    if (!me) window.location.href = "/login.html";
    return me;
  },
  async isManager() {
    const me = await this.me();
    return me && me.user && me.user.funcao === "Gerente";
  },
};

window.Auth = Auth;
