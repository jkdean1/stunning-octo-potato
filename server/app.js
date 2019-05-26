//Import Required Libraries
var Log = require('./js/log.js');
var Util = require('./js/util.js');
var express = require('express');
var fs = require('fs');
var Player = require('./js/player.js');
var Map = require('./js/map.js');
var Cell = require('./js/cell.js');
var QuadTreeModule = require('./js/quadtree.js');

//Load Config Data
var rawdata = fs.readFileSync('./config.json');
var c = JSON.parse(rawdata);

//Create Server Variables
var app = express();
var serv = require('http').Server(app);
var gameport = c.port;
var DEBUG = c.debug;

//config variables
var mapWidth = c.mapWidth;
var mapHeight = c.mapHeight;
var tileWidth = c.tileWidth;
var tileHeight = c.tileHeight;

var maxCells = 200;

//Create the rectangle for the quadtree
var rectangle = new QuadTreeModule.Rectangle((mapWidth * tileWidth) / 2, (mapHeight * tileHeight) / 2, (mapWidth * tileWidth) / 2, (mapHeight * tileHeight) / 2, );

//Create the quadtree
var QUADTREE = new QuadTreeModule.QuadTree(rectangle, 10);

//Default location for the client
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

//If the client specifies something specific, it has to be in the client folder.
app.use('/client', express.static(__dirname + '/client'));

serv.listen(gameport);

Log("app", "Server Started on port: " + gameport, "info", true);

var SOCKET_LIST = {};
var PLAYER_LIST = [];
var CELL_LIST = [];
var BLOB_LIST = {};

//Create socket connection.
var io = require('socket.io')(serv, {});

//Apply connection to all players who enter the game.
io.sockets.on('connection', function (socket) {
    socket.id = Util.getRandomId();
    SOCKET_LIST[socket.id] = socket;

    socket.emit('connected', {
        id: socket.id,
        debug: DEBUG,
        width: mapWidth,
        height: mapHeight,
        tileWidth: tileWidth,
        tileHeight: tileHeight
    });

    if (DEBUG) {
        Log("app", "Socket Created: " + socket.id, "info", false);
    }

    //Create the Player
    var randomX = Math.floor(Util.getRandomInt(0, mapWidth * tileWidth));
    var randomY = Math.floor(Util.getRandomInt(0, mapHeight * tileHeight));
    var player = new Player(socket.id, randomX, randomY);
    //Add the player to the player list at the id of the socket
    PLAYER_LIST[socket.id] = player;

    //Create the players first cell
    var randomID = Util.getRandomId();
    var cell = new Cell(socket.id, randomID, 200, 200);
    cell.color = player.color;
    CELL_LIST.push(cell);

    //var randomID = Util.getRandomId();
    //var cell = new Cell(socket.id, randomID, randomX + 200, randomY);
    //cell.color = player.color;
    //CELL_LIST.push(cell);

    var randomID = Util.getRandomId();
    var cell = new Cell(socket.id, randomID, randomX, randomY + 200);
    cell.color = player.color;
    CELL_LIST.push(cell);

    //INSERT ALL POINTS INTO THE QUADTREE!!!!
    var point = new QuadTreeModule.Point(cell.x, cell.y, cell);
    QUADTREE.insert(point);

    var blobList = [];
    BLOB_LIST[socket.id] = blobList;

    //When the player disconnects
    socket.on('disconnect', function () {
        if (DEBUG)
            Log("app", "Socket Deleted: " + socket.id, "info", false);
        delete PLAYER_LIST[socket.id];
        delete SOCKET_LIST[socket.id];

        //Delete the cells when the player leaves
        var tempList = [];
        for (var i in CELL_LIST) {
            if (CELL_LIST[i].id != socket.id) {
                tempList.push(CELL_LIST[i]);
            }
        }

        CELL_LIST.length = 0;
        for (var i in tempList) {
            var c = tempList[i];
            CELL_LIST.push(c);
        }

        delete BLOB_LIST[socket.id];
    });

    //When the players window is resized
    socket.on('windowResized', function (data) {
        player.updateScreen(data.w, data.h);
    });

    //When the player presses a key
    socket.on('keyPress', function (data) {
        if (data.inputId === 'left') {
            player.pressingLeft = data.state;
        } else if (data.inputId === 'right') {
            player.pressingRight = data.state;
        } else if (data.inputId === 'up') {
            player.pressingUp = data.state;
        } else if (data.inputId === 'down') {
            player.pressingDown = data.state;
        } else if (data.inputId === 'space') {
            player.pressingSpace = data.state;
            for (var i in CELL_LIST) {
                if (CELL_LIST[i].id == socket.id) {
                    CELL_LIST[i].mass++;
                }
            }
        } else if (data.inputId === 'shift') {
            player.pressingShift = data.state;
        } else if (data.inputId === 'ctrl') {
            player.pressingCtrl = data.state;
        }
    });

    //When the players mouse moves. 
    socket.on('mousemove', function (data) {
        player.mouseX = data.x;
        player.mouseY = data.y;
    });

    //When the player clicks the mouse down.
    socket.on('leftmousedown', function (data) {
        player.mouseDown = data.state;
        player.mouseSelectFirstX = data.x;
        player.mouseSelectFirstY = data.y;

        for (var i in CELL_LIST) {
            var cell = CELL_LIST[i];

            if (cell.selected) {
                cell.tx = data.x + player.canvasXZero;
                cell.ty = data.y + player.canvasYZero;
                cell.target = true;
            }
        }
    });

    //When the player clicks the mouse down.
    socket.on('rightmousedown', function (data) {
        //player.rightclicked(CELL_LIST, BLOB_LIST, data.x, data.y);

        for (var i in CELL_LIST) {
            var cell = CELL_LIST[i];

            if (cell.selected) {
                cell.vx = 1 * cell.x - (data.x + player.canvasXZero);
                cell.vy = 1 * cell.y - (data.y + player.canvasYZero);
            }
        }
    });

    //When the player lets the mouse go. 
    socket.on('mouseup', function (data) {
        player.mouseDown = data.state;
        player.mouseSelectSecondX = data.x;
        player.mouseSelectSecondY = data.y;

        if(player.mouseSelectFirstX != player.mouseSelectSecondX || player.mouseSelectFirstY != player.mouseSelectSecondY){
            Selector(player);
        }

        player.clicked(CELL_LIST, BLOB_LIST);
    });
});

