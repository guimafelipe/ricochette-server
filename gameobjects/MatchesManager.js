const Player = require('./Player');
const Match = require('./Match');

module.exports = class MatchesManager {
    constructor(io){
        this.matches = {};
        this.io = io;
        this.matchCounter = 0;
        this.deleteMatch = this.deleteMatch.bind(this);
    }

    createNewMatch(p1data, p2data){
        let player1 = new Player(p1data.name, p1data.id);
        let player2 = new Player(p2data.name, p2data.id);
        let matchid = this.matchCounter.toString();
        let match = new Match(player1, player2, this.io, matchid); 
        match.destructCallback = this.deleteMatch;
        this.matches[matchid] = match;
        this.matchCounter++;
        return match;
    }

    deleteMatch(matchid){
        delete this.matches[matchid];
    }

}