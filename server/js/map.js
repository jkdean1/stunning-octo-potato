var Util = require('./util.js');
var Tile = require('./tile.js');

class Map {

    constructor(w, h, c) {
        this.width = w;
        this.height = h;
        this.map = [];

        for (var i = 0; i < this.width; i += c.tileWidth) {
            for (var j = 0; j < this.height; j += c.tileHeight) {
                var t = new Tile(i, j, c.tileWidth, c.tileHeight, Util.getRandomColor());
                this.map.push(t);
            }
        }
    }

    getInfo(player) {
        var data = [];
        for (var i = 0; i < this.map.length; i++) {

            var x = this.map[i].x;
            var y = this.map[i].y;
            var w = this.map[i].width;
            var h = this.map[i].height;
            var c = this.map[i].color;

            var count = 0;

            //check if the data should be sent
            if ((x > player.canvasXZero - (this.map[0].width * 2)) && (y > player.canvasYZero - (this.map[0].height * 2)) && (x < player.canvasXMax + (this.map[0].width * 2)) && (y < player.canvasYMax + (this.map[0].height * 2))) {

                var info = {
                    x: x,
                    y: y,
                    width: w,
                    height: h,
                    color: c
                }

                data.push(info);
                count++;
            }
        }
        return data;
    }
}

module.exports = Map;
