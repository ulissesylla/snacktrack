const express = require("express");
const router = express.Router();
const controller = require("../controllers/alertaController");
const { requireAuth } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/", controller.listarAlertas);
router.post("/marcar-lido", controller.marcarComoLido);
router.get("/contagem", controller.getContagemAlertas);
// Endpoint adicional para detecção (útil para testes)
router.post("/executar-deteccao", controller.executarDetecaoAlertas);

module.exports = router;