const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

console.log("🚀 Bot ishga tushdi...");

const bot = new TelegramBot(process.env.BOT_TOKEN || "8764593081:AAH6QVpTJtR3B6LIIXC0db-1enBGBqMGrh4", { polling: true });

let activeTrade = null;

// signal berish
async function generateSignal(chatId) {
    const res = await axios.get('https://api.twelvedata.com/price?symbol=XAU/USD&apikey=a282839310404d8a8aae309f576f37cf');
    const price = parseFloat(res.data.price);

    let signal, entry, sl, tp;

    if (price < 2000) {
        signal = "BUY";
        entry = price;
        sl = price - 10;
        tp = price + 20;
    } else {
        signal = "SELL";
        entry = price;
        sl = price + 10;
        tp = price - 20;
    }

    activeTrade = { signal, entry, sl, tp };

    bot.sendMessage(chatId,
`📊 SIGNAL

${signal}
Entry: ${entry}
SL: ${sl}
TP: ${tp}`);
}

// monitoring
async function checkTrade(chatId) {
    if (!activeTrade) return;

    const res = await axios.get('https://api.twelvedata.com/price?symbol=XAU/USD&apikey=a282839310404d8a8aae309f576f37cf');
    const price = parseFloat(res.data.price);

    if (activeTrade.signal === "BUY") {
        if (price <= activeTrade.sl) {
            bot.sendMessage(chatId, "❌ STOP LOSS HIT");
            activeTrade = null;
        } else if (price >= activeTrade.tp) {
            bot.sendMessage(chatId, "✅ TAKE PROFIT HIT");
            activeTrade = null;
        }
    } else {
        if (price >= activeTrade.sl) {
            bot.sendMessage(chatId, "❌ STOP LOSS HIT");
            activeTrade = null;
        } else if (price <= activeTrade.tp) {
            bot.sendMessage(chatId, "✅ TAKE PROFIT HIT");
            activeTrade = null;
        }
    }
}

const bootstrap = () => {

    bot.setMyCommands([
        {
            command: '/start',
            description: 'Botni ishga tushirish'
        },
        {
            command: '/signal',
            description: 'Signal olish'
        },
        {
            command: '/status',
            description: 'Aktiv trade holati'
        }
    ]);

    bot.on('message', async (msg) => {
        const text = msg.text;
        const chatId = msg.chat.id;

        console.log("Chat ID:", chatId);

        // START
        if (text === '/start') {
            return bot.sendMessage(
                chatId,
                `Assalomu alaykum ${msg.from?.first_name} 👋\n\n📊 Shoxrux Capital Signals Botga xush kelibsiz!\n\nBuyruqlar:\n/signal - signal olish\n/status - aktiv trade`
            );
        }

        // SIGNAL
        if (text === '/signal') {
            return generateSignal(chatId);
        }

        // STATUS
        if (text === '/status') {
            if (activeTrade) {
                return bot.sendMessage(chatId, `
📊 Faol Trade

${activeTrade.signal}

Entry: ${activeTrade.entry}
SL: ${activeTrade.sl}
TP: ${activeTrade.tp}
                `);
            } else {
                return bot.sendMessage(chatId, "❌ Hozir aktiv trade yo‘q");
            }
        }

        // UNKNOWN
        return bot.sendMessage(chatId, "❌ Buyruqni tushunmadim");
    });

    // ERROR
    bot.on('polling_error', (error) => {
        console.log("❌ Polling error:", error.message);
    });
};

bootstrap()

// har 10 sekund tekshiradi
setInterval(() => {
    if (activeTrade) {
        checkTrade(1265540221);
    }
}, 10000);

// const express = require('express');
// const app = express();

// const PORT = process.env.PORT || 3000;

// app.get('/', (req, res) => {
//   res.send('Bot ishlayapti 🚀');
// });

// app.listen(PORT, () => {
//   console.log(`Server ${PORT} portda ishlayapti`);
// });
