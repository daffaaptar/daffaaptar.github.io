const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = "7213642207:AAEFs-siE2hWHUrRiAFCSWqI-wyxmbFtO20";
const server = express();
const bot = new TelegramBot(TOKEN, { polling: true });

const port = process.env.PORT || 5000;
const gameName = "botrex";
const Promise = require('bluebird');
Promise.config({
    cancellation: true
});

const queries = {};

bot.onText(/help/, (msg) => bot.sendMessage(msg.from.id, "This bot implements a T-Rex jumping game. Say /game if you want to play."));
bot.onText(/start|game/, (msg) => bot.sendGame(msg.from.id, gameName));
bot.on("callback_query", function (query) {
    if (query.game_short_name !== gameName) {
        bot.answerCallbackQuery(query.id, "Sorry, '" + query.game_short_name + "' is not available.");
    } else {
        queries[query.id] = query;
        let gameurl = `https://daffaaptar.github.io`;
        bot.answerCallbackQuery({
            callback_query_id: query.id,
            url: gameurl
        });
    }
});
bot.on("inline_query", function (iq) {
    bot.answerInlineQuery(iq.id, [{ type: "game", id: "0", game_short_name: gameName }]);
});

server.use(express.static(path.join(__dirname, 'public')));
server.get("/highscore/:score", async function (req, res, next) {
    if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();
    let query = queries[req.query.id];
    let options;
    if (query.message) {
        options = {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
        };
    } else {
        options = {
            inline_message_id: query.inline_message_id
        };
    }
    const score = parseInt(req.params.score);
    bot.setGameScore(query.from.id, score, options, function (err, result) {
        if (err) {
            console.error("Error setting game score:", err);
            return res.sendStatus(500);
        }
        // Mengirim pesan dengan highscore kepada pengguna
        bot.sendMessage(query.from.id, `Congratulations! Your new highscore is ${score}.`);
        res.sendStatus(200);
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
