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
// Nova rota para obter estoque atual
router.get("/estoque", controller.obterEstoqueAtual);
// Nova rota para histórico avançado com filtros
router.get("/historico-avancado", controller.listarHistoricoAvancado);

module.exports = router;
