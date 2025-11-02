const userService = require("../services/userService");

async function listUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function createUser(req, res) {
  try {
    const payload = req.body;
    const user = await userService.createUser(payload);
    return res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message || "Bad Request" });
  }
}

async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);
    const payload = req.body;
    const user = await userService.updateUser(id, payload);
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message || "Bad Request" });
  }
}

async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);
    await userService.deleteUser(id);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message || "Bad Request" });
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
