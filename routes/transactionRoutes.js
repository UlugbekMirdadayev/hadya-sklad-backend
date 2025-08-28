const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const auth = require("../middleware/authMiddleware");
const postTelegramMessage = require("../config/tg");
const Admin = require("../models/Admin");
const Worker = require("../models/Worker");

// 💸 Pul kirimi
router.post("/cash-in", auth, async (req, res) => {
  try {
    const { amount, paymentType, description } = req.body;

    if (!amount || !paymentType) {
      return res.status(400).json({
        message:
          "Miqdor (amount) va to‘lov turi (paymentType) kiritilishi kerak.",
      });
    }

    if (!["cash", "card", "credit"].includes(paymentType)) {
      return res.status(400).json({
        message:
          "To‘lov turi noto‘g‘ri: 'cash' yoki 'card', 'credit' bo‘lishi kerak.",
      });
    }

    const transaction = new Transaction({
      type: "cash-in",
      amount,
      paymentType,
      description,
      createdBy: req.user.adminId || req.user.workerId,
    });

    const isUser = req.user.adminId
      ? await Admin.findById(req.user.adminId)
      : req.user.workerId
      ? await Worker.findById(req.user.workerId)
      : null;

    await transaction.save();

    postTelegramMessage(
      `\nTranzaksiya turi: <b>${
        transaction.type === "cash-in" ? "Kirim" : "Chiqim"
      }</b>` +
        `\nMiqdor: <b>${transaction.amount?.toLocaleString()} so'm</b>` +
        `\nTo'lov turi: <b>${
          transaction.paymentType === "cash"
            ? "Naqd"
            : transaction.paymentType === "card"
            ? "Karta"
            : "Nasiya"
        }</b>` +
        `\nIzoh: <b>${transaction.description}</b>` +
        `\nTranzaksiya ID: <b>${transaction._id}</b>` +
        `\nTranzaksiya qilingan vaqt: <b>${transaction.createdAt.toLocaleString()}</b>` +
        `\nTranzaksiya qilingan admin: <b>${isUser.fullName}</b>`
    )
      .then(() => {
        console.log("success post message telegram");
      })
      .catch((err) => {
        console.log("Telegramga xabar yuborishda xatolik:", err.response.data);
      });

    res.status(201).json({
      message: "Kirim muvaffaqiyatli qo‘shildi",
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: "Serverda xatolik", error: error.message });
  }
});

// 💸 Pul chiqimi
router.post("/cash-out", auth, async (req, res) => {
  try {
    const { amount, paymentType, description } = req.body;

    if (!amount || !paymentType) {
      return res.status(400).json({
        message:
          "Miqdor (amount) va to‘lov turi (paymentType) kiritilishi kerak.",
      });
    }

    if (!["cash", "card", "credit"].includes(paymentType)) {
      return res.status(400).json({
        message:
          "To‘lov turi noto‘g‘ri: 'cash' yoki 'card', 'credit' bo‘lishi kerak.",
      });
    }

    const transaction = new Transaction({
      type: "cash-out",
      amount,
      paymentType,
      description,
      createdBy: req.user.adminId || req.user.workerId,
    });

    await transaction.save();

    const isUser = req.user.adminId
      ? await Admin.findById(req.user.adminId)
      : req.user.workerId
      ? await Worker.findById(req.user.workerId)
      : null;

    postTelegramMessage(
      `\nTranzaksiya turi: <>${
        transaction.type === "cash-in" ? "Kirim" : "Chiqim"
      }</b>` +
        `\nMiqdor: <b>${transaction.amount?.toLocaleString()} so'm</b>` +
        `\nTo'lov turi: <b>${
          transaction.paymentType === "cash"
            ? "Naqd"
            : transaction.paymentType === "card"
            ? "Karta"
            : "Nasiya"
        }</b>` +
        `\nIzoh: <b>${transaction.description}</b>` +
        `\nTranzaksiya ID: <b>${transaction._id}</b>` +
        `\nTranzaksiya qilingan vaqt: <b>${transaction.createdAt.toLocaleString()}</b>` +
        `\nTranzaksiya qilingan admin: <b>${isUser.fullName}</b>`
    )
      .then(() => {
        console.log("success post message telegram");
      })
      .catch((err) => {
        console.log("Telegramga xabar yuborishda xatolik:", err.response.data);
      });

    res.status(201).json({
      message: "Chiqim muvaffaqiyatli qo‘shildi",
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: "Serverda xatolik", error: error.message });
  }
});

