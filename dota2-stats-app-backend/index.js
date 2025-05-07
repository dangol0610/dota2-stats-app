const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = '7795601011:AAH7J-nggybwsn_kwDjPIIDgTNSio5K8loo'; // замени на свой токен
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

app.use(bodyParser.json());

// временное хранилище
const userAccountIds = {};

// сохранить accountId
app.post('/saveAccountId', (req, res) => {
  const { telegramId, accountId } = req.body;
  if (!telegramId || !accountId) {
    return res.status(400).json({ error: 'Missing telegramId or accountId' });
  }
  userAccountIds[telegramId] = accountId;
  console.log(`✅ Сохранён accountId ${accountId} для telegramId ${telegramId}`);
  res.json({ success: true });
});

// получить accountId
app.get('/getAccountId', (req, res) => {
  const telegramId = req.query.telegramId;
  if (!telegramId) {
    return res.status(400).json({ error: 'Missing telegramId' });
  }
  const accountId = userAccountIds[telegramId];
  if (!accountId) {
    return res.status(404).json({ error: 'AccountId not found for this telegramId' });
  }
  res.json({ accountId });
});

// отправить сообщение пользователю
app.post('/sendMessage', async (req, res) => {
  const { telegramId, message } = req.body;
  if (!telegramId || !message) {
    return res.status(400).json({ error: 'Missing telegramId or message' });
  }
  try {
    await bot.sendMessage(telegramId, message);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// старт сервера
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
