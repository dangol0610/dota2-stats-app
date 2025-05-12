require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch").default;
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://dota2-stats-app.vercel.app";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
bot.setWebHook(`https://dota2-stats-app-backend.onrender.com/bot${TELEGRAM_BOT_TOKEN}`);

app.use(cors());
app.use(bodyParser.json());

// 🔄 Обновление Webhook
app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ✅ Сохраняем Telegram ID ↔ Dota ID в Supabase
app.post("/saveAccountId", async (req, res) => {
  const { telegramId, accountId } = req.body;
  if (!telegramId || !accountId) {
    return res.status(400).json({ error: "Missing telegramId or accountId" });
  }

  const { error } = await supabase
    .from("bindings")
    .upsert({ telegram_id: telegramId.toString(), account_id: accountId.toString() });

  if (error) {
    console.error("❌ Ошибка сохранения в Supabase:", error);
    return res.status(500).json({ error: "Failed to save" });
  }

  console.log(`✅ Supabase: Сохранён accountId ${accountId} для telegramId ${telegramId}`);
  res.json({ success: true });
});

// 🔍 Получение accountId по Telegram ID
app.get("/getAccountId", async (req, res) => {
  const telegramId = req.query.telegramId;
  if (!telegramId) {
    return res.status(400).json({ error: "Missing telegramId" });
  }

  const { data, error } = await supabase
    .from("bindings")
    .select("account_id")
    .eq("telegram_id", telegramId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({ accountId: data.account_id });
});

// ✉️ Отправка сообщений пользователю
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

// 🟢 Приветствие по /start
bot.onText(/\/start/, (msg) => {
  const telegramId = msg.from.id;
  bot.sendMessage(
    telegramId,
    "👋 Привет! Пожалуйста, отправь мне свой Dota ID числом, чтобы я мог привязать твой аккаунт."
  );
});

// 📩 Обработка сообщений от пользователя
bot.on("message", async (msg) => {
  const telegramId = msg.from.id;
  const text = msg.text?.trim();

  if (/^\d+$/.test(text)) {
    const accountId = text;

    try {
      await fetch("https://dota2-stats-app-backend.onrender.com/saveAccountId", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, accountId }),
      });

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
      await bot.sendMessage(telegramId, "❌ Произошла ошибка при сохранении ID.");
    }
  } else {
    await bot.sendMessage(
      telegramId,
      "Пожалуйста, отправь свой Dota ID числом (например, 123456789)."
    );
  }
});

// 🔁 Обработка кнопки "Изменить ID"
bot.on("callback_query", async (query) => {
  const telegramId = query.from.id;
  const data = query.data;

  if (data === "change_id") {
    const { error } = await supabase
      .from("bindings")
      .delete()
      .eq("telegram_id", telegramId.toString());

    if (error) {
      console.error("❌ Ошибка при удалении ID:", error);
    } else {
      console.log(`🗑️ Удалена привязка для telegramId ${telegramId}`);
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
