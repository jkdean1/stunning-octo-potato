class Tile {

    constructor(x, y, w, h, c) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.color = c;
    }

    getInfo() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            color: this.color
        }
    }
}

module.exports = Tile;
