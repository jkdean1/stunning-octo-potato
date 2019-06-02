/*
 * Created by Jacob Cox
*/

class Util {
    static getRandomId() {
        return Math.random().toString(20).substr(2, 11);
    }

    static getRandomInt(min, max) {
        return Math.random() * (max - min) + min;
    }

    static getRandomColor() {
        var hue = 'rgb(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ')';

        return hue;
    }

    static map(value, inMin, inMax, outMin, outMax){
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    static doCirclesOverlap(x1, y1, r1, x2, y2, r2) {
        return Math.abs((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) < (r1 + r2) * (r1 + r2);
    }
    
    static getDistance(x1, y1, r1, x2, y2, r2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) || 1;
    }
}

module.exports = Util;
