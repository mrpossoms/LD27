var gs = require('GameServer');
var MatchState = "Joining";
var MATCH_TIME = 10000;
var Timer = MATCH_TIME, EndTimer = 3000;
var Parts = [];

gs.Server(
	onJoin,
	onQuit,
	onUpdate,
	onMove,
	onCheckIn,
	onServerEmpty
);

function rand(min, max){
  return (Math.random() * max - min) + min;
}

function createParts(){
	Parts = [];
	var types = ['engine','armor','laser'];
	for(var i=40; i--;){
		Parts.push({
			ID: i,
			dx: rand(-1, 1),
			dy: rand(-1, 1),
			x: rand(-999, 999),
			y: rand(-999, 999),
			type: types[i%types.length]
		});
	}
}

function positionPlayers(players){
	for(var i = players.length; i--;){
		var r = (i / players.length) * Math.PI * 2;
		var p = players[i];
		if(!p) continue;
		players[i].x = Math.cos(r) * 100; players[i].y = Math.sin(r) * 100;
		players[i].dx = players[i].dy = 0;
		players[i].parts = [];
		players[i].Ready = false;
	}

	return players;
}

function onJoin(socket, name){
	if(MatchState != "Joining"){
		socket.emit('error', "Can't join a match that is in progress. Try again.");
		socket.disconnect('unauthorized');
		return null;
	}

	console.log(name + ' has joined the game!');
	var player = {
		ID: -1,
		Name: name,
		Ready: false
	};

	return player;
}

function onQuit(player, playerCount){
	if(playerCount == 0){
		MatchState = "Joining";
		Timer = MATCH_TIME;
		EndTimer = 3000;
	}
}

function onMove(player, moveData){
	switch(MatchState){
		case "Joining":
			player.Ready = moveData.Ready;
			break;
		case "Collecting":
			console.log("dx: " + moveData.dx + " dy: " + moveData.dy);
			player.dx = moveData.dx;
			player.dy = moveData.dy;
			break;
	}
}

function onCheckIn(player){

}

function onServerEmpty(){
	MatchState = "Joining";
	Timer = MATCH_TIME;
	EndTimer = 3000;
	console.log('Switching to Joining');
}

function getPlayerPartCount(p){
	var playerParts = {Engines: 0, Armor: 0, Lasers: 0};
	for(var j = p.parts.length; j--;){
		switch(p.parts[j].type){
			case "armor":
				++playerParts.Armor;
				break;
			case "engine":
				++playerParts.Engines;
				break;
			case "laser":
				++playerParts.Lasers;
				break;
		}
	}
	return playerParts;
}

function BuildingStage(Players,data){
	for(var i = Players.length; i--;){
		var p = Players[i];
		if(!p){
			continue;
		}

		data.Players.push({
			ID: p.ID,
			Name: p.Name,
			Parts: getPlayerPartCount(p)
		});
	}
	data.ServerMessage = "Build a ship! " + Math.floor((Timer -= dt) / 1000) + "...";

	return allReady && !noPlayers;
}

function CollectingStage(Players, data, dt) {
	var allOut = true;
	data.GrabbedParts = []; data.Parts = [];

	if(Timer - dt < 0){
		// DONE
		data.ServerMessage = 'Collecting phase finished!!!';
		data.ServerMessage += '<br/><br/>';

		for(var i = Players.length; i--;){
			var p = Players[i];
			if(!p){
				continue;
			}

			var pp = getPlayerPartCount(p);
			data.ServerMessage += p.Name + " - " + pp.Engines + "xEngines, " + pp.Armor + "xArmor, " + pp.Lasers + "xLasers";
			data.ServerMessage += "<br/><br/>";
		}

		EndTimer -= dt;

		if(EndTimer < 0){
			return true;
		}

		return false;
	}


	var rad = 32;
	var partRadius = rad * rad;

	// update players
	for(var i = Players.length; i--;){
		var p = Players[i];
		if(!p){
			continue;
		}
		var dx = p.dx * dt;
		var dy = p.dy * dt;

		if(p.x + dx < 1000 && p.x + dx > -1000)
			p.x += dx;

		if(p.y + dy < 1000 && p.y + dy > -1000)
			p.y += dy;

		p.dx *= 0.5; p.dy *= 0.5;

		for(var j = Parts.length; j--;){
			var part = Parts[j];
			if(!part) continue;
			dx = p.x - part.x; dy = p.y - part.y;
			var r = dx * dx + dy * dy;
			if(r <= partRadius){
				p.parts.push(part);
				//data.GrabbedParts.push(part);
				part.x = -10000;
				part.y = -10000;
				part.dx = part.dy = 0;
			}
		}

		var playerParts = getPlayerPartCount(p);

		data.Players.push({
			ID: p.ID,
			Name: p.Name,
			x: Math.floor(p.x),
			y: Math.floor(p.y),
			parts: playerParts
		});
		allOut = false;
	}

	var partData = [];
	for(var i = Parts.length; i--;){
		var p = Parts[i];

		if(!p) continue;

		var dx = p.dx * dt, dy = p.dy * dt;

		if(p.x + dx > 1000 || p.x + dx < -1000)
			p.dx = -p.dx;

		if(p.y + dy > 1000 || p.y + dy < -1000)
			p.dy = -p.dy;

		p.x += p.dx * dt;
		p.y += p.dy * dt;

		partData.push({
			ID: p.ID,
			x: Math.floor(p.x),
			y: Math.floor(p.y),
			type: p.type
		})
	}

	data.Parts = partData;
	data.ServerMessage = "Collect parts! " + Math.floor((Timer -= dt) / 1000) + "...";
}

function JoiningStage(Players, data) {
	var allReady = true, noPlayers = true;
	for(var i = Players.length; i--;){
		var p = Players[i];
		if(!p){
			continue;
		}
		if(!p.Ready){
			allReady = false;
		}

		noPlayers = false;
		data.Players.push({
			ID: p.ID,
			Name: p.Name,
			Ready: p.Ready
		});
	}

	if(Players.length < 1){
		data.ServerMessage = "Waiting for more players...";
		return false;
	}
	else if(!allReady){
		data.ServerMessage = "Waiting for players...";
	}
	else{
		data.ServerMessage = "Starting game!";
	}

	return allReady && !noPlayers;
}

function onUpdate(Players, dt){
    var data = {MatchState: MatchState, Players:[]};

    switch(MatchState){
    	case "Joining":
    		
    		if(JoiningStage(Players, data)){
    			MatchState = "Collecting";
    			console.log('Switching to collection');
    			Players = positionPlayers(Players);
    			createParts();

    		}
    		break;
    	case "Collecting":
    		if(CollectingStage(Players, data, dt)){
    			Timer = MATCH_TIME;
    			EndTimer = 3000;
    			MatchState = "Joining";
    		}
    		break;
    	case "Building":
    		if(BuildingStage(Players, data)){

    		}
    		break;
    }

	return data;
}