var Cylon = require('cylon');
var ws = require('nodejs-websocket');
var bot;

// Initialise the robot
/* Here, I am providing the appropriate connection details between the computer and the drone over WiFi.*/
Cylon.robot()
    .connection("ardrone", {
        adaptor: 'ardrone',
        port: '192.168.1.1'
    })
    .device("drone", {
        driver: "ardrone",
        connection: "ardrone"
    })
    .device("nav", {
        driver: "ardrone-nav",      // Combine with a second device to have more information
        connection: "ardrone"
    })
    .on("ready", fly);
    /* The drone is turned on, but it still needs to be programmed with code found in the function fly(robot). */
    
// Fly the bot
/* "Note that we are assigning the argument robot to a global variable bot. This is for convenience so we can let other functions also access the drone. This will come in handy in later modules." - CCA */
var bot;
function fly(robot) {
    /* robot is an object (of which there could be multiple drone members if Node.js supports multiple drones, drone is a member of that object (referring to the tangible drone) and takeoff is a function of the drone (overall, I think). */
    bot = robot;
    /* This line prevents unwanted data being sent to the computer from the drone
    bot.drone.config('general:navdata_demo', 'TRUE');
    /* The robot supplies live information at the current time upon calling the following:

     bot.nav.on("navdata", function(data) {
     console.log(data);
     });
     */

    /* Provide the robot with details that it is on a flat surface. */
    bot.drone.ftrim();
    /* Begin receiving image data */
    bot.drone.getPngStream().on("data", processFrame);
    /* Takeoff!!!!1*/
    bot.drone.takeoff();
    /* The program effectively 'waits' before programming the drone to come back down again. */
    after(10*1000, function() {
        bot.drone.land();
    });
}

function receiveConnection(connection) {
    console.log("New connection");
    connection.on("close", function(message) {
        console.log("Connection closed", message);
    });
    connection.on("error", function(error) {
        console.log("Connection error", error);
    });
    connection.on("text", moveDrone);
    connection.sendText("Hi!");
    connection.sendText("Current altitude: ", bot.drone.altitude.toString);
}

function moveDrone(message) {
    /* The message is parsed for analysis.*/
    var move = JSON.parse(message);

    /* If the decision made is to move the drone upward, then the drone does so at a speed of 0.4, for 2000ms (I think...?).*/
    if (move.forward) {
        bot.drone.forward(0.4);
        after(2*1000, function() {
            bot.drone.forward(0);
        });
    }

    if (move.backward) {
        bot.drone.backward(0.4);
        after(2*1000, function() {
            bot.drone.backward(0);
        });
    }

    if (move.up) {
        bot.drone.up(0.4);
        after(2*1000, function() {
            bot.drone.up(0);
        });
    }

    if (move.down) {
        bot.drone.down(0.4);
        after(2*1000, function() {
            bot.drone.down(0);
        });
    }
}

/* This function processes each of the image frames being received from the drone.*/
/* It has since been updated to only send a new frame once every 200ms, to prevent excessive network latency.*/
var sent = false;
function processFrame(frame) {
    if (!sent) {
        /* I think that a while loop would terminate immediately, rather than after the end of the sequence, if "sent = true;" was placed first like it is here.*/
        sent = true;
        server.connections.forEach(function(conn) {
            conn.sendBinary(frame);
        });
        setTimeout(function(){ sent = false}, 200);
    }
}

var server = ws
    .createServer(receiveConnection)
    .listen(8001);

Cylon.start();