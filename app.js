var gs = require('GameServer');
var MatchState = "Joining";

gs.Server(
	onJoin,
	onQuit,
	onUpdate,
	onMove,
	onCheckIn
);

function rand(min, max){
  return (Math.random() * max - min) + min;
}

function onJoin(name){
	console.log(name + ' has joined the game!');
	var player = {
		ID: -1,
		Name: name,
		Ready: false
	};

	return player;
}

function onQuit(player){

}

function onMove(player, moveData){
	console.log("ONMOVE");
	switch(MatchState){
		case "Joining":
			console.log(moveData.Ready);
			player.Ready = moveData.Ready;
			break;
	}
}

function onCheckIn(player){

}

function JoiningStage(Players, data) {
	var allReady = true;
	for(var i = Players.length; i--;){
		var p = Players[i];
		if(!p){
			continue;
		}
		if(!p.Ready){
			allReady = false;
		}

		data.Players.push({
			ID: p.ID,
			Name: p.Name,
			Ready: p.Ready
		});
	}

	if(Players.length < 2){
		data.ServerMessage = "Waiting for more players...";
	}
	else if(!allReady){
		data.ServerMessage = "Waiting for players...";
	}
	else{
		data.ServerMessage = "Starting game!";
	}

	return allReady;
}

function onUpdate(Players, dt){
    var data = {MatchState: MatchState, Players:[]};

    switch(MatchState){
    	case "Joining":
    		
    		if(JoiningStage(Players, data)){

    		}
    		break;
    	case "StartingCollect":

    		break;
    }

	return data;
}