function doCirclesOverlap(x1, y1, r1, x2, y2, r2) {
    return Math.abs((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) < (r1 + r2) * (r1 + r2);
}

function getDistance(x1, y1, r1, x2, y2, r2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) || 1;
}

function Selector(p) {
    var x1 = p.mouseSelectFirstX + p.canvasXZero;
    var y1 = p.mouseSelectFirstY + p.canvasYZero;
    var x2 = p.mouseSelectSecondX + p.canvasXZero;
    var y2 = p.mouseSelectSecondY + p.canvasYZero;

    var range = new QuadTreeModule.Rectangle(x1, y1, x2, y2);
    var targets = QUADTREE.query(range);

    for (var i in targets) {
        var cell = targets[i].data;
        if(cell.id == p.socket_id){
            if (cell.type == 0) {

                if(cell.x > x1 && cell.x < x2 && cell.y > y1 && cell.y < y2){
                    cell.selected = true;
                }
            }
        }
    }
}

function collider() {

    var collidedParis = [];

    //STATIC RESOLUTION
    for (var i in CELL_LIST) {
        var cell = CELL_LIST[i];
        var cellType = cell.type;

        //Get nearby Objects for collision
        var range = new QuadTreeModule.Circle(cell.x, cell.y, cell.size * cell.size);
        var targets = QUADTREE.query(range);

        //variables that will be used over and over
        var distance = 0;
        var overlap = 0;

        //Go through each object in the range and perform collision calculations
        for (var j in targets) {
            var target = targets[j].data;
            var targetType = target.type;

            //Check to make sure the cell and the target are not the same
            if (cell.uniqueID != target.uniqueID) {

                //Go through each type of cell
                if (cellType == 1 && targetType == 1) {
                    //They are both generating cells, so do normal collision

                    //Check if the objects overlap
                    if (doCirclesOverlap(cell.x, cell.y, cell.size, target.x, target.y, target.size)) {

                        //Add both cells to the colliding pairs array for dynamic resolution later
                        collidedParis.push(cell);
                        collidedParis.push(target);

                        //Calculate the distance and overlap
                        distance = getDistance(cell.x, cell.y, cell.size, target.x, target.y, target.size);
                        overlap = (distance - cell.size - target.size) / 2;

                        //Resolve Cell Collision
                        cell.x -= overlap * (cell.x - target.x) / distance;
                        cell.y -= overlap * (cell.y - target.y) / distance;

                        //Resolve Target Collision  
                        target.x += overlap * (cell.x - target.x) / distance;
                        target.y += overlap * (cell.y - target.y) / distance;
                    }
                } else if (cellType == 1 && targetType == 0) {
                    if (cell.id != target.id) {
                        distance = getDistance(cell.x, cell.y, cell.size, target.x, target.y, target.size);
                        if (distance < cell.size + target.size) {
                            target.valid = false;
                            cell.size--;

                            if (cell.size == 1) {
                                cell.size = 1;
                                cell.valid = false;
                            }
                        }
                    }
                } else if (cellType == 0 && targetType == 0) {
                    if (cell.id != target.id) {
                        distance = getDistance(cell.x, cell.y, cell.size, target.x, target.y, target.size);
                        if (distance < cell.size + target.size) {
                            target.valid = false;
                            cell.valid = false;
                        }
                    } else {
                        //Check if the objects overlap
                        if (doCirclesOverlap(cell.x, cell.y, cell.size, target.x, target.y, target.size)) {

                            //Add both cells to the colliding pairs array for dynamic resolution later
                            collidedParis.push(cell);
                            collidedParis.push(target);

                            //Calculate the distance and overlap
                            distance = getDistance(cell.x, cell.y, cell.size, target.x, target.y, target.size);
                            overlap = (distance - cell.size - target.size) / 2;

                            //Resolve Cell Collision
                            cell.x -= overlap * (cell.x - target.x) / distance;
                            cell.y -= overlap * (cell.y - target.y) / distance;

                            //Resolve Target Collision  
                            target.x += overlap * (cell.x - target.x) / distance;
                            target.y += overlap * (cell.y - target.y) / distance;
                        }
                    }
                }
            }
        }
    }

    //DYNAMIC RESOLUTION
    for (var i = 0; i < collidedParis.length; i += 2) {
        var cell1 = collidedParis[i];
        var cell2 = collidedParis[i + 1];

        //Get the distance between the two balls
        distance = getDistance(cell1.x, cell1.y, cell1.size, cell2.x, cell2.y, cell2.size);

        //get the normal vector
        var nx = (cell2.x - cell1.x) / distance;
        var ny = (cell2.y - cell1.y) / distance;

        //tangent
        var tx = -ny;
        var ty = nx;

        //Dot product tangent
        var dptan1 = cell1.vx * tx + cell1.vy * ty;
        var dptan2 = cell2.vx * tx + cell2.vy * ty;

        //Dot Product Normal
        var dpnorm1 = cell1.vx * nx + cell1.vy * ny;
        var dpnorm2 = cell2.vx * nx + cell2.vy * ny;

        //Conservation of momentum in 1D
        var m1 = (dpnorm1 * (cell1.mass - cell2.mass) + 2 * cell2.mass * dpnorm2) / (cell1.mass + cell2.mass);
        var m2 = (dpnorm2 * (cell2.mass - cell2.mass) + 2 * cell1.mass * dpnorm1) / (cell1.mass + cell2.mass);

        //Update the Cells Velocities
        cell1.vx = tx * dptan1 + nx * m1;
        cell1.vy = ty * dptan1 + ny * m1;
        cell2.vx = tx * dptan2 + nx * m2;
        cell2.vy = ty * dptan2 + ny * m2;
    }

}

