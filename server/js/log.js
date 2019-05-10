module.exports = function Log(logName, info, reason, newLine) {
    if (reason === "finish") {
        console.log('\x1b[32m%s\x1b[0m', "[COMPLETE] @" + logName + ": " + info + ".");
    } else if (reason === "error") {
        console.log('\x1b[31m%s\x1b[0m', "[ERROR] @" + logName + ": " + info + ".");
    } else if (reason === "info") {
        console.log('\x1b[36m%s\x1b[0m', "[INFO] @" + logName + ": " + info + ".");
    } else if (reason === "warn") {
        console.log('\x1b[33m%s\x1b[0m', "[WARNING] @" + logName + ": " + info + ".");
    } else {
        console.log("@" + logName + ": " + info + ".");
    }

    if (newLine === true) {
        console.log();
    }
}
