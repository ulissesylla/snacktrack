const express = require("express");
const router = express.Router();
const controller = require("../controllers/loteController");
const auth = require("../middleware/auth");

// Todas as rotas de lotes requerem autenticação
router.use(auth);

// Rotas CRUD básicas
router.get("/", controller.listarLotes);                    // Listar todos os lotes
router.get("/:id", controller.buscarLotePorId);            // Buscar lote por ID
router.post("/", controller.criarLote);                    // Criar novo lote
router.put("/:id", controller.atualizarLote);              // Atualizar lote existente
router.delete("/:id", controller.removerLote);             // Remover lote

// Rotas específicas por produto
router.get("/produto/:produtoId", controller.buscarLotesPorProduto);  // Buscar lotes por produto

// Rotas para lotes com vencimento
router.get("/vencimento/proximo", controller.getLotesProximosValidade);  // Lotes próximos do vencimento
router.get("/vencimento/vencidos", controller.getLotesVencidos);        // Lotes vencidos

module.exports = router;