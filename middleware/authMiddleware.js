function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  if (req.path.startsWith("/api/"))
    return res.status(401).json({ error: "Unauthorized" });
  return res.redirect("/login.html");
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      if (req.path.startsWith("/api/"))
        return res.status(401).json({ error: "Unauthorized" });
      return res.redirect("/login.html");
    }
    const userRole = req.session.user.funcao;
    if (!roles.length || roles.includes(userRole)) return next();
    return res.status(403).json({ error: "Forbidden" });
  };
}

module.exports = { requireAuth, requireRole };
