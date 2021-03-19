require('dotenv').config();
const WebSocket = require('ws');
const uuid = require('uuid');
const { Client } = require('discord.js');
const client = new Client();
const wss = new WebSocket.Server({
    port: 3000
});

client.once('ready', () => {
    console.log(`[INFO] Logged in as ${client.user.tag}`);
})

wss.on('connection', function connection(socket) {
    console.log('Connected');
    client.channels.cache.get(process.env.CHANNELID).send('サーバーからの接続を確立しました！');

    socket.send(JSON.stringify({
        "header": {
            "requestId": uuid.v4(),
            "messagePurpose": "subscribe",
            "version": 1,
            "messageType": "commandRequest"
        },
        "body": {
            "eventName": "PlayerMessage"
        }
    }));

    socket.on('message', packet => {
        const msg = JSON.parse(packet);
        if (msg.body.eventName === 'PlayerMessage' && msg.body.properties.Sender !== '外部') {
            client.channels.cache.get(process.env.CHANNELID).send(`${msg.body.properties.Sender}の発言: ${msg.body.properties.Message}`);
        }
    });

    client.on('message', message => {
        if (message.channel.id !== process.env.CHANNELID || message.author.bot || message.system || !message.guild) return;
        socket.send(JSON.stringify({
            "body": {
                "origin": {
                    "type": "player"
                },
                "commandLine": `say @a ${message.author.tag}の発言: ${message.content}`,
                "version": 1
            },
            "header": {
                "requestId": uuid.v4(),
                "messagePurpose": "commandRequest",
                "version": 1,
                "messageType": "commandRequest"
            }
        }))
    })

})

process.on('unhandledRejection', (reason, promise) => {
    console.error(reason);
})

client.login();