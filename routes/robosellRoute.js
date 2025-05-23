// routes/categoriesRoute.js
const express = require("express");
const router = express.Router();
const { getCategories, getCustomers } = require("../services/robosellService");

router.get("/categories", async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (err) {
    console.error("❌ Failed to get categories:", err.message);
    res.status(500).json({ error: "Server error while fetching categories" });
  }
});

router.get("/customers", async (req, res) => {
  try {
    const customers = await getCustomers({
      limit: req.query.limit || 10,
      offset: req.query.offset || 0,
    });
    res.json(customers);
  } catch (err) {
    console.error("❌ Failed to get customers:", err.message);
    res
      .status(500)
      .json({ error: err.message || "Server error while fetching customers" });
  }
});

module.exports = router;
