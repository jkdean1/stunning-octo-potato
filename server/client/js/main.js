//Global Variables
var socket = io("", {transports: ['websocket']});
var ID;
var DEBUG = false;

//render Variables
var canvas;
var context;
var width;
var height;

var mapWidth;
var mapHeight;
var tileWidth;
var tileheight;

var mouseDown = false;
var highQuality = true;

//containers
var players = [];

//player variables
var x;
var y;
var lastMouseX = 0;
var lastMouseY = 0;
var currMouseX = 0;
var currMouseY = 0;

//map variables
var map;
var circles;
var backgroundImage = new Image();
backgroundImage.src = 'client/res/img/tile2.jpg';


var pulser = 0
var breather = 1;

//Cell variables
var cells = [];
var blobs = [];

socket.on('connected', function (data) {

    ID = data.id;
    DEBUG = data.debug;
    mapWidth = data.width;
    mapHeight = data.height;
    tileWidth = data.tileWidth;
    tileHeight = data.tileHeight;

    if (DEBUG) {
        console.log("Connected, Your ID: " + ID);
    }
});

socket.on('updateLocation', function (data) {
    x = data.x;
    y = data.y;
});

socket.on('map', function (data) {
    map = data;
});

socket.on('message', function (data) {
    console.log(data);
});

socket.on('cells', function (data) {
    cells = [];
    cells = data;
});

socket.on('blobs', function (data) {
    blobs = [];
    blobs = data;
});

function setup() {
    canvas = document.getElementById('canvas');
    context = this.canvas.getContext('2d');
    width = this.canvas.width = window.innerWidth;
    height = this.canvas.height = window.innerHeight;

    socket.emit('windowResized', {
        w: width,
        h: height
    });

    //set the current players location to the center of the screen
    x = width / 2;
    y = height / 2;

    run();
}

function draw(dt) {
    //setup the canvas
    var canvasX = x - width / 2;
    var canvasY = y - height / 2;
    var moveX = 0 - canvasX;
    var moveY = 0 - canvasY;

    //Reset the canvas
    context.resetTransform();
    //Clear the canvas
    context.clearRect(0, 0, width, height);
    //Translate the canvas so the "player" is in the correct location
    context.translate(moveX, moveY);
    //Reset the fillStyle
    context.fillStyle = "black";

    var tempX = 0;
    var tempY = 0;


    if (highQuality) {
        //Draw Background
        for (var i = 0; i < mapWidth; i++) {
            for (var j = 0; j < mapHeight; j++) {

                tempX = i * tileWidth;
                tempY = j * tileHeight;

                if (tempX + tileWidth > canvasX && tempY + tileHeight > canvasY) {
                    if (tempX < canvasX + width && tempY < canvasY + height) {
                        context.drawImage(backgroundImage, i * tileWidth, j * tileHeight);
                    }
                }
            }
        }
    }

    context.fillStyle = "black";
    //Draw the cells
    if (cells) {
        if(breather == 1){
	  pulser++;
          if (pulser >= 60) { breather = 0;}
        } else if ( breather == 0){
          pulser--;
          if (pulser <= 0) { breather = 1;}
        } 
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];

            var grd = context.createRadialGradient(cell.x,cell.y,cell.size,cell.x,cell.y,cell.size*1.5+5*(pulser/30));
            grd.addColorStop(0,cell.color);
            var roughcolor = cell.color.match(/\d+/g);
            var color = "rgba(" + roughcolor[0] + "," + roughcolor[1] + "," + roughcolor[2] + ",0)";
            grd.addColorStop(1,color);
            context.fillStyle = grd;
            context.beginPath();
            context.arc(cell.x, cell.y, cell.size*3, 0, Math.PI * 2);
            context.closePath();
            context.fill();
            context.fillStyle = cell.color;
            context.lineWidth = 2;
            context.strokeStyle = cell.color;
            context.beginPath();
            context.arc(cell.x, cell.y, cell.size, 0, Math.PI * 2);
            context.closePath();
            context.fill();

            if (highQuality) {
                context.stroke();

		
            }

            //context.fillStyle = "white";
            //context.textAlign = "center";
            //context.fillText(cell.mass, cell.x, cell.y + cell.mass);

            if (cell.selected) {
                context.strokeStyle = "green";
                context.lineWidth = 1.5;
                context.stroke();
            }

        }
    }

    context.strokeStyle = "green";
    context.lineWidth = 3;

    //Draw the box
    if (mouseDown) {
        context.beginPath();
        context.rect(lastMouseX + canvasX, lastMouseY + canvasY, currMouseX - lastMouseX, currMouseY - lastMouseY);
        context.stroke();
        context.closePath();
    }

    context.strokeStyle = "black";
    context.lineWidth = 1;

    if (highQuality) {
        //Draw the dot with coordinates in the middle of the screen
        if (DEBUG) {
            context.fillStyle = "white";
            context.beginPath();
            context.arc(x, y, 4, 0, Math.PI * 2);
            context.closePath();
            context.fill();
            context.textAlign = 'center';
            context.fillText('[ ' + x + ',' + y + ']', x, y - 10);
        }
    }
}

