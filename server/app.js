/*
 * Created by Jacob Cox
 */

//Import Required Libraries
var express = require('express');
var fs = require('fs');

//Import Log Library
var Log = require('./js/log.js');

//Import Utilities
var Util = require('./js/util.js');

//Import Player
var Player = require('./js/player.js');

//Import Cell
var Cell = require('./js/cell.js');

//Import Food
var Food = require('./js/food.js');

//Import QuadTree
var QuadTreeModule = require('./js/quadtree.js');

//Load Config Data
var rawdata = fs.readFileSync('./config.json');
var c = JSON.parse(rawdata);

//Create Server Variables
var app = express();
var serv = require('http').Server(app);

//config variables
var gameport = c.port;
var DEBUG = c.debug;
var mapWidth = c.mapWidth;
var mapHeight = c.mapHeight;
var tileWidth = c.tileWidth;
var tileHeight = c.tileHeight;
var maxCells = c.maxCells;
var maxQuadTreeEntities = c.maxQuadTreeEntities;

//Create Empty arrays and objects for players and game entities
var SOCKET_LIST = {};
var PLAYER_LIST = [];
var CELL_LIST = [];
var FOOD = [];

//Create the rectangle for the quadtree
var rectangle = new QuadTreeModule.Rectangle((mapWidth * tileWidth) / 2, (mapHeight * tileHeight) / 2, (mapWidth * tileWidth) / 2, (mapHeight * tileHeight) / 2, );

//Create the quadtree
var QUADTREE = new QuadTreeModule.QuadTree(rectangle, maxQuadTreeEntities);

//Create Food
for (var i = 0; i < 1500; i++) {
    var randomX = Math.floor(Util.getRandomInt(100, (mapWidth * tileWidth - 100)));
    var randomY = Math.floor(Util.getRandomInt(100, (mapHeight * tileHeight - 100)));
    var f = new Food(randomX, randomY);
    FOOD.push(f);
    var point = new QuadTreeModule.Point(randomX, randomY, f);
    QUADTREE.insert(point);
}

//Default location for the client
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

//If the client specifies something specific, it has to be in the client folder.
app.use('/client', express.static(__dirname + '/client'));

//Use the specified gameport
serv.listen(gameport);

//Create socket connection.
var io = require('socket.io')(serv, {});

Log("###############################################################");
Log("Server Started on port: " + gameport, "finish");
Log("###############################################################\n");

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
        Log("Socket created with id: " + socket.id, "info");
    }

    //Create the Player
    var randomX = Math.floor(Util.getRandomInt(100, (mapWidth * tileWidth - 100)));
    var randomY = Math.floor(Util.getRandomInt(100, (mapHeight * tileHeight - 100)));
    var player = new Player(socket.id, "", randomX, randomY);
    //Add the player to the player list at the id of the socket
    PLAYER_LIST[socket.id] = player;

    //Create the players first cell
    var randomID = Util.getRandomId();
    var cell = new Cell(socket.id, randomID, randomX, randomY);
    cell.color = player.color;
    CELL_LIST.push(cell);

    //INSERT ALL POINTS INTO THE QUADTREE!!!!
    var point = new QuadTreeModule.Point(cell.x, cell.y, cell);
    QUADTREE.insert(point);

    //When the player disconnects
    socket.on('disconnect', function () {
        if (DEBUG)
            Log("Socket deleted with id: " + socket.id, "info");
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
    });

    //When the players window is resized
    socket.on('windowResized', function (data) {
        player.updateScreen(data.w, data.h);
    });

    //When the player chooses a name (should be added later somehow.. this isnt good)
    socket.on('name', function (data) {
        player.name = data;
    })

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

    //MOUSE MOVES
    socket.on('mousemove', function (data) {
        player.mouseX = data.x;
        player.mouseY = data.y;
    });

    //LEFT CLICK DOWN
    socket.on('leftmousedown', function (data) {

        player.mouseDown = data.state;
        player.mouseSelectFirstX = data.x;
        player.mouseSelectFirstY = data.y;
    });

    //RIGHT CLICK DOWN
    socket.on('rightmousedown', function (data) {
        for (var i in CELL_LIST) {
            var cell = CELL_LIST[i];
            if (cell.id == socket.id) {
                cell.selected = false;
            }
        }
    });

    //BOTH CLICK UP
    socket.on('mouseup', function (data) {
        player.mouseDown = data.state;
        player.mouseSelectSecondX = data.x;
        player.mouseSelectSecondY = data.y;

        var differenceInSelectionX = Math.abs(player.mouseSelectSecondX - player.mouseSelectFirstX);
        var differenceInSelectionY = Math.abs(player.mouseSelectSecondY - player.mouseSelectFirstY);

        if (differenceInSelectionX > 5 || differenceInSelectionY > 5) {
            multiSelector(player);
        } else {
            singleSelector(player);
        }
    });
});

