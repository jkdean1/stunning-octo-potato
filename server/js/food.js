/*
 * Created by Jacob Cox
 */

var Util = require('./util.js');

class Food {
    constructor(x, y) {
        this.valid = true;
        this.type = 2;
        this.x = x;
        this.y = y;
        this.size = 8;
        this.color = Util.getRandomHSLColor();
    }

    getInfo() {
        return {
            type: this.type,
            color: this.color,
            x: this.x,
            y: this.y,
            size: this.size
        }
    }
}

module.exports = Food;