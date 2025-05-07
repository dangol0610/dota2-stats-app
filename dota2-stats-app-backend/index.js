require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch").default; // добавим для запросов с backend
const fs = require("fs");
const path = "./accounts.json";

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://dota2-stats-app.vercel.app"; // URL твоего WebApp

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
bot.setWebHook(
  `https://dota2-stats-app-backend.onrender.com/bot${TELEGRAM_BOT_TOKEN}`
);

app.use(bodyParser.json());

let userAccountIds = {};
if (fs.existsSync(path)) {
  userAccountIds = JSON.parse(fs.readFileSync(path));
}

app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// API endpoint для сохранения accountId
app.post("/saveAccountId", (req, res) => {
  const { telegramId, accountId } = req.body;
  if (!telegramId || !accountId) {
    return res.status(400).json({ error: "Missing telegramId or accountId" });
  }
  userAccountIds[telegramId] = accountId;
  fs.writeFileSync(path, JSON.stringify(userAccountIds));
  console.log(
    `✅ Сохранён accountId ${accountId} для telegramId ${telegramId}`
  );
  res.json({ success: true });
});

// API endpoint для получения accountId
app.get("/getAccountId", (req, res) => {
  const telegramId = req.query.telegramId;
  console.log('▶️ Запрос accountId для telegramId:', telegramId);
  if (!telegramId) {
    return res.status(400).json({ error: "Missing telegramId" });
  }
  const accountId = userAccountIds[telegramId];
  if (!accountId) {
    return res
      .status(404)
      .json({ error: "AccountId not found for this telegramId" });
  }
  res.json({ accountId });
});

// API endpoint для отправки сообщений
app.post("/sendMessage", async (req, res) => {
  const { telegramId, message } = req.body;
  if (!telegramId || !message) {
    return res.status(400).json({ error: "Missing telegramId or message" });
  }
  try {
    await bot.sendMessage(telegramId, message);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const telegramId = msg.from.id;
  bot.sendMessage(
    telegramId,
    "👋 Привет! Пожалуйста, отправь мне свой Dota ID числом, чтобы я мог привязать твой аккаунт."
  );
});

// 🟢 Обработка текстовых сообщений от пользователя
bot.on("message", async (msg) => {
  const telegramId = msg.from.id;
  const text = msg.text?.trim();

  if (/^\d+$/.test(text)) {
    // если текст — это число (Dota ID)
    const accountId = text;
    try {
      // сохраняем через backend API (локально сохраняется, но показываю как POST)
      await fetch(
        `https://dota2-stats-app-backend.onrender.com/saveAccountId`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramId, accountId }),
        }
      );

      // отправляем кнопку для запуска WebApp
      await bot.sendMessage(
        telegramId,
        "✅ Твой Dota ID сохранён! Нажми кнопку ниже, чтобы открыть статистику:",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Открыть статистику", web_app: { url: FRONTEND_URL } }],
            ],
          },
        }
      );
    } catch (err) {
      console.error("Ошибка сохранения ID:", err);
      await bot.sendMessage(
        telegramId,
        "❌ Произошла ошибка при сохранении ID."
      );
    }
  } else {
    // если сообщение не ID
    await bot.sendMessage(
      telegramId,
      "Пожалуйста, отправь свой Dota ID числом (например, 123456789)."
    );
  }
});

// запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
});
