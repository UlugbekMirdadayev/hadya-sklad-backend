const express = require("express");
const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const Ingredient = require("../models/Ingredient");
const auth = require("../middleware/authMiddleware");
const Inventory = require("../models/Inventory");

const router = express.Router();

// Dashboard olish

router.get("/", async (req, res) => {
  // Bugungi sotuvlar, Ombordagi mahsulotlar, Bugungi chiqimlar
  const { startDate, endDate } = req.query;

  let startDateTime, endDateTime;

  if (startDate && endDate) {
    // Если указаны даты в запросе, используем их
    startDateTime = new Date(startDate);
    endDateTime = new Date(endDate);
    // Устанавливаем конец дня для конечной даты
    endDateTime.setHours(23, 59, 59, 999);
  } else {
    // Если даты не указаны, используем сегодня
    const today = new Date();
    startDateTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    endDateTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );
  }

  try {
    // Транзакции за указанный период
    const periodTransactions = await Transaction.find({
      createdAt: { $gte: startDateTime, $lte: endDateTime },
      type: "cash-in",
    });
    const periodTransactionsState = periodTransactions.reduce(
      (acc, transaction) => acc + transaction.amount,
      0
    );

    // Расходы за указанный период
    const periodExpenses = await Transaction.find({
      createdAt: { $gte: startDateTime, $lte: endDateTime },
      type: "cash-out",
    });
    const periodExpensesState = periodExpenses.reduce(
      (acc, transaction) => acc + transaction.amount,
      0
    );

    // Все кредиты
    const allCredits = (
      await Transaction.find({
        paymentType: "credit",
        createdAt: { $gte: startDateTime, $lte: endDateTime },
      })
    ).reduce((acc, transaction) => acc + transaction.amount, 0);

    // Счетчик продуктов
    const productsCount = await Product.countDocuments({});

    const inventory = await Inventory.find({}).populate("product");

    const productsDetails = inventory.map((inventor) => ({
      quantity: inventor.quantity,
      price: inventor.product.costPrice,
      totalValue: inventor.quantity * inventor.product.costPrice,
    }));

    const productsCapital = productsDetails.reduce(
      (acc, product) => acc + product.totalValue,
      0
    );

    // Получаем капитал для ингредиентов
    const ingredients = await Ingredient.find(
      {},
      "name sku unit currentStock purchasePrice"
    );
    const ingredientsDetails = ingredients.map((ingredient) => ({
      quantity: ingredient.currentStock,
      price: ingredient.purchasePrice,
      totalValue: ingredient.currentStock * ingredient.purchasePrice,
    }));

    const ingredientsCapital = ingredientsDetails.reduce(
      (acc, ingredient) => acc + ingredient.totalValue,
      0
    );

    // Общий капитал
    const totalCapital = productsCapital + ingredientsCapital;

    const response = {
      transactionsState: periodTransactionsState,
      productsCount,
      inventoryCount: productsDetails?.length || 0,
      expensesState: periodExpensesState,
      allCredits,
      capital: {
        total: totalCapital,
        products: productsCapital,
        ingredients: ingredientsCapital,
      },
      dateRange: {
        startDate: startDateTime,
        endDate: endDateTime,
      },
    };

    res.status(200).json({
      message: "Dashboard muvaffaqiyatli olindi",
      dashboard: response,
    });
  } catch (error) {
    res.status(500).json({
      message: "Dashboardni olishda xatolik yuz berdi",
      error: error.message,
    });
  }
});

module.exports = router;