// 📄 Barcha tranzaksiyalar (sahifalash bilan)
router.get("/", auth, async (req, res) => {
  try {
    let { type, paymentType, page = 1, limit = 20 } = req.query;
    if (page < 1) {
      page = 1;
    }
    if (limit < 1) {
      limit = 1;
    }
    page = Math.round(page);
    limit = Math.round(limit);
    const filter = {};
    if (type) filter.type = type;
    if (paymentType) filter.paymentType = paymentType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Tranzaksiyalarni olishda xatolik",
      error: error.message,
    });
  }
});

// 💳 Barcha qarzlarni olish
router.get("/credits", auth, async (req, res) => {
  try {
    let { page = 1, limit = 20, status } = req.query;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    page = Math.round(page);
    limit = Math.round(limit);

    // Qarz tranzaksiyalarini filtrlash
    let filter = { 
      paymentType: "credit",
      type: "cash-in"
    };

    // Status bo'yicha filtrlash
    if (status === "active") {
      filter.amount = { $gt: 0 }; // Faqat miqdori 0 dan katta bo'lgan qarzlar
    } else if (status === "paid") {
      filter.amount = 0; // Faqat to'langan qarzlar (miqdori 0)
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [credits, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    // Umumiy qarz miqdorini hisoblash
    const totalDebtAmount = await Transaction.aggregate([
      { 
        $match: { 
          paymentType: "credit", 
          type: "cash-in", 
          amount: { $gt: 0 } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: "$amount" } 
        } 
      }
    ]);

    res.status(200).json({
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
      totalActiveDebt: totalDebtAmount.length > 0 ? totalDebtAmount[0].total : 0,
      credits,
    });
  } catch (error) {
    res.status(500).json({
      message: "Qarzlarni olishda xatolik",
      error: error.message,
    });
  }
});

// Qarzni to'lash (Nasiyani to'lash)
router.post("/credit/payment/:id", auth, async (req, res) => {
  try {
    const { paymentAmount, paymentType = "cash", description } = req.body;

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        message: "To'lov miqdori kiritilishi kerak va 0 dan katta bo'lishi kerak.",
      });
    }

    if (!["cash", "card"].includes(paymentType)) {
      return res.status(400).json({
        message: "To'lov turi 'cash' yoki 'card' bo'lishi kerak.",
      });
    }

    // Eski qarz tranzaksiyasini topish
    const creditTransaction = await Transaction.findById(req.params.id);
    if (!creditTransaction) {
      return res.status(404).json({ message: "Qarz tranzaksiyasi topilmadi" });
    }

    if (creditTransaction.paymentType !== "credit") {
      return res.status(400).json({ 
        message: "Bu tranzaksiya qarz (credit) emas" 
      });
    }

    if (creditTransaction.type !== "cash-in") {
      return res.status(400).json({ 
        message: "Faqat kirim (cash-in) qarzlarini to'lash mumkin" 
      });
    }

    if (creditTransaction.amount === 0) {
      return res.status(400).json({ 
        message: "Bu qarz allaqachon to'liq to'langan" 
      });
    }

    if (paymentAmount > creditTransaction.amount) {
      return res.status(400).json({
        message: "To'lov miqdori qarz miqdoridan katta bo'lishi mumkin emas",
      });
    }

    const currentUser = req.user.adminId || req.user.workerId;
    const isUser = req.user.adminId
      ? await Admin.findById(req.user.adminId)
      : req.user.workerId
      ? await Worker.findById(req.user.workerId)
      : null;

    // 1. Qarz to'lovi uchun yangi chiqim tranzaksiyasi yaratish
    const paymentTransaction = new Transaction({
      type: "cash-out",
      amount: paymentAmount,
      paymentType,
      description: `Qarz to'lovi: ${creditTransaction.description || 'Nasiya to\'lovi'} [ID: ${creditTransaction._id}]`,
      createdBy: currentUser,
    });

    await paymentTransaction.save();

    // 2. Eski qarz tranzaksiyasini yangilash
    const remainingDebt = creditTransaction.amount - paymentAmount;
    
    if (remainingDebt === 0) {
      // To'liq to'langan - qarz miqdorini 0 ga tenglaymiz, lekin nasiya yozuvi qoladi
      creditTransaction.amount = 0;
      creditTransaction.description = (creditTransaction.description || '') + ' [TO\'LIQ TO\'LANGAN]';
    } else {
      // Qisman to'langan - qoldiq miqdorni yangilaymiz
      creditTransaction.amount = remainingDebt;
      creditTransaction.description = (creditTransaction.description || '') + ` [${paymentAmount.toLocaleString()} so'm to'landi]`;
    }

    await creditTransaction.save();

    // Telegram xabarini yuborish
    const telegramMessage = 
      `\n🔄 <b>QARZ TO'LOVI</b>` +
      `\nTo'langan miqdor: <b>${paymentAmount.toLocaleString()} so'm</b>` +
      `\nTo'lov turi: <b>${paymentType === "cash" ? "Naqd" : "Karta"}</b>` +
      `\nQoldiq qarz: <b>${remainingDebt.toLocaleString()} so'm</b>` +
      `\nStatus: <b>${remainingDebt === 0 ? "TO'LIQ TO'LANGAN" : "QISMAN TO'LANGAN"}</b>` +
      `\nIzoh: <b>${description || "Yo'q"}</b>` +
      `\nTo'lovi ID: <b>${paymentTransaction._id}</b>` +
      `\nAsl qarz ID: <b>${creditTransaction._id}</b>` +
      `\nTo'lagan shaxs: <b>${isUser?.fullName || "Noma'lum"}</b>` +
      `\nVaqt: <b>${new Date().toLocaleString()}</b>`;

    postTelegramMessage(telegramMessage)
      .then(() => {
        console.log("Qarz to'lovi haqida Telegram xabari yuborildi");
      })
      .catch((err) => {
        console.log("Telegram xabar yuborishda xatolik:", err?.response?.data || err.message);
      });

    res.status(201).json({
      message: remainingDebt === 0 ? "Qarz to'liq to'landi" : "Qarz qisman to'landi",
      paymentTransaction,
      updatedCreditTransaction: creditTransaction,
      remainingDebt,
      isFullyPaid: remainingDebt === 0
    });

  } catch (error) {
    console.error("Qarz to'lashda xatolik:", error);
    res.status(500).json({
      message: "Qarz to'lashda xatolik",
      error: error.message,
    });
  }
});