function singleSelector(p) {
    var x1 = p.canvasXZero;
    var y1 = p.canvasYZero;
    var x2 = p.canvasXZero + p.screenWidth;
    var y2 = p.canvasYZero + p.screenHeight;

    var range = new QuadTreeModule.Rectangle(x1, y1, x2, y2);
    var targets = QUADTREE.query(range);

    var flag = false;
    for (var i in targets) {
        var target = targets[i].data;
        if (target.type == 1 || target.type == 0) {
            if (target.id === p.socket_id) {
                var distance = Util.getDistance(p.mouseSelectFirstX + p.canvasXZero, p.mouseSelectFirstY + p.canvasYZero, target.x, target.y);
                if (distance < target.size) {
                    target.selected = true;
                    flag = true;
                    break;
                }
            }
        }
    }

    if (!flag) {
        for (var i in CELL_LIST) {
            var cell = CELL_LIST[i];

            if (cell.id == p.socket_id) {
                if (cell.selected) {
                    cell.tx = p.mouseSelectFirstX + p.canvasXZero;
                    cell.ty = p.mouseSelectFirstY + p.canvasYZero;
                    cell.target = true;

                    cell.selected = false;
                }
            }
        }
    }
}

function multiSelector(p) {
    var x1 = p.mouseSelectFirstX + p.canvasXZero;
    var y1 = p.mouseSelectFirstY + p.canvasYZero;
    var x2 = p.mouseSelectSecondX + p.canvasXZero;
    var y2 = p.mouseSelectSecondY + p.canvasYZero;

    if (x2 < x1) {
        var tmp = x1;
        x1 = x2;
        x2 = tmp;
    }

    if (y2 < y1) {
        var tmp = y1;
        y1 = y2;
        y2 = tmp;
    }

    var range = new QuadTreeModule.Rectangle(x1, y1, x2, y2);
    var targets = QUADTREE.query(range);

    for (var i in targets) {
        var cell = targets[i].data;
        if (cell.id == p.socket_id) {
            if (cell.x > x1 && cell.x < x2 && cell.y > y1 && cell.y < y2) {
                cell.selected = true;
            }
        }
    }
}

function collider(dt) {

    var CollidedPairs = [];

    //STATIC RESOLUTION
    for (var i in CELL_LIST) {
        var cell = CELL_LIST[i];
        var cellType = cell.type;

        cell.update(dt, mapWidth * tileWidth, mapHeight * tileHeight);

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
                    if (Util.doCirclesOverlap(cell.x, cell.y, cell.size, target.x, target.y, target.size)) {

                        //Add both cells to the colliding pairs array for dynamic resolution later
                        CollidedPairs.push(cell);
                        CollidedPairs.push(target);

                        //Calculate the distance and overlap
                        distance = Util.getDistance(cell.x, cell.y, cell.size, target.x, target.y, target.size);
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
                        distance = Util.getDistance(cell.x, cell.y, target.x, target.y);
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
                        distance = Util.getDistance(cell.x, cell.y, target.x, target.y);
                        if (distance < cell.size + target.size) {
                            target.valid = false;
                            cell.valid = false;
                        }
                    } else {
                        //Check if the objects overlap
                        if (Util.doCirclesOverlap(cell.x, cell.y, cell.size, target.x, target.y, target.size)) {

                            //Add both cells to the colliding pairs array for dynamic resolution later
                            CollidedPairs.push(cell);
                            CollidedPairs.push(target);

                            //Calculate the distance and overlap
                            distance = Util.getDistance(cell.x, cell.y, target.x, target.y);
                            overlap = (distance - cell.size - target.size) / 2;

                            //Resolve Cell Collision
                            cell.x -= overlap * (cell.x - target.x) / distance;
                            cell.y -= overlap * (cell.y - target.y) / distance;

                            //Resolve Target Collision  
                            target.x += overlap * (cell.x - target.x) / distance;
                            target.y += overlap * (cell.y - target.y) / distance;
                        }
                    }
                } else if (cellType == 1 && targetType == 2) {
                    if (Util.doCirclesOverlap(cell.x, cell.y, cell.size, target.x, target.y, target.size)) {
                        cell.size += 1;
                        cell.spawnCount++;
                        target.valid = false;
                    }
                }
            }
        }
    }

    //DYNAMIC RESOLUTION
    for (var i = 0; i < CollidedPairs.length; i += 2) {
        var cell1 = CollidedPairs[i];
        var cell2 = CollidedPairs[i + 1];

        //Get the distance between the two balls
        distance = Util.getDistance(cell1.x, cell1.y, cell2.x, cell2.y);

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

        if (tx > 5) {
            tx = 5;
        }

        if (ty > 5) {
            ty = 5;
        }

        //Update the Cells Velocities
        cell1.vx = tx * dptan1 + nx * m1;
        cell1.vy = ty * dptan1 + ny * m1;
        cell2.vx = tx * dptan2 + nx * m2;
        cell2.vy = ty * dptan2 + ny * m2;
    }
}

