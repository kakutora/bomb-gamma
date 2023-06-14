const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const fs = require('fs');
const filePath = 'json/futsu_ga_ichiban.json';

app.use("/js", express.static(__dirname + "/js/"));
app.use("/img", express.static(__dirname + "/img/"));

app.use(
    "/io",
    express.static(__dirname + "/node_modules/socket.io/client-dist/")
);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/');
});

app.get('/game', (req, res) => {
    res.sendFile(__dirname + '/views/game/');
});

const root = io.of("/");
const rooms = {};

root.on('connection', (socket) => {
    console.log('page1');
    socket.on('join', (data) => {
        socket.join("waitingRoom");

        if (!rooms["waitingRoom"]) {
            rooms["waitingRoom"] = [];
        }
        rooms["waitingRoom"].push({
            id: socket.id,
            name: data
        });
        root.to('waitingRoom').emit('data', rooms["waitingRoom"]);

        socket.on('disconnecting', () => {
            let isb = rooms["waitingRoom"].find((el) => {
                el.id == socket.id;
            });
            console.log(isb);
            if (isb) {
                console.log(rooms["waitingRoom"]);
                console.log('退出しました');
            } else {
                console.log('抜けてないよ');
            };
        });
    });
});




















const game = io.of("/game");
const players = {};
let ready = 0;
let cc = 0;

game.on("connection", (socket) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('ファイルの読み込みエラー:', err);
            return;
        } else {
            const jsonData = JSON.parse(data);
            console.log('page2');

            const playerID = socket.id;
            cc++;

            players[playerID] = {
                x: jsonData.firstPlayerPos[cc - 1].x,
                y: jsonData.firstPlayerPos[cc - 1].y,
                pNum: cc
            };

            socket.emit("assignPlayerIdPos", { pid: playerID, y: players[playerID].y, x: players[playerID].x, pNum: players[playerID].pNum });
            game.emit('pos', players);

            socket.on("ready", () => {
                ready++;
                if (ready == 2) {
                    game.emit("startGame", jsonData);
                    ready = 0;
                }
            });

            socket.on("playerMove", (data) => {
                players[playerID] = data;
                game.emit("playerUpdate", players);
            });

            socket.on("disconnecting", () => {
                delete players[playerID];
                game.emit("playerUpdate", players);
                game.emit('reload');
                cc = 0;
            });
        }
    });
});

server.listen(3000, () => {
    console.log("Server started on port 3000");
});

const { v4: uuidv4 } = require('uuid');
const { SocketAddress } = require("net");

// 使用例:
const uuid = uuidv4(); // ランダムなUUIDを生成
console.log(uuid);