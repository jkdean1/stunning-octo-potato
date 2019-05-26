var Blob = require('./blob.js');

class Cell {
    constructor(id, uniqueID, x, y) {
        //Cells player id
        this.id = id;
        //unique id for collision
        this.uniqueID = uniqueID;
        //size
        this.size = 40;
        //mass
        this.mass = this.size * 2;
        this.maxSpeed = 20;
        //color
        this.color = "blue";
        //Selected or not
        this.selected = false;
        //Position
        this.x = x;
        this.y = y;
        //Velocity
        this.vx = 0;
        this.vy = 0;
        //Acceleration
        this.ax = 0;
        this.ay = 0;
        //target position
        this.tx = this.x;
        this.ty = this.y;
        //target aquired
        this.target = false;

        this.counterMax = 100;
        this.counter = this.counterMax;
    }

    update(dt) {

        if (!dt) {
            dt = 1;
        }

        var dx = 0;
        var dy = 0;

        if (this.target) {

            var distance = Math.sqrt((this.tx - this.x) * (this.tx - this.x) + (this.ty - this.y) * (this.ty - this.y));

            var targetX = this.tx - this.x;
            var targetY = this.ty - this.y;

            targetX = (targetX * 10) / distance;
            targetY = (targetY * 10) / distance;

            //console.log(targetX + "  " + targetY);

            this.ax = targetX * Math.abs(this.tx - this.x);
            this.ay = targetY * Math.abs(this.ty - this.y);

            console.log(this.ax + "  " + this.ay + "  " + dt);

            //Update Velocity
            this.vx += this.ax * dt;
            this.vy += this.ay * dt;

            //console.log(this.vx + "  " + this.vy);

            //Update the position with the velocity
            this.x += (this.vx * dt);
            this.y += (this.vy * dt);

            //console.log(this.x + "  " + this.y + "  " + dt);

            //Clamp the velocity to 0 if it gets too small
            if (Math.abs(this.vx * this.vx + this.vy * this.vy) <= 0.5) {
                this.vx = 0;
                this.vy = 0;
            }





            /*
            //Calculations if there is a target
            var distance = Math.sqrt((this.tx - this.x) * (this.tx - this.x) + (this.ty - this.y) * (this.ty - this.y));
            dx = (this.tx - this.x) / distance;
            dy = (this.ty - this.y) / distance;

            this.vx += dx * 100 * dt;
            this.vy += dy * 100 * dt;

            this.x += (this.vx * dt);
            this.y += (this.vy * dt);

            //Clamp the velocity to 0 if it gets too small
            if (Math.abs(this.vx * this.vx + this.vy * this.vy) <= 0.5) {
                this.vx = 0;
                this.vy = 0;
            }
            */

            //Clamp the target distance
            if (distance < 1) {
                this.x = this.tx;
                this.y = this.ty;
                this.target = false;
            }
        } else {
            //Calculations when there is not a target

            //Apply Friction
            this.ax = -this.vx * 2;
            this.ay = -this.vy * 2;

            //Update Velocity
            this.vx += this.ax * dt;
            this.vy += this.ay * dt;

            //Update the position with the velocity
            this.x += (this.vx * dt);
            this.y += (this.vy * dt);

            //Clamp the velocity to 0 if it gets too small
            if (Math.abs(this.vx * this.vx + this.vy * this.vy) <= 0.5) {
                this.vx = 0;
                this.vy = 0;
            }
        }

        //If the position and the target are not the same, go to the target.
        /*if (this.tx != this.x || this.ty != this.y) {

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
        }*/

        /*if(this.counter <= 0){
            this.counter = this.counterMax;
            var b = new Blob(this.id, this.x, this.y, this.color);
            var angle = Math.random() * Math.PI * 2;
            var randomOffset = Math.random() * 30 + 20;
            var newX = (this.size + randomOffset) * Math.cos(angle);
            var newY = (this.size + randomOffset) * Math.sin(angle);
            b.tx = this.x + newX;
            b.ty = this.y + newY;
            blobList.push(b);
        }*/

        this.counter--;
    }

    getInfo() {
        return {
            x: this.x,
            y: this.y,
            color: this.color,
            size: this.size,
            mass: this.mass,
            selected: this.selected
        }
    }
}

module.exports = Cell;