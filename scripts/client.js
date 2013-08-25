  var server = 'http://dev.kirkroerig.com';
  var socket = null;
  var loggedIn = false;
  var player   = null;
  var lastUpdate = 0;
  var piover2 = Math.PI / 2;

  var MatchState = "none";
  var CollectionPlayers = [], CollectionParts = [];
  var CamX = 0, CamY = 0;

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
			var lobby = $('#Box');
			lobby.fadeOut(500, function(){
				lobby.remove();
			});
			break;
		case "Collecting":
			$('#body').remove();
			break;
	}
}

function InitMatchState(data) {
	switch(MatchState){
		case "Joining":
			var box = $('<div id="Box" style="display:none;"/>')
				.appendTo('body').fadeIn(500);
			$('<div class="BlackBG"/>')
				.appendTo(box);
			var con = $('<div id="LobbyBox" class="Container">Lobby</div>').appendTo(box);
			break;
		case "Collecting":
			$('<div id="body" />').appendTo($('body'));
			break;
		case "Building":
			var div = $('<div id="body" />').appendTo($('body'));

			for (var i = data.Players.length - 1; i--;) {
				Things[i]
			};

			var eng = $('<div class="partButton">' + '</div>');
			eng.css('background', 'url("images/engine.png")');
			var arm = $('<div class="partButton">'+'</div>');
			arm.css('background', 'url("images/armor.png")');
			var laz = $('<div class="partButton">'+'</div>');
			laz.css('background', 'url("images/laser.png")');



			div.append(eng).append(arm).append(laz);
			div.appendTo($('body'));
			break;
	}
}

function UpdateCollectionRound(data){
	var players = data.GameData.Players;
	var parts   = data.GameData.Parts;
	var quitters = data.PlayersQuit;
	var taken    = data.GameData.GrabbedParts;
	var classes = ['phatty phattyEast','phatty phattyWest','phatty phattyNorth','phatty phattySouth'];

	for(var i=players.length; i--;){
		var p = players[i];
		var div = $('#' + p.ID);

		if(!div.length){
			var c = classes[Math.floor(Math.random() * classes.length)];
			div = $('<div id="' + p.ID + '" class="' + c + '">' + p.Name + '</div>')
				.appendTo($('#body'));

			div[0].x = p.x;
			div[0].y = p.y;

			if(p.ID == player.ID){
				 div.click(function(){
					socket.emit("RequestMove", {Ready: !player.Ready});
				});
			}
		}

		if(p.ID == player.ID){
			player = p;
		}

	}

	for(var i=quitters.length; i--;){
		var p = quitters[i];
		$('#' + p.ID).remove();
	}

	for(var i=parts.length; i--;){
		var p = parts[i];
		var div = $('#part' + p.ID);

		if(!div.length){
			div = $('<div id="part' + p.ID + '" class="part"></div>')
				.appendTo($('#body'));
			div.css('background', 'url("images/' + p.type + '.png")');
			div[0].x = p.x;
			div[0].y = p.y;
		}
	}


	for(var i=taken.length; i--;){
		var p = taken[i];
		var div = $('#part' + p.ID);
		div.remove();
	}


	$('#Info').html(data.GameData.ServerMessage);

	CollectionPlayers = players;
	CollectionParts = parts;
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
		info.text(msg);
	});

	socket.on('PushUpdate', function(data){
		var gd = data.GameData;
		if(gd.MatchState != MatchState){
			cleanUpMatchState();
			MatchState = gd.MatchState;
			InitMatchState(data);
		}

		switch(MatchState){
			case "Joining":
				UpdateLobby(data);
				break;
			case "Collecting":
				UpdateCollectionRound(data);
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
	}
	
	switch(MatchState){
		case "none":
		case "Joining":
			if(!loggedIn){
				bgSpinny += 0.00001 * dt;
				UpdateBackground(1000 * Math.cos(bgSpinny), 1000 * Math.sin(bgSpinny));
			}
			break;
		case "Collecting":
			if(loggedIn){
				var dx = 0, dy = 0;
				if($KB.IsKeyDown(87)){
					dy = -0.25;
				}

				if($KB.IsKeyDown(83)){
					dy = 0.25;
				}

				if($KB.IsKeyDown(65)){
					dx = -0.25;
				}

				if($KB.IsKeyDown(68)){
					dx = 0.25;
				}

				socket.emit('RequestCheckIn', player.Name);

				if(dx != 0 || dy != 0){
					var len = Math.sqrt(dx * dx + dy * dy);
					dx /= len; dy /= len;

					socket.emit('RequestMove', {
						dx: dx,
						dy: dy,
					});
				}
			}

			CamX += Math.floor((player.x - CamX) / 10);
			CamY += Math.floor((player.y - CamY) / 10);

			for(var i = CollectionPlayers.length; i--;){
				var p = CollectionPlayers[i];
				if(!p) continue;
				var div = $('#' + p.ID);
				if(div.length){

					var dx = p.x - div[0].x, dy = p.y - div[0].y;

					div[0].x += Math.floor((p.x - div[0].x) / 10);
					div[0].y += Math.floor((p.y - div[0].y) / 10);			


					var mat = Matrix.I(2);

					mat = mat.augment([
						[Math.floor(div[0].x - 64 - CamX + (window.innerWidth  >> 1))],
						[Math.floor(div[0].y - 64 - CamY + (window.innerHeight >> 1))]
					]);

					var mstr = CSSMatrix(mat);		

					div.removeClass();
					if(Math.abs(dx) > Math.abs(dy)){
						if(dx > 0){ // east
							div.addClass('phatty phattyEast');
						}
						else{ // west
							div.addClass('phatty phattyWest');
						}
					}
					else{
						if(dy > 0){ // south
							div.addClass('phatty phattySouth');
						}
						else{ // north
							div.addClass('phatty phattyNorth');
						}
					}

					div.css('transform', mstr)
					   .css('-ms-transform', mstr)
					   .css('-webkit-transform', mstr);
				}
			}

			bgSpinny += 0.01 * dt;
			for(var i = CollectionParts.length; i--;){
				var p = CollectionParts[i];
				if(!p) continue;
				var div = $('#part' + p.ID);
				if(div.length){

					var dx = p.x - div[0].x, dy = p.y - div[0].y;

					div[0].x += Math.floor((p.x - div[0].x) / 10);
					div[0].y += Math.floor((p.y - div[0].y) / 10);			


					var mat = Matrix.Rotation(bgSpinny);

					mat = mat.augment([
						[Math.floor(div[0].x - 64 - CamX + (window.innerWidth  >> 1))],
						[Math.floor(div[0].y - 64 - CamY + (window.innerHeight >> 1))]
					]);

					var mstr = CSSMatrix(mat);		

					div.css('transform', mstr)
					   .css('-ms-transform', mstr)
					   .css('-webkit-transform', mstr);
				}
			}
			UpdateBackground(-CamX, -CamY);

			break;
	}

});
