const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  getUserStats,
  approveUser,
  rejectUser,
  getPendingUsers,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");
const { validateRegister } = require("../middleware/validation");

router.use(protect);
router.use(authorize("admin"));

router.get("/stats", getUserStats);
router.get("/pending", getPendingUsers);
router.get("/", getAllUsers);
router.get("/:id", getUser);
router.post("/", validateRegister, createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.put("/:id/deactivate", deactivateUser);
router.put("/:id/activate", activateUser);
router.put("/:id/approve", approveUser);
router.put("/:id/reject", rejectUser);

module.exports = router;
