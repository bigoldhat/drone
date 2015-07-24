var droneAddress = "ws://127.0.0.1:8001/";
var websocket;
var tracker;

/* The live colour tracker is initialised, with tracking occurring on whatever is being passed from .drone.*/

function init() {
    droneWebSocket(droneAddress);
    tracker = initTracker("#example");
    tracking.track("#example .drone", tracker);
}

function droneWebSocket(url) {
    /* Connect to the websocket server.*/
    websocket = new WebSocket(url);
    /* Output a successful connection message to the console.*/
    websocket.onopen = onOpen;
    websocket.onmessage = onMessage;
    websocket.onclose = onClose;
    websocket.onerror = onError;
}

function onOpen() {
    console.log("Connection open!");
}

function onMessage(message){
    console.log(message);
    // Received a new snapshot form the drone camera
    if (message.data instanceof Blob) {
        // console.log("received message");
        TrackerUtils.loadImage(message.data, "#example .drone");
        tracking.track("#example .drone", tracker);
    }
}

function onClose() {
    console.log("Connection closed");
}

function onError() {
    console.log("Connection error:");
}

function initTracker(element) {
    // Initialise a color tracker
    /* A new colour-tracker object is created.*/
    tracker = new tracking.ColorTracker();

    tracker.setMinDimension(20);

    /* Optional: Colours go here if I only want to track specific colours.*/
    TrackerUtils.addTrackingColor("#A94A45", "red", tracker);
    TrackerUtils.addTrackingColor("#5EA24E", "green", tracker);
    TrackerUtils.addTrackingColor("#CB7F84", "magenta", tracker);

    /* Tracking then begins.*/
    TrackerUtils.startTrackingColors(tracker);

    // Whenever there is a new color detected, mark them
    /* A message is passed to the console whenever a new colour is detected - a new track event has occurred here if this is the case.*/
    tracker.on('track', function(event) {
        //markColors(event.data, element);
        //decideDroneMovement(event.data);
        move.up = true;
        move.frontFlip();
        move.down = true;
        websocket.send(JSON.stringify(move));
        console.log(event.data);
    });

    return tracker;
}

function markColors(colors, element) {
    /* Link the canvas on the HTML page to this variable, and obtain it's context with the knowledge that it will be treated as a 2D object.*/
    var canvas = $(element + ' .canvas').get(0);
    var context = canvas.getContext('2d');

    /* The canvas is cleaned from a previous marking.*/
    context.clearRect(0, 0, context.width, context.height);
    /* For each of the colours detected, a rectangle is drawn onto the canvas.*/
    for (var i = 0; i < colors.length; i++) {
        drawRectangle(colors[i], context);
        /* The details about this rectangle are then printed to the div container on the HTML page.*/
        writeRectangle(colors[i], element + " .output");
    }
}

/* This function allows for the drawing of hollow rectangles the same colour as a detected colour.*/
function drawRectangle(rect, context) {
    context.strokeStyle = rect.color;
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
}

function writeRectangle(rect, element) {
    $(element)
        .append("<p>")
        .append(rect.color + ": " + rect.width + "X" + rect.height)
        .append(" @ " + rect.x + ":" + rect.y)
        /* I felt that this was also needed.*/
        .append("</p>")
}

function decideDroneMovement(colors) {
    /* Drone movement before each decision is initially neutralised. */
    var move = {
        forward: false,
        backward: false,
        up: false,
        down: false
    };

    /* ORIGINAL SOLUTION*/
    /*colors.forEach(function(rectangle) {
        if (rectangle.color === "green") {
            // Sufficiently close to the block
            if (rectangle.width > 250) {
                move.up = true;
                move.forward = false;
            }

        }
        else if (rectangle.color === "red") {
            if (rectangle.width > 250) {
                move.down = true;
                move.forward = false;
            }
        }
    });

/*    colors.forEach(function(rectangle {
        if (rectangle.color === "red") {
            if (rectangle.width < 250) {
                move.forward = true;
            }
            if (rectangle.) {

            }
        }
    }*/


    /* Additional iterants are created.
    var iterant_forward = 0,
        iterant_backward = 0,
        iterant_up = 0,
        iterant_down = 0;
    The angular size of the object is determined here and can be experimented with.
    var angularSize = 10;
    for (var i = 0; i < colors.length; i++) {
        var rectangle = colors[i];

        if (rectangle.width < angularSize) {
            iterant_forward++;
        }

        if (rectangle.width > angularSize) {
            iterant_backward++;
        }

        if (rectangle.height > angularSize) {
            iterant_up++;
        }

        if (rectangle.height > angularSize) {
            iterant_down++;
        }
    }

    if (iterant_forward == colors.length) {
        console.log("Move forward");
        move.forward = true;
    }

    if (iterant_backward == colors.length) {
        console.log("Move backward");
        move.backward = true;
    }

    if (iterant_up == colors.length) {
        console.log("Move up");
        move.up = true;
    }

    if (iterant_down == colors.length) {
        console.log("Move down");
        move.down = true;
    }*/
    websocket.send(JSON.stringify(move));
}

window.addEventListener("load", init);