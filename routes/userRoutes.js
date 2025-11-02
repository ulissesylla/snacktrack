const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.get(
  "/",
  requireAuth,
  requireRole(["Gerente"]),
  userController.listUsers
);
router.post(
  "/",
  requireAuth,
  requireRole(["Gerente"]),
  userController.createUser
);
router.put(
  "/:id",
  requireAuth,
  requireRole(["Gerente"]),
  userController.updateUser
);
router.delete(
  "/:id",
  requireAuth,
  requireRole(["Gerente"]),
  userController.deleteUser
);

module.exports = router;
