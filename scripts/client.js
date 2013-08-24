  var server = 'http://localhost';
  var socket = null;
  var loggedIn = false;
  var player   = null;
  var lastUpdate = 0;
  var piover2 = Math.PI / 2;

  var MatchState = "none";

function UpdateBackground(x, y){
	divs = ['#StarsFar','#StarsMed','#StarsNear'];
	ratio = [0.1, 0.3, 0.6];

	for(var i = divs.length; i--;){
		var dx = x - 3000, dy = y - 3000;
		var m = CSSMatrix(Matrix.I(2).augment([[dx * ratio[i]], [dy * ratio[i]]]));
		var div = $(divs[i]);
		div.css('transform', m)
		.css('-ms-transform', m)
		.css('-webkit-transform', m);
	}
}

function CSSMatrix(mat){
var rowLen = mat.col(1).dimensions();
var  out = "", first = true;

for(var i = 1; i <= mat.cols(); i++){
	var col = mat.col(i);
	for(var j = 1; j <= rowLen; j++){
		out += (first ? '' : ',') + col.e(j);
		first = false;
	}
}

	return 'matrix('+out+')';
}

function cleanUpMatchState(){
	switch(MatchState){
		case "Joining":
			//TODO
			break;
	}
}

function InitMatchState() {
	switch(MatchState){
		case "Joining":
			var box = $('<div id="Box" style="display:none;"/>')
				.appendTo('body').fadeIn(500);
			$('<div class="BlackBG"/>')
				.appendTo(box);
			var con = $('<div id="LobbyBox" class="Container">Lobby</div>').appendTo(box);
			break;
	}
}

function UpdateLobby(data){
	var players = data.GameData.Players;
	var quitters = data.PlayersQuit;

	for(var i=players.length; i--;){
		var p = players[i];
		var div = $('#' + p.ID);

		if(!div.length){
			div = $('<div id="' + p.ID + '" class="LobbyPlayer">' + p.Name + '</div>')
				.appendTo($('#LobbyBox'));


			if(p.ID == player.ID){
				// you joined! add the ability to toggle ready
				var button = $('<div id="tog' + p.ID + '" class="LobbyToggle" />');

				 div.css('border', 'solid 2px #00FF00');
				 div.click(function(){
					socket.emit("RequestMove", {Ready: !player.Ready});
				});
			}
		}

		if(p.ID == player.ID){
			player = p;
		}

		div.text(p.Name + " - " + (p.Ready ? "Ready" : "Not ready"));
	}

	for(var i=quitters.length; i--;){
		var p = quitters[i];
		$('#' + p.ID).remove();
	}

	$('#Info').text(data.GameData.ServerMessage);
}

function start(name, info){
	socket.emit('JoinGame', name);

	socket.on('joined', function (data) {
		info.text('Joined game!');
		//info.fadeOut(500, function(){info.remove();});
		loggedIn = true;

		player = data.Player;
		Players = data.Others;
		Players.push(player);
	});

	socket.on('error', function(msg){
		//info.text('Error! ' + msg);
	});

	socket.on('PushUpdate', function(data){
		var gd = data.GameData;
		if(gd.MatchState != MatchState){
			cleanUpMatchState();
			MatchState = gd.MatchState;
			InitMatchState();
		}

		switch(MatchState){
			case "Joining":
				UpdateLobby(data);
				break;
		}		
	});


	var lastTime = (new Date()).getTime();
}

function GetPlayerName(cb){
	var txt = null, button = null;
	box = $('<div id="Box" style="display:none;"/>')
		.appendTo('body').fadeIn(500);
	$('<div class="BlackBG"/>').appendTo(box);
	var con = $('<div class="Container"></div>').appendTo(box);
	con.append(txt = $('<input id="name" type="text" style="width:100px;"/>'));
	con.append(button = $('<input type="button" value="Join"></input>'));
	button.click(function(){
		box.fadeOut(500, function(){
			var name = $('#name').val();
			box.remove();
			cb(name);
		})
	});
}

function ConnectToGame(){
	$('#Title').fadeOut(500, function(){
		$('#Title').remove();

		var info = $('<div id="Info">Enter your name!</div>')
					.appendTo($('body'))
					.fadeIn(500, function(){

						GetPlayerName(function(name){
							info.text('Connecting to server...');
							socket = io.connect(server);
							if(socket){
								info.text('Connected!');
								start(name, info);
							}
							else{
								info.text('Error! Could not reach server');
							}
						});
					});
	});
}

var bgSpinny = 0;
OPfoundation.Init(null, function(dt){
	// update
	if(loggedIn){
		socket.emit('RequestCheckIn', player.Name);

		var div = $('#' + player.ID);

	}
	
	if(MatchState=="Joining" || !loggedIn){
		bgSpinny += 0.00001 * dt;
		UpdateBackground(1000 * Math.cos(bgSpinny), 1000 * Math.sin(bgSpinny));
	}

});