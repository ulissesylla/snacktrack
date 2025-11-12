const express = require("express");
const router = express.Router();
const controller = require("../controllers/loteController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Todas as rotas de lotes requerem autenticação
router.use(requireAuth);

// Rotas CRUD básicas
router.get("/", controller.listarLotes);                    // Listar todos os lotes
router.get("/:id", controller.buscarLotePorId);            // Buscar lote por ID
router.post("/", requireRole(["Gerente"]), controller.criarLote);                    // Criar novo lote
router.put("/:id", requireRole(["Gerente"]), controller.atualizarLote);              // Atualizar lote existente
router.delete("/:id", requireRole(["Gerente"]), controller.removerLote);             // Remover lote

// Rotas específicas por produto
router.get("/produto/:produtoId", controller.buscarLotesPorProduto);  // Buscar lotes por produto
router.get("/produto/:produtoId/local/:localizacaoId", controller.buscarLotesPorProdutoLocalizacao);  // Buscar lotes por produto e localização

// Rotas para lotes com vencimento
router.get("/vencimento/proximo", controller.getLotesProximosValidade);  // Lotes próximos do vencimento
router.get("/vencimento/vencidos", controller.getLotesVencidos);        // Lotes vencidos

module.exports = router;