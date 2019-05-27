var Blob = require('./blob.js');
var Util = require('./util.js');

class Cell {
    constructor(id, uniqueID, x, y) {
        //Cells player id
        this.id = id;
        //unique id for collision
        this.uniqueID = uniqueID;
        //Type of cell either 1 or 0
        this.type = 1;
        //valid or not
        this.valid = true;
        //size
        this.size = 20;
        //mass
        this.mass = this.size * 2;
        //max speed
        this.maxSpeed = 2000;
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

    update(dt, mapWidth, mapHeight) {

        dt = dt || 0;

        if (this.target) {
            var ar = this.arrive();

            this.ax += ar[0];
            this.ay += ar[1];

            //Apply Friction
            this.ax += -this.vx * 2;
            this.ay += -this.vy * 2;

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

            //Clamp the position so it doesn't go outside the map...
            if(this.x - this.size <= 0)
            {
                this.x = this.size;
            }
            if(this.y - this.size <= 0)
            {
                this.y = this.size;
            }
            if(this.x + this.size >= mapWidth)
            {
                this.x = mapWidth - this.size;
            }
            if(this.y + this.size >= mapHeight){
                this.y = mapHeight - this.size;
            }

            this.ax = 0;
            this.ay = 0;
        }

        if(this.counter < 0){
            this.counter = this.counterMax;
        } 

        this.counter--;
    }

    arrive() {
        //Desired
        var desiredX = this.tx - this.x;
        var desiredY = this.ty - this.y;

        var d = Math.sqrt(desiredX * desiredX + desiredY * desiredY);
        var speed = this.maxSpeed;
        if (d < 500) {
            speed = Util.map(d, 0, 500, 0, this.maxSpeed);
        }

        desiredX = desiredX * speed / d;
        desiredY = desiredY * speed / d;

        var steerX = desiredX - this.vx;
        var steerY = desiredY - this.vy;

        steerX = Math.min(steerX, this.maxSpeed);
        steerY = Math.min(steerY, this.maxSpeed);

        return [steerX, steerY];
    }

    getInfo() {
        return {
            id: this.id,
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