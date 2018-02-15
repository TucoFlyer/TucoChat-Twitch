var fs = require('fs');
var url = require('url');

var chalk = require('chalk'); // colored text
var deasync = require('deasync'); // dea-async-ifyer
var request = require('request'); // http requests
var WebSocketClient = require('websocket').client; // websocket client
var tmi = require('tmi.js'); // twitch TMI client

function log (text) { // log to stdout w/o newline
	process.stdout.write(text);
}

// create vote action "enum"
var VoteActionEnum = {"FORWARD": 0, "BACKWARD": 1, "LEFT": 2, "RIGHT": 3};
Object.freeze(VoteActionEnum);

// create special action "enum"
var SpecialActionEnum = {"LOOK": 0}
Object.freeze(SpecialActionEnum);

// SETUP
log(chalk.blue("Checking CWD connection.txt..."));
var connectionFileExists = fs.existsSync("connection.txt"); // check if connection.txt exists in cwd
console.log(chalk.green(" OK!"));

var connectionFile; // path of connection file
if (connectionFileExists) {
	connectionFile = "connection.txt";
	console.log(chalk.green("CWD connection.txt found."));
} else {
	connectionFile = process.env.TUCOCHAT_CONNECTION_FILE
	console.log(chalk.yellow("CWD connection.txt not found, using TUCOCHAT_CONNECTION_FILE."));
}

log(chalk.blue("Reading connection.txt... (UTF-8)"));
var connectionFileContents = fs.readFileSync(connectionFile, "UTF-8"); // read connection file
console.log(chalk.green(" OK!"));

log(chalk.blue("Filtering QR Code from file..."));
var connectionFileLines = connectionFileContents.split("\n"); // split by newlines
var connectionAddr = connectionFileLines[0].trim(); // get 1st line and trim whitespaces from start to end
console.log(chalk.green(" OK!"));

log(chalk.blue(`Parsing "${connectionAddr}"...`));
var connectionURL = url.parse(connectionAddr); // parse URL with experimental url package
console.log(chalk.green(" OK!"));

log(chalk.blue(`Requesting WS addr from "${connectionURL.host}"...`));
var wsUrl = null;
request(`${connectionURL.protocol}//${connectionURL.host}/ws`, function (err, request, body) {
	if (err) {
		console.log(chalk.red(" FAIL!"));
		throw err;
	}
	console.log(chalk.green(" OK!"));
	console.log(chalk.magenta(`Response code: ${request.statusCode}`));
	wsUrl = JSON.parse(body).uri;
	console.log(chalk.green(`WS URL: ${wsUrl}`));
});

deasync.loopWhile(function(){return wsUrl == null}); // wait until async request finishes

log(chalk.blue("Creating TMI client..."));
var client = new tmi.client({
    identity: {
        username: process.env.TUCOCHAT_TWITCH_USERNAME,
        password: process.env.TUCOCHAT_TWITCH_OAUTH,
    },
    channels: process.env.TUCOCHAT_TWITCH_CHANNEL.split(",")
});
console.log(chalk.green(" OK!"));

log(chalk.blue("Setting eventhandlers..."));
client.on("chat", function(channel, userstate, message) {
    if (userstate.username.toLowerCase() == process.env.TUCOCHAT_TWITCH_USERNAME.toLowerCase()) return; // ignore own messages

    var sanitizedMessage = message.trim().toLowerCase(); // sanitize message: trim whitespaces from start & end, set to lowercase

    if (sanitizedMessage.startsWith("!look ")){ // check for special action LOOK
        specialAction = SpecialActionEnum.LOOK; // set sp-action var to LOOK action
        specialActionData = {
            target: sanitizedMessage.substring("!look ".length) // trim message of "!look ", leave object to look at
        }
        console.log(chalk.magenta(`LOOK action triggered by message. (TARGET: ${specialActionData.target})`));
    } else { // if not special action
        switch(sanitizedMessage) { // check sanitized message
            case "w": // if the message is "w"
                console.log(chalk.magenta("FORWARD action triggered by message."));
                voteAction = VoteActionEnum.FORWARD; // set vote FORWARD
                break;
            case "s": // if message is "s"
                console.log(chalk.magenta("BACKWARD action triggered by message."));
                voteAction = VoteActionEnum.BACKWARD; // set vote BACKWARD
                break;
            case "a": // if message is "a"
                console.log(chalk.magenta("LEFT action triggered by message."));
                voteAction = VoteActionEnum.LEFT; // set vote LEFT
                break;
            case "d": // if message is "d"
                console.log(chalk.magenta("RIGHT action triggered by message."));
                voteAction = VoteActionEnum.RIGHT; // set vote RIGHT
                break;
            default: // if not direction vote
                console.log(chalk.magenta("Non-action message, skipping."));
                return; // ignore this message, don't go through sorting & sending.
        }
    }
});

client.on("cheer", function (channel, userstate, message) { // on cheer
    console.log(chalk.magenta(`${userstate.username} cheered ${userstate.bits}x!`));
    client.say(process.env.TUCOCHAT_TWITCH_CHANNEL, `Thank you for the cheer, ${userstate.username}! <3`);
});

client.on("subscription", function (channel, username, method, message, userstate) {
    console.log(chalk.magenta(`${userstate.username} subscribed!`));
    client.say(process.env.TUCOCHAT_TWITCH_CHANNEL, `Thank you for subscribing, ${userstate.username}! <3`);
});

client.on("resub", function (channel, username, months, message, userstate, methods) {
    console.log(chalk.magenta(`${userstate.username} resubbed! (${months}m)`));
    client.say(process.env.TUCOCHAT_TWITCH_CHANNEL, `Thank you for being subbed for ${months} months, ${userstate.username}! <3`);
});
console.log(chalk.green(" OK!"));

log(chalk.blue("Connecting to Twitch..."));
client.connect();
console.log(chalk.green(" OK!"));