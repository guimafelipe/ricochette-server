const express = require("express");
const http = require("http");
const socket = require("socket.io");
const Lobby = require('./gameobjects/Lobby');
const MatchesManager = require('./gameobjects/MatchesManager')

const port = process.env.PORT || 4001;
const index = require("./routes/index");

const app = express();
app.use(index);

const server = http.createServer(app);

const io = socket(server);

const matchesManager = new MatchesManager(io);
const lobby = new Lobby(io, matchesManager);

function socketSetup(socket){
    socket.queueState = 'free';
    socket.name = 'new player';
    socket.on('enterQueue', (name) => {
        lobby.addToLobby(socket.id, name);
        socket.queueState = 'onQueue';
    });
    socket.on('exitQueue', () => {
        lobby.removeFromLobby(socket.id);
        socket.queueState = 'free';
    });
    socket.on('setName', name => {
        socket.name = name;
    });
    socket.on('startMatch', oponentid => {
        let match = lobby.createMatchWith(socket.id, oponentid);
        if(!match) {
            console.log('ERROR: ao criar partida entre ' + socket.id + ' e ' + oponentid + '.');
        }
    });
    socket.on('quitMatch', () => {
        socket.queueState = 'free';
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected")
        lobby.removeFromLobby(socket.id);
    });
    lobby.onLobbyUpdated();
}

io.on("connection", socket => {
    console.log("New client connected");
    socketSetup(socket);
});

server.listen(port, () => console.log(`Listening on port ${port}`));