function tick(dt) {
    //Create the rectangle for the quadtree
    var rectangle = new QuadTreeModule.Rectangle((mapWidth * tileWidth) / 2, (mapHeight * tileHeight) / 2, (mapWidth * tileWidth) / 2, (mapHeight * tileHeight) / 2, );
    //Create the quadtree
    QUADTREE = new QuadTreeModule.QuadTree(rectangle, 10);

    //For every player in the PLAYER_LIST
    for (var p in PLAYER_LIST) {
        var player = PLAYER_LIST[p];
        var socket = SOCKET_LIST[player.socket_id];

        //Update the players location on there screen
        socket.emit('updateLocation', player.getInfo());

        //array to package the cells into
        var cells = [];

        //loop through all the cells
        for (var c in CELL_LIST) {
            var cell = CELL_LIST[c];
            var cellType = cell.type;
            cell.update(dt);
            if (cell.valid) {
                cells.push(cell.getInfo());
            }
            //Add the cells to the quadtree
            var point = new QuadTreeModule.Point(cell.x, cell.y, cell);
            QUADTREE.insert(point);

            //if there are not too many cells...
            if (CELL_LIST.length < maxCells) {
                //Add a new cell if it is time
                if (cellType == 1) {
                    if (cell.counter == 0) {
                        var randomDistance = Util.getRandomInt(20, 50);
                        var randomID = Util.getRandomId();
                        var temp = new Cell(cell.id, randomID, cell.x, cell.y);
                        var randomAngle = Math.random() * Math.PI * 2;
                        temp.tx = Math.cos(randomAngle) * (cell.size + randomDistance) + cell.x;
                        temp.ty = Math.sin(randomAngle) * (cell.size + randomDistance) + cell.y;
                        temp.target = true;
                        temp.color = player.color;
                        temp.size = 5;
                        temp.type = 0;
                        CELL_LIST.push(temp);

                        console.log(CELL_LIST.length);
                    }
                }
            }
        }

        socket.emit('cells', cells);

        //Update the player
        player.updatePosition();
    }

    var temp = [];
    for(var i in CELL_LIST){
        var cell = CELL_LIST[i];
        if(cell.valid){
            temp.push(cell);
        }
    }

    CELL_LIST.length = 0;
    CELL_LIST = temp;

}

