const express = require("express");
const router = express.Router();
const controller = require("../controllers/movimentacaoController");
const { requireAuth } = require("../middleware/authMiddleware");
const { validarEntrada, validarSaida, validarTransferencia } = require("../middleware/validacaoMovimentacao");

router.use(requireAuth);

router.post("/entrada", validarEntrada, controller.registrarEntrada);
router.post("/saida", validarSaida, controller.registrarSaida);
router.post("/transferencia", validarTransferencia, controller.registrarTransferencia);
router.get("/historico", controller.listarHistorico);

module.exports = router;
