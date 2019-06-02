/*
 * Created by Jacob Cox
 */

var fs = require('fs')
var rawdata = fs.readFileSync('./config.json');
var c = JSON.parse(rawdata);

var logger = fs.createWriteStream('log/log.txt', {
    flags: 'a' // 'a' means appending (old data will be preserved)
});

module.exports = function Log(info, reason) {

    var today = new Date();
    var date = (today.getMonth() + 1) + "-" + today.getDate() + "-" + today.getFullYear();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + " | " + time;

    var logData = "<<<ERROR NOTHING LOGGED>>>";

    if (reason === "finish") {
        logData = "[COMPLETE] @[" + dateTime + "]: " + info;
        console.log('\x1b[32m%s\x1b[0m', logData);
    } else if (reason === "error") {
        logData = "[ERROR] @[" + dateTime + "]: " + info;
        console.log('\x1b[31m%s\x1b[0m', logData);
    } else if (reason === "info") {
        logData = "[INFO] @[" + dateTime + "]: " + info;
        console.log('\x1b[36m%s\x1b[0m', logData);
    } else if (reason === "warn") {
        logData = "[WARNING] @[" + dateTime + "]: " + info;
        console.log('\x1b[33m%s\x1b[0m', logData);
    } else {
        logData = info;
        console.log(logData);
    }

    if (c.logToFile) {
        logData = "\n" + logData;
        logger.write(logData);
    }
}

//########################################################################################
//Everything required to allow the program to properly write to the log file when closing. 
//########################################################################################

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', function () {
    exitHandler.bind(null, {
        cleanup: true
    })
});

//catches ctrl+c event
process.on('SIGINT', function () {

    var today = new Date();
    var date = (today.getMonth() + 1) + "-" + today.getDate() + "-" + today.getFullYear();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + " | " + time;

    var bar = "###############################################################"
    var logData = "[COMPLETE] @[" + dateTime + "]: " + "Server stopped on port: " + c.port;
    console.log("\n" + bar);
    console.log('\x1b[31m%s\x1b[0m', logData);
    console.log(bar);
    if (c.logToFile) {
        logger.write("\n\n" + bar + "\n" + logData + "\n" + bar + "\n\n\n\n\n\n\n");
    }

    exitHandler.bind(null, {
        exit: true
    });

    process.exit();
});
