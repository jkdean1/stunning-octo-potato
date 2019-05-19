var Blob = require('./blob.js');

class Cell {
    constructor(id, x, y) {
        //Cells player id
        this.id = id;
        //size
        this.size = 40;
        //color
        this.color = "blue";
        //Selected or not
        this.selected = false;
        //Position
        this.x = x;
        this.y = y;
        //Velocity
        this.vx = 2;
        this.vy = 2;
        //Acceleration
        this.ax = 0;
        this.ay = 0;
        //target position
        this.tx = this.x;
        this.ty = this.y;

        this.counterMax = 200;
        this.counter = this.counterMax;
    }

    update(blobList) {

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

        //update all the blobs
        for(var i in blobList){
            var blob = blobList[i];
            blob.update();
        }

        if(this.counter <= 0){
            this.counter = this.counterMax;
            var b = new Blob(this.id, this.x, this.y, this.color);
            var angle = Math.random() * Math.PI * 2;
            var randomOffset = Math.random() * 30 + 20;
            var newX = (this.size + randomOffset) * Math.cos(angle);
            var newY = (this.size + randomOffset) * Math.sin(angle);
            b.tx = this.x + newX;
            b.ty = this.y + newY;
            blobList.push(b);
        }

        this.counter--;
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

module.exports = Cell;