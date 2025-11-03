const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/stats", controller.getStats);
router.get("/ultimas-movimentacoes", controller.getUltimasMovimentacoes);
router.get("/consumo-medio", controller.getConsumoMedio);
router.get("/estatisticas-avancadas", controller.getEstatisticasAvancadas);
router.get("/rankings", controller.getRankings);
router.get("/estoque-atual", controller.getEstoqueAtual);

module.exports = router;