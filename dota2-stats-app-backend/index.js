require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch").default;
const fs = require("fs");
const path = "./accounts.json";
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://dota2-stats-app.vercel.app";

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
bot.setWebHook(
  `https://dota2-stats-app-backend.onrender.com/bot${TELEGRAM_BOT_TOKEN}`
);

app.use(cors());
app.use(bodyParser.json());

// 🔐 Загружаем сохранённые ID из файла (если есть)
let userAccountIds = {};
if (fs.existsSync(path)) {
  try {
    userAccountIds = JSON.parse(fs.readFileSync(path, "utf-8"));
    console.log("✅ Загружены привязки аккаунтов из файла");
  } catch (e) {
    console.error("❌ Ошибка чтения accounts.json:", e);
  }
}

// 🔄 Обновление Webhook
app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ✅ Сохраняем связку telegramId → accountId в файл
app.post("/saveAccountId", (req, res) => {
  const { telegramId, accountId } = req.body;

  if (!telegramId || !accountId) {
    console.warn("❌ Не передан telegramId или accountId");
    return res.status(400).json({ error: "Missing telegramId or accountId" });
  }

  // обязательно приводи к строке!
  const key = telegramId.toString();
  userAccountIds[key] = accountId;

  fs.writeFileSync(path, JSON.stringify(userAccountIds, null, 2));
  console.log("📦 accounts.json обновлён:", userAccountIds);

  res.json({ success: true });
});

// 🔍 Получаем привязанный accountId
app.get("/getAccountId", (req, res) => {
  const telegramId = req.query.telegramId;
  console.log("▶️ Запрос accountId для telegramId:", telegramId);
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

// ✉️ Отправка произвольного сообщения пользователю
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

// 🟢 /start — приветствие
bot.onText(/\/start/, (msg) => {
  const telegramId = msg.from.id;
  bot.sendMessage(
    telegramId,
    "👋 Привет! Пожалуйста, отправь мне свой Dota ID числом, чтобы я мог привязать твой аккаунт."
  );
});

// 🟢 Обработка сообщений от пользователя
bot.on("message", async (msg) => {
  const telegramId = msg.from.id;
  const text = msg.text?.trim();

  if (/^\d+$/.test(text)) {
    const accountId = text;

    try {
      // сохраняем через API, чтобы вся логика была централизованной
      await fetch(
        `https://dota2-stats-app-backend.onrender.com/saveAccountId`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramId, accountId }),
        }
      );

      // отправляем inline-кнопки
      await bot.sendMessage(
        telegramId,
        "✅ Твой Dota ID сохранён! Нажми кнопку ниже, чтобы открыть статистику или изменить ID:",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Открыть статистику", web_app: { url: FRONTEND_URL } }],
              [{ text: "Изменить ID", callback_data: "change_id" }],
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
    await bot.sendMessage(
      telegramId,
      "Пожалуйста, отправь свой Dota ID числом (например, 123456789)."
    );
  }
});

// 🔁 Кнопка "Изменить ID"
bot.on("callback_query", async (query) => {
  const telegramId = query.from.id;
  const data = query.data;

  if (data === "change_id") {
    delete userAccountIds[telegramId];

    try {
      fs.writeFileSync(path, JSON.stringify(userAccountIds, null, 2));
      console.log(`✅ Удалена привязка для telegramId ${telegramId}`);
    } catch (e) {
      console.error("❌ Ошибка при удалении ID:", e);
    }

    await bot.sendMessage(
      telegramId,
      "🔄 Пожалуйста, отправь мне новый Dota ID числом."
    );

    await bot.answerCallbackQuery(query.id);
  }
});

// 🚀 Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
