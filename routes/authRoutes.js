const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/api/auth/login", authController.login);
router.post("/api/auth/logout", authController.logout);
router.get("/api/auth/me", authController.me);

module.exports = router;
