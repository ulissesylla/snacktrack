const express = require("express");
const router = express.Router();
const controller = require("../controllers/produtoController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/", controller.listarProdutos);
router.get("/:id", controller.buscarProdutoPorId);
router.post("/", requireRole(["Gerente"]), controller.criarProduto);
router.put("/:id", requireRole(["Gerente"]), controller.atualizarProduto);
router.delete("/:id", requireRole(["Gerente"]), controller.inativarProduto);

module.exports = router;
