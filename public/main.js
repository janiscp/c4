'use strict';

(function() {

    var socket = io();
    var player = "p1";
    var playGame = {};

    // game board
    var rowSize = 6, colSize = 7;
    var gameBoard = createBoard(rowSize, colSize);
    var discCounter = rowSize * colSize;

    //
    var currentSpace = [0, 0, 0, 0, 0, 0, 0];
    var lastMove = {x:0, y:0, p:0};
    var p1 = {};
    var p2 = {};


    // sockets
    socket.emit('player_join', {});

    socket.on('player_join', function (data) {
        if (playGame.player == null) {
            playGame.player = "p2";
        }
        else  {
            playGame.player = "p1";
        }

        if (data.p2 && data.p1) {
            $("#dialog-message").dialog('close');

            var player_name = "";
            if (playGame.player == "p1") {
                player_name = "You are Player RED (Your move first)";
            }
            else if (playGame.player == "p2") {
                player_name = "You are Player YELLOW";
            }

            $("div#player-status").html(player_name);
        }
    });

    socket.on('switch_player', function (data) {
        //console.log(data);
    });

    socket.on('active_column', function (data) {
        var color = data.color;
        
        if (data.color == 'red') {
            if (playGame.player != player) {
                color = 'pink';
            }
        }
        else if (data.color == 'gold') {
            if (playGame.player != player) {
                color = 'yellow';
            }
        }

        hoverColumn(data.column, color);
    });

    socket.on('player_move', function (data) {
        move(data);
        hoverColumn(data, "white");
    });


    /**
     *  functions related to board
     */

    function createBoard(numRows, numCols) { 
        var row; 
        var col; 
        var grid = []; 
    
        for (row = 0; row < numRows; row++) {
            grid[row] = [];
    
            for (col = 0; col < numCols; col++) {
                grid[row][col] = "row" + row + " col" + col + " empty";
            }
        }

        return grid;
    }

    function drawBoard() {
        var ulGrid = document.getElementById("grid");
        ulGrid.innerHTML= "";

        // draw the header
        for (var j = 0; j < colSize; j++) {
            var listItem = document.createElement("li");

            listItem.className="row col" + j + " header"; 
            listItem.id="row_col"+j;
            ulGrid.appendChild(listItem);
        }

        // draw the spaces
        for (var i = rowSize - 1; i >= 0; i--) { 
            for (var j = 0; j < colSize; j++) {
                var listItem = document.createElement("li");

                if (listItem.addEventListener) {
                    listItem.addEventListener("click", function(){
                        playerMove(this)
                    }, false);
                } 
                else {
                    listItem.attachEvent('onclick', playerMove(this));
                }  

                listItem.className = gameBoard[i][j]; 
                listItem.id = "row" + i + "col" + j;

                listItem.onmouseover = function() {
                    var color = "";

                    if (player == "p1") {
                        color = "red";
                    }
                    else {
                        color = "gold";
                    }

                    activeColumn(this, color);
                };

                listItem.onmouseout = function() {
                    activeColumn(this, "white");
                };

                ulGrid.appendChild(listItem);
            }
        }
    }

    function activeColumn(elem, color) {
        var col = parseInt(elem.className.substr(8, 1));
        
        hoverColumn(col, color);
    }

    function hoverColumn(col, color) {
        var hdr = document.getElementById("row_col" + col);

        if ((playGame.player != player && color == "red") ||
            (playGame.player != player && color == "gold")
            ) {
            color = "white";
            console.log("Awaiting oppenent's move.");
            //$("div#player-status").html("Awaiting opponent's move.");
        }
        else if (playGame.player == player) {
            socket.emit('active_column', { column: col, color: color});
        }

        hdr.style.backgroundColor = color;
    }



    /**
     *  functions related to player executions
     * 
     */

    function playerMove(disc) { 
        if (playGame.player != player) {
            return;
        }
        var col = parseInt(disc.className.substr(8, 1));
        
        move(col);
        socket.emit('player_move', col);
    }


    function move(col) {
        var x = currentSpace[col];
        var space = document.getElementById("row" + x + "col" + col);
        var currentPlayer = [];

        if (x >= rowSize || col >= colSize){
            return;
        }

        gameBoard[x][col] = gameBoard[x][col].replace("empty", player);
        space.className = gameBoard[x][col];

        lastMove.x = x;
        lastMove.y = col;
        lastMove.p = player;
        currentSpace[col] = ++x;

        if (player == 'p1') {
            currentPlayer = p1;
        }
        else {
            currentPlayer = p2;
        }

        if (!currentPlayer['row' + lastMove.x]) {
            currentPlayer['row' + lastMove.x] = [col];
        }
        else {
            currentPlayer['row' + lastMove.x].push(col);
        }

        if (!currentPlayer['col' + lastMove.y]) {
            currentPlayer['col' + lastMove.y] = [lastMove.x];
        }
        else {
            currentPlayer['col' + lastMove.y].push(lastMove.x);
        }

        if (!currentPlayer['row' + lastMove.x + 'col' + lastMove.y]) {
            currentPlayer['row' + lastMove.x + 'col' + lastMove.y] = 1;
        }

        checkPattern(player, currentPlayer);
        switchPlayer();
    }



    function switchPlayer (argument) {
        if (player == "p1"){
            player = "p2";
        }
        else {
            player = "p1";
        }

        socket.emit('switch_player', player);
    }


    function checkPattern(player, p) {
        var arrDraw = Object.keys(currentSpace).map(function (key) { return currentSpace[key]; });
        if (arrDraw) {
            if (arrDraw[0] >= 6 && arrDraw[1] >= 6 && arrDraw[2] >= 6 && arrDraw[3] >= 6 && arrDraw[4] >= 6 && arrDraw[5] >= 6 && arrDraw[6] >= 6) {
                console.log("It's a draw");
                announceWinner("draw");
            }
        }
        
        Object.keys(p).forEach(function(key) {
            var arr = null;

            if (key.includes('row') && key.includes('col')) { debugger;
                var rowStart = parseInt(key.substr(3, 1));
                var colStart = parseInt(key.substr(7, 1));
                var ctr = 0;
                if (p.hasOwnProperty('row'+ (rowStart) +'col'+ (colStart)) && 
                    p.hasOwnProperty('row'+ (rowStart+1) +'col'+ (colStart+1)) && 
                    p.hasOwnProperty('row'+ (rowStart+2) +'col'+ (colStart+2)) && 
                    p.hasOwnProperty('row'+ (rowStart+3) +'col'+ (colStart+3))) {
                    console.log(player + ' wins!');
                    announceWinner(player);
                }

                if (p.hasOwnProperty('row'+ (rowStart) +'col'+ (colStart)) && 
                    p.hasOwnProperty('row'+ (rowStart+1) +'col'+ (colStart-1)) && 
                    p.hasOwnProperty('row'+ (rowStart+2) +'col'+ (colStart-2)) && 
                    p.hasOwnProperty('row'+ (rowStart+3) +'col'+ (colStart-3))) {
                    console.log(player + ' wins!');
                    announceWinner(player);
                }
            }
            else {
                arr = p[key];

                // horizonal and vertical
                if (arr.length == 4) {
                    arr.sort();
                    var first = arr[0];

                    if (first == arr[0] && first+1 == arr[1] && first+2 == arr[2] && first+3 == arr[3]) {
                        console.log(player + ' wins!');
                        announceWinner(player);
                    }
                }
            }
        });
        
    }


    function announceWinner(winner) {
        var msg = "";

        if (winner == "p1") {
            msg = "RED wins!";
        }
        else if (winner == "p2") {
            msg = "YELLOW wins!";
        }
        else if (winner == "draw") {
            msg = "It's a draw!";
        }
        
        $("p#message-winner").text(msg);
        $(".ui-dialog-titlebar").hide();
        $("#dialog-winner").dialog("open");
    }
    

    // Draw board
    drawBoard();

})();