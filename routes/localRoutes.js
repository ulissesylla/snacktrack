const express = require("express");
const router = express.Router();
const controller = require("../controllers/localController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// All routes require auth
router.use(requireAuth);

// GET /api/locais - list
router.get("/", controller.listarLocais);

// GET /api/locais/:id
router.get("/:id", controller.buscarLocalPorId);

// POST /api/locais - only Gerente
router.post("/", requireRole(["Gerente"]), controller.criarLocal);

// PUT /api/locais/:id - only Gerente
router.put("/:id", requireRole(["Gerente"]), controller.atualizarLocal);

// DELETE /api/locais/:id - soft delete - only Gerente
router.delete("/:id", requireRole(["Gerente"]), controller.inativarLocal);

module.exports = router;
