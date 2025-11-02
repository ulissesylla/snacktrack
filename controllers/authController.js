const bcrypt = require("bcrypt");
const userService = require("../services/userService");

async function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha)
    return res.status(400).json({ error: "Missing credentials" });

  try {
    const user = await userService.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(senha, user.senha);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    req.session.user = { id: user.id, nome: user.nome, funcao: user.funcao };
    return res.json({ ok: true, user: req.session.user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err)
      return res.status(500).json({ error: "Failed to destroy session" });
    res.clearCookie("connect.sid");
    return res.json({ ok: true });
  });
}

function me(req, res) {
  if (req.session && req.session.user)
    return res.json({ user: req.session.user });
  return res.status(401).json({ error: "Unauthorized" });
}

module.exports = { login, logout, me };
