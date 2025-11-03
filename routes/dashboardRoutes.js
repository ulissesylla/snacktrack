const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/stats", controller.getStats);
router.get("/ultimas-movimentacoes", controller.getUltimasMovimentacoes);

module.exports = router;