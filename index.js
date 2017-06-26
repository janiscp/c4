var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3003;

app.use(express.static(__dirname + '/public'));


var game = {};

function onConnection(socket){
    socket.on('disconnect', function() {
        console.log('Got disconnect!');
        console.log(game);

        if (game.p1 && game.p2) {
            game = {};
        }
    });
    
    socket.on('player_join', function(data) {

        if (game) {
            if (!game.p1) {
                game.p1 = true;
            }
            else if (!game.p2) {
                game.p2 = true;
            }
        }

        io.emit('player_join', game);
    });

    socket.on('player_move', function(data) {
        socket.broadcast.emit('player_move', data);
    });

    socket.on('switch_player', function(data) {
        game.currentPlayer = data;
        socket.broadcast.emit('switch_player', game);
    });

    socket.on('active_column', function(data) {
        socket.broadcast.emit('active_column', data);
    });
}


io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));