var Util = require('./util.js');

class Blob {
    constructor(id, x, y, color) {
        //Cells player id
        this.id = id;
        //size
        this.size = 5;
        //color
        this.color = color;
        //Selected or not
        this.selected = false;
        //Position
        this.x = x;
        this.y = y;
        //Velocity
        this.vx = Math.random() * 2 + 2;
        this.vy = Math.random() * 2 + 2;
        //Acceleration
        this.ax = 0;
        this.ay = 0;
        //target position
        this.tx = this.x;
        this.ty = this.y;
    }

    update() {

        //If the position and the target are not the same, go to the target.
        if (this.tx != this.x || this.ty != this.y) {

            var toX = this.tx - this.x;
            var toY = this.ty - this.y;

            var toLength = Math.sqrt(toX * toX + toY * toY);
            toX = toX / toLength;
            toY = toY / toLength;

            this.x += toX * this.vx;
            this.y += toY * this.vy;

            if (Math.abs(this.tx - this.x) < 2) {
                this.tx = this.x;
            }

            if (Math.abs(this.ty - this.y) < 2) {
                this.ty = this.y;
            }
        }
    }

    getInfo() {
        return {
            x: this.x,
            y: this.y,
            color: this.color,
            size: this.size,
            selected: this.selected
        }
    }
}

module.exports = Blob;