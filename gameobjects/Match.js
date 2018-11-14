module.exports = class Match {
    constructor(player1, player2, io, room){
        this.player1 = player1;
        this.player2 = player2;
        this.io = io;
        this.room = room;

        this.loopState = 'awaiting';
        this.matchQuited = false;

        this.setupSocket = this.setupSocket.bind(this);

        this.setupSocket(this.player1.id);
        this.setupSocket(this.player2.id);

        // Setup sockets rooms
        this.gameLoop();
    }

    setupSocket(socketid){
        let socket = this.io.sockets.connected[socketid];
        socket.on('setAction', data => {
            if(data.action === 'quit') this.endMatch(socketid);
            else this.updateNextAction(socketid, data.action);
        })
    }

    endMatch(){
        this.io.sockets.connected[this.player1.id].queueStatus = 'free';
        this.io.sockets.connected[this.player2.id].queueStatus = 'free';
        this.sendEventToPlayers('matchLeave');
        this.matchQuited = true; 
        if(this.destructCallback) this.destructCallback(this.room);
    }

    //Main game loop runs here
    async gameLoop(){
        this.sendEventToPlayers('matchStart');
        this.sendEventToPlayers('stateUpdate', this.state(this.player1.id), this.state(this.player2.id));
        while(this.winCheck() == 'notyet' && !this.matchQuited){
            this.loopState = 'running';

            this.sendEventToPlayers('roundStart');

            await this.countdown(5);

            this.sendEventToPlayers('roundEnd', this.constructAnimData(this.player1.id), this.constructAnimData(this.player2.id));

            // A problem that i faced is that when the round ends, i asked for sockets to push their actions to server
            // The problem is that i need to "wait" this results or server will run following lines without them
            // But if one of the players disconnect, i cant wait forever
            // My curr solution is to push the action at the moment player presses it, but it can lead to lag issues.
            await this.updateStates();

            this.sendEventToPlayers('stateUpdate', this.state(this.player1.id), this.state(this.player2.id));

            await this.countdown(1);
        }
        this.loopState = 'matchFinished';
        this.sendEventToPlayers('matchEnd', this.winCheck());
    }

    turnCheck(action1, action2){ //strings
        if(action1 === "shot"){
            if(this.player1.canShoot && action2 !== "shield") this.player2.getDamage(1);
            this.player1.shoot();
        }

        if(action2 === "shot"){
            if(this.player2.canShoot && action1 !== "shield") this.player1.getDamage(1);
            this.player2.shoot();
        }
        if(action1 === "reload") this.player1.reload();
        if(action2 === "reload") this.player2.reload();
    }

    winCheck(){
        if(this.player1.isDead && this.player2.isDead) return 'draw';
        if(this.player1.isDead) return '2win';
        if(this.player2.isDead) return '1win';
        return 'notyet';
    }

    sendEventToPlayers(message, data1, data2){
        if(this.matchQuited) return;
        this.io.to(this.player1.id).emit(message, data1);
        this.io.to(this.player2.id).emit(message, data2 || data1); //Send data2 if exists, or else send data 1
    }

    state(playerid){
        let isPlayer1 = (playerid == this.player1.id);
        return {
            player1: isPlayer1 ? this.player1 : this.player2,
            player2: isPlayer1 ? this.player2 : this.player1,
        };
    }

    updateNextAction(playerid, action){
        if(this.player1.id == playerid){
            this.p1_nextAction = action;
        } else if (this.player2.id == playerid){
            this.p2_nextAction = action;
        } else {return;} // To not send feedback
        this.io.sockets.connected[playerid].emit('updatedActionFeedback', action);
    }

    countdown(seconds){
        return new Promise(resolve => {
            setTimeout(resolve, seconds*1000);
        });
    }

    updateStates(){
        return new Promise(resolve => {
            this.turnCheck(this.p1_nextAction, this.p2_nextAction);
            this.p1_nextAction = undefined;
            this.p2_nextAction = undefined;
            resolve();
        });
    }

    constructAnimData(playerid){
        let isPlayer1 = (playerid == this.player1.id);
        return {
            playerAnim: isPlayer1 ? this.p1_nextAction : this.p2_nextAction,
            enemyAnim:  isPlayer1 ? this.p2_nextAction : this.p1_nextAction,
        }
    }
}