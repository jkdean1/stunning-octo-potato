class Cell {
    constructor(id, x, y) {
        //Cells player id
        this.id = id;
        //size
        this.size = 80;
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
        this.ax = 1;
        this.ay = 1;
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
