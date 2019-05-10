var Util = require('./util.js');

class Blob {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.c = Util.getRandomColor();
    }
}

module.exports = Blob;
