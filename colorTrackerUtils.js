var TrackerUtils = (function() {

    var my = {};

    my.startTrackingColors = function(tracker) {
        var trackedColors = {
            custom: false
        };

        Object.keys(tracking.ColorTracker.knownColors_).forEach(function(color) {
            trackedColors[color] = true;
        });

        var colors = [];
        for (var color in trackedColors) {
            if (trackedColors[color]) {
                colors.push(color);
            }
        }

        tracker.setColors(colors);
    }


    my.addTrackingColor = function(value, name, tracker) {
        /* The individual components of a hexadecimal string are taken apart and restored as three integers.*/
        var components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
        /* parseInt then extracts a base 16 number from the three resultant strings... they should already be in base 16.*/
        var customColorR = parseInt(components[1], 16);
        var customColorG = parseInt(components[2], 16);
        var customColorB = parseInt(components[3], 16);

        /* The colourTotal is then defined as the sum of the parts.*/
        var colorTotal = customColorR + customColorG + customColorB;

        /* If the total is both of equal value and type to 0 (integer symbolising a black colour)...*/
        if (colorTotal === 0) {
            /* ...the colour is then registered as one to be tracked as something which is "less than 10 in overall brightness".
             * (If I have reached this stage, colorTotal, which is supposed to be a hexadecimal value, is actually an integer
             * because it cannot be detected by the drone (I think). */
            tracking.ColorTracker.registerColor(name, function(r, g, b) {
                return r + g + b < 10;
            });
        } else {
            /* If this is not the case, then the proportions of red and green hues in the image are calculated, because the colour of the image can be measured as significant. */
            var rRatio = customColorR / colorTotal;
            var gRatio = customColorG / colorTotal;

            tracking.ColorTracker.registerColor(name, function(r, g, b) {
                /* A new total is taken for the overall colour of the image. colorTotal might be a lower bound for the area of detected colour whilst colorTotal might be an upper bound?*/
                var colorTotal2 = r + g + b;

                /* If colorTotal2, (which should be a number) is a number, then we are on a good path but the colour being represented here is still black. */
                if (colorTotal2 === 0) {
                    /* If colorTotal is less than 10 when recalculated as an integer, I have found a colour which is more or less black. 10 is a number inserted to allow for a small amount of variance here. */
                    if (colorTotal < 10) {
                        return true;
                    }
                    /* If colorTotal is equal-to-or-greater-than 10, I have found a colour which is actually of significance, but on the contrary the integer conversion has not worked.
                     * If I arrive here, I cannot see any other purpose of this section other than for safely retrieving errors.
                     */
                    return false;
                }

                /* New ratiosa re then assigned here. */
                var rRatio2 = r / colorTotal2,
                    gRatio2 = g / colorTotal2,
                    deltaColorTotal = colorTotal / colorTotal2,
                    deltaR = rRatio / rRatio2,
                    deltaG = gRatio / gRatio2;

                /* If the differences are consistently between 0.8 and 1.2, we have found a suitable colour to measure.*/
                return deltaColorTotal > 0.8 && deltaColorTotal < 1.2 &&
                    deltaR > 0.8 && deltaR < 1.2 &&
                    deltaG > 0.8 && deltaG < 1.2;
            });
        }

    }

    my.loadImage = function (data, element) {
        // console.log("received frame");
        var blob = new Blob([data], {
            type: 'image/png'
        });
        var url = URL.createObjectURL(blob);
        var img = new Image();

        img.onload = function() {
            var canvas = $(element).get(0);
            var context = canvas.getContext('2d');   
            context.drawImage(this, 0, 0);
            URL.revokeObjectURL(url);
        }
        img.src = url;
    }

    return my;

}());
