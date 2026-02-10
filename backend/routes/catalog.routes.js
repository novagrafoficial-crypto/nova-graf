const express = require("express");
const router = express.Router();

const {
  getCategories,
  createCategory
} = require("../controllers/catalog.controller");

router.get("/categories", getCategories);
router.post("/categories", createCategory);

module.exports = router;
