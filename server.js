require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const http = require("http");
const workerRoutes = require("./routes/workerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const ingredientRoutes = require("./routes/ingredientRoutes");
const balanceRoutes = require("./routes/balanceRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const branchRoutes = require("./routes/branchRoutes");
const robosellRoutes = require("./routes/robosellRoute");

const app = express();
const server = http.createServer(app);

// CORS Configuration - Открыто для всех доменов
const corsOptions = {
  origin: true, // Разрешить доступ с любых доменов
  credentials: true, // Разрешить отправку cookies и авторизационных заголовков
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Authorization"],
  optionsSuccessStatus: 200, // Для legacy браузеров
};

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors(corsOptions));

// Request logging (только в development)
if (process.env.NODE_ENV !== "production") {
  app.use(requestLogger);
}

// Connect to MongoDB
connectDB();

// Security headers middleware
app.use((req, res, next) => {
  // Устанавливаем security заголовки
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Устанавливаем CSP заголовки
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://hadya-sklad-backend-production.up.railway.app; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self';"
  );

  next();
});

app.use("/api/worker", workerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dashboard", balanceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/robosell", robosellRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
    timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
  });
});

// Handle 404 errors
app.use((req, res) => {
  req.path === "/privacy"
    ? res.sendFile(__dirname + "/public/privacy.html")
    : req.path === "/terms"
    ? res.sendFile(__dirname + "/public/terms.html")
    : req.path === "/help"
    ? res.sendFile(__dirname + "/public/help.html")
    : res.status(404).sendFile(__dirname + "/public/404.html");
});

// Server startup
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishlayapti`);
  console.log(
    `Server started at: ${new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ")}`
  );
});