// 📊 Muayyan qarz bo'yicha to'lov tarixini olish
router.get("/credit/:id/payments", auth, async (req, res) => {
  try {
    const creditTransaction = await Transaction.findById(req.params.id);
    if (!creditTransaction) {
      return res.status(404).json({ message: "Qarz tranzaksiyasi topilmadi" });
    }

    if (creditTransaction.paymentType !== "credit") {
      return res.status(400).json({ 
        message: "Bu tranzaksiya qarz emas" 
      });
    }

    // Ushbu qarz uchun barcha to'lovlarni topish
    // Description'da qarz ID'si mavjud bo'lgan chiqim tranzaksiyalarini qidirish
    const payments = await Transaction.find({
      type: "cash-out",
      description: { $regex: creditTransaction._id.toString() }
    }).sort({ createdAt: 1 });

    // Agar description'da ID yo'q bo'lsa, vaqt oralig'i bo'yicha qidirish (fallback)
    let fallbackPayments = [];
    if (payments.length === 0) {
      // Qarz yaratilgan sanadan keyin bo'lgan barcha to'lovlar
      fallbackPayments = await Transaction.find({
        type: "cash-out",
        createdAt: { $gte: creditTransaction.createdAt },
        description: { $regex: /qarz|to'lov|nasiya/i }
      }).sort({ createdAt: 1 }).limit(10);
    }

    res.status(200).json({
      creditTransaction,
      payments: payments.length > 0 ? payments : fallbackPayments,
      paymentCount: payments.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "To'lov tarixini olishda xatolik",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Transaction.findOneAndDelete({ id: req.params._id });
    if (!deleted) {
      return res.status(404).json({ message: "Transaction topilmadi" });
    }
    res.status(200).json({ message: "Transaction o‘chirildi" });
  } catch (err) {
    res.status(400).json({ message: "O‘chirishda xato", error: err.message });
  }
});

module.exports = router;