function tick(dt) {

    for (var c in CELL_LIST) {
        var cell = CELL_LIST[c];
        var cellType = cell.type;

        //if there are not too many cells...
        if (CELL_LIST.length < maxCells) {
            //Add a new cell if it is time
            if (cellType == 1) {
                if(cell.spawnCount > 0){
                    if (cell.counter == 0) {
                        var randomDistance = Util.getRandomInt(20, 50);
                        var randomID = Util.getRandomId();
                        var temp = new Cell(cell.id, randomID, cell.x, cell.y);
                        var randomAngle = Math.random() * Math.PI * 2;
                        temp.tx = Math.cos(randomAngle) * (cell.size + randomDistance) + cell.x;
                        temp.ty = Math.sin(randomAngle) * (cell.size + randomDistance) + cell.y;
                        temp.target = true;
                        temp.color = cell.color;
                        temp.size = 5;
                        temp.type = 0;
                        CELL_LIST.push(temp);

                        cell.spawnCount--;
                        cell.size -= 0.3;
                    }
                }
            }
        }
    }

    //For every player in the PLAYER_LIST
    for (var p in PLAYER_LIST) {
        PLAYER_LIST[p].updatePosition();
    }

    //remove cells that are dead
    var temp = [];
    for (var i in CELL_LIST) {
        var cell = CELL_LIST[i];
        if (cell.valid) {
            temp.push(cell);
        }
    }

    CELL_LIST.length = 0;
    CELL_LIST = temp;
}

function heartBeat() {
    //REBALANCE MASS
    for (var i in FOOD) {
        var food = FOOD[i];
        if (!food.valid) {
            food.x = Math.floor(Util.getRandomInt(100, (mapWidth * tileWidth - 100)));
            food.y = Math.floor(Util.getRandomInt(100, (mapHeight * tileHeight - 100)));
            food.valid = true;
        }
    }
}

function sendInfo() {
    for (var i in PLAYER_LIST) {
        //Grab the player and respective socket objects.
        var player = PLAYER_LIST[i];
        var socket = SOCKET_LIST[player.socket_id];

        //Get all objects that are in the quadtree around the player
        var rectangle = new QuadTreeModule.Rectangle(player.canvasXZero, player.canvasYZero, player.canvasXMax, player.canvasYMax);
        //console.log(player.screenWidth + "   " + player.screenHeight);
        //console.log(player.canvasXZero + "  " + player.canvasYZero + "  " + player.canvasXMax + "  " + player.canvasYMax);
        var objects = QUADTREE.query(rectangle);

        //console.log(objects.length);

        if (objects) {
            //Put all object information inside an array
            var sendObjects = [];
            for (var o in objects) {
                var object = objects[o].data;
                if (object.valid) {
                    sendObjects.push(object.getInfo());
                }
            }
        }

        //Grab the player infomation
        var playerInfo = player.getInfo();

        var quadtree = [];
        if (DEBUG) {
            quadtree = QUADTREE.show();
        }

        //Send all data to the player
        socket.emit('update', playerInfo, sendObjects, quadtree);
    }
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

setInterval(sendInfo, 1000 / 40);

setInterval(heartBeat, 1000);

setInterval(function (argument) {
    // execution time simulated with setTimeout function
    hrend = process.hrtime(hrstart);

    //grab the current time
    if (DEBUG) {
        startTime = process.hrtime()[1];
    }

    //Calculate the delta time in miliseconds
    dt = hrend[1] / 1000000000;

    //REDO Quadtree
    var rectangle = new QuadTreeModule.Rectangle((mapWidth * tileWidth) / 2, (mapHeight * tileHeight) / 2, (mapWidth * tileWidth) / 2, (mapHeight * tileHeight) / 2);
    QUADTREE = new QuadTreeModule.QuadTree(rectangle, maxQuadTreeEntities);

    for (var c in CELL_LIST) {
        var cell = CELL_LIST[c];

        //Add the cells to the quadtree
        var point = new QuadTreeModule.Point(cell.x, cell.y, cell);
        QUADTREE.insert(point);
    }

    for (var f in FOOD) {
        var food = FOOD[f];
        if (food.valid) {
            var point = new QuadTreeModule.Point(food.x, food.y, food);
            QUADTREE.insert(point);
        }
    }

    collider(dt);

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
            Log("Average Loop Execution Time " + (totalTime / numberOfLoops) / 1000000 + "ms", "info");
            totalTime = 0;
            numberOfLoops = 0;
        }

        //Increment the loops variable
        numberOfLoops++;
    }
}, desiredTicks);