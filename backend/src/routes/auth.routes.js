const router = require("express").Router();
const { login, getMe, register, getUsers } = require("../controllers/auth.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/register", protect, authorize("admin"), register);
router.get("/users", protect, authorize("admin"), getUsers);

module.exports = router;