function update(data) {
    players = [];
    for (var i = 0; i < data.players.length; i++) {
        players[i] = data.players[i];
    }
}

function run() {
    var now;
    var dt = 0;
    var last = timestamp();
    var slow = 1; // slow motion scaling factor
    var step = 1 / 60;
    var slowStep = slow * step;

    var fpsmeter = new FPSMeter({
        decimals: 0,
        graph: false,
        heat: false,
        heatOn: 0,
        theme: 'transparent',
        left: '5px'
    });

    var frame = function () {
        fpsmeter.tickStart();
        now = timestamp();
        dt = dt + Math.min(1, (now - last) / 1000);

        while (dt > slowStep) {
            dt = dt - slowStep;
        }

        draw(dt / slow);
        last = now;
        fpsmeter.tick();
        requestAnimationFrame(frame);
    }

    frame();
}

function startGame() {

    //window.onload = function () {
    window.addEventListener('resize', resize, false);

    window.addEventListener("load", function () {
        window.scrollTo(0, 0);
    });

    document.addEventListener("touchmove", function (e) {
        e.preventDefault()
    });

    document.addEventListener('contextmenu', event => event.preventDefault());

    setup();
}

function toggleFancy() {
    highQuality = !highQuality;
}

function resize() {
    context.clearRect(0, 0, width, height);
    context = this.canvas.getContext('2d');
    width = this.canvas.width = window.innerWidth;
    height = this.canvas.height = window.innerHeight;

    socket.emit('windowResized', {
        w: width,
        h: height
    });
}

function timestamp() {
    return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

document.onmousedown = function (event) {

    if (event.which == 1) {
        //Left Click
        mouseDown = true;
        lastMouseX = event.x;
        lastMouseY = event.y;

        socket.emit('leftmousedown', {
            state: true,
            x: event.x,
            y: event.y
        });
    } else if (event.which == 3) {
        //Right Click
        lastMouseX = event.x;
        lastMouseY = event.y;

        socket.emit('rightmousedown', {
            x: event.x,
            y: event.y
        });
    }
}

document.onmouseup = function (event) {

    mouseDown = false;
    lastMouseX = event.x;
    lastMouseY = event.y;

    socket.emit('mouseup', {
        state: false,
        x: event.x,
        y: event.y
    });
}

document.onmousemove = function (event) {

    currMouseX = event.x;
    currMouseY = event.y;

    socket.emit('mousemove', {
        x: event.x,
        y: event.y
    });
}

document.onkeydown = function (event) {

    if (event.keyCode === 68) //d
        socket.emit('keyPress', {
            inputId: 'right',
            state: true
        });
    else if (event.keyCode === 83) //s
        socket.emit('keyPress', {
            inputId: 'down',
            state: true
        });
    else if (event.keyCode === 65) //a
        socket.emit('keyPress', {
            inputId: 'left',
            state: true
        });
    else if (event.keyCode === 87) // w
        socket.emit('keyPress', {
            inputId: 'up',
            state: true
        });
    else if (event.keyCode === 32) // space
        socket.emit('keyPress', {
            inputId: 'space',
            state: true
        });
    else if (event.keyCode === 16) // shift
        socket.emit('keyPress', {
            inputId: 'shift',
            state: true
        });
    else if (event.keyCode === 17) // ctrl
        socket.emit('keyPress', {
            inputId: 'ctrl',
            state: true
        });
    else if (event.keyCode === 91) // cmd
        socket.emit('keyPress', {
            inputId: 'cmd',
            state: true
        });
}

document.onkeyup = function (event) {

    if (event.keyCode === 68) //d
        socket.emit('keyPress', {
            inputId: 'right',
            state: false
        });
    else if (event.keyCode === 83) //s
        socket.emit('keyPress', {
            inputId: 'down',
            state: false
        });
    else if (event.keyCode === 65) //a
        socket.emit('keyPress', {
            inputId: 'left',
            state: false
        });
    else if (event.keyCode === 87) // w
        socket.emit('keyPress', {
            inputId: 'up',
            state: false
        });
    else if (event.keyCode === 32) // space
        socket.emit('keyPress', {
            inputId: 'space',
            state: false
        });
    else if (event.keyCode === 16) // shift
        socket.emit('keyPress', {
            inputId: 'shift',
            state: false
        });
    else if (event.keyCode === 17) // ctrl
        socket.emit('keyPress', {
            inputId: 'ctrl',
            state: false
        });
    else if (event.keyCode === 91) // cmd
        socket.emit('keyPress', {
            inputId: 'cmd',
            state: false
        });
}