/*
---------- MAIN GAME LOOP ----------
*/

//Loop variables
var hrstart = process.hrtime();
var desiredTicks = 1000 / 60;
var dt = 0;

//Average Calculation variables
var startTime = 0;
var endTime = 0;
var totalTime = 0;
var numberOfLoops = 0;

setInterval(function (argument) {
    // execution time simulated with setTimeout function
    hrend = process.hrtime(hrstart);

    //grab the current time
    if (DEBUG) {
        startTime = process.hrtime()[1];
    }

    //Calculate the delta time in miliseconds
    dt = hrend[1] / 1000000000;

    collider();

    //Perform game operations
    tick(dt);

    //Reset the time
    hrstart = process.hrtime();


    if (DEBUG) {

        //grab the end time
        endTime = process.hrtime()[1];

        //calculate the time the loop took and add it to the total
        totalTime = totalTime + Math.abs(endTime - startTime);

        if (numberOfLoops >= 3600) {
            Log("app", "Average Loop Execution Time " + (totalTime / numberOfLoops) / 1000000 + "ms", "", false);
            totalTime = 0;
            numberOfLoops = 0;
        }

        //Increment the loops variable
        numberOfLoops++;
    }

}, desiredTicks);

/*
//The current "game loop" -This needs to be updated later to be more functional. 
setInterval(function () {

    //Create the rectangle for the quadtree
    var rectangle = new QuadTreeModule.Rectangle((mapWidth * tileWidth) / 2, (mapHeight * tileHeight) / 2, (mapWidth * tileWidth) / 2, (mapHeight * tileHeight) / 2, );
    //Create the quadtree
    QUADTREE = new QuadTreeModule.QuadTree(rectangle, 10);

    for (var p in PLAYER_LIST) {
        var player = PLAYER_LIST[p];
        var socket = SOCKET_LIST[player.socket_id]
        socket.emit('updateLocation', player.getInfo());

        var cells = [];

        for (var c in CELL_LIST) {
            var cell = CELL_LIST[c];
            cell.update();
            cells.push(cell.getInfo());
            var point = new QuadTreeModule.Point(cell.x, cell.y, cell);
            QUADTREE.insert(point);
        }

        socket.emit('cells', cells);

        var blobs = [];

        for (var b1 in BLOB_LIST) {
            var blobArray = BLOB_LIST[b1];
            for (var b2 in blobArray) {
                //var blob = blobArray[b2];
                //blob.update();
                //blobs.push(blob.getInfo());
            }
        }

        collider();

        /*
        //Deal with colision
        for(var i in CELL_LIST){
            var p = CELL_LIST[i];
            let range = new QuadTreeModule.Circle(p.x, p.y, p.size * 4);
            let others = QUADTREE.query(range);
            for(var j in others){
                var other = others[j].data;
                if(other != p){
                    if(doCirclesOverlap(p.x, p.y, p.size, other.x, other.y, other.size)){
                        var distance = Math.sqrt((p.x - other.x) * (p.x - other.x) + (p.y - other.y) * (p.y - other.y));
                        var midPointX = (p.x + other.x) / 2;
                        var midPointY = (p.y + other.y) / 2;
                        p.x = midPointX + p.size * ((p.x - other.x) / distance);
                        p.tx = p.x;
                        p.y = midPointY + p.size * ((p.y - other.y) / distance);
                        p.ty = p.y;
                        other.x = midPointX + other.size * (other.x - p.x) / distance;
                        other.tx = other.x;
                        other.y = midPointY + other.size * (other.y - p.y) / distance;
                        other.ty = other.y;
                    }
                }
            }
        }

        socket.emit('blobs', blobs);

        player.updatePosition();
    }
}, 1000 / 60); //60 times a second

*/