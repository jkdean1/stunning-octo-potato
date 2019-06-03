/*
 * Created by Jacob Cox
*/

var Util = require('./util.js');

class Player {
    constructor(id, n, x, y) {
        //socket
        this.socket_id = id;

        //Name
        this.name = n;

        //cells
        this.color = Util.getRandomHSLColor();

        //position and movement
        this.x = x;
        this.y = y;
        this.moveSpeed = 8;

        //controls
        this.pressingRight = false;
        this.pressingLeft = false;
        this.pressingUp = false;
        this.pressingDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.pressingShift = false;
        this.pressingCtrl = false;

        //Select variables
        this.mouseSelectFirstX = 0;
        this.mouseSelectFirstY = 0;
        this.mouseSelectSecondX = 0;
        this.mouseSelectSecondY = 0;

        //Screen variables
        this.screenWidth = 0;
        this.screenHeight = 0;
        this.canvasXZero = 0;
        this.canvasYZero = 0;
        this.canvasXMax = 0;
        this.canvasYMax = 0;
    }

    getInfo() {
        return {
            x: this.x,
            y: this.y,
        }
    }

    updatePosition() {

        this.canvasXZero = Math.floor(this.x - (this.screenWidth / 2));
        this.canvasYZero = Math.floor(this.y - (this.screenHeight / 2));
        this.canvasXMax = this.canvasXZero + this.screenWidth;
        this.canvasYMax = this.canvasYZero + this.screenHeight;


        var moveX = 0;
        var moveY = 0;


        if (this.pressingUp) {
            moveY = -this.moveSpeed;
        }

        if (this.pressingDown) {
            moveY = this.moveSpeed;
        }

        if (this.pressingLeft) {
            moveX = -this.moveSpeed;
        }

        if (this.pressingRight) {
            moveX = this.moveSpeed;
        }

        if (moveX != 0 && moveY != 0) {
            moveX = Math.ceil(moveX / 1.5);
            moveY = Math.ceil(moveY / 1.5);
        }

        this.x += moveX;
        this.y += moveY;
    }

    updateScreen(w, h) {
        this.screenWidth = w;
        this.screenHeight = h;
    }
}

module.exports = Player;
