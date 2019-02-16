/**
 * @param canvas : The canvas object where to draw . 
 *                 This object is usually obtained by doing:
 *                 canvas = document.getElementById('canvasId');
 * @param x     :  The x position of the rectangle.
 * @param y     :  The y position of the rectangle.
 * @param w     :  The width of the rectangle.
 * @param h     :  The height of the rectangle.
 * @param text  :  The text we are going to centralize.
 * @param fh    :  The font height (in pixels).
 * @param spl   :  Vertical space between lines
 * @param bckColor   :  The color for the background of the space
 * @param dashed   :  Boolean to select a dashed line for the box
 */
paint_centered_wrap = function(canvas, x, y, w, h, text, fh, spl, bckColor, dashed) {
    // The painting properties 
    // Normally I would write this as an input parameter
    var Paint = {
        RECTANGLE_STROKE_STYLE : 'black',
        RECTANGLE_LINE_WIDTH : 1,
        VALUE_FONT : '12px Arial',
        VALUE_FILL_STYLE : 'red'
    }
	
    /*
     * @param ctx   : The 2d context 
     * @param mw    : The max width of the text accepted
     * @param font  : The font used to draw the text
     * @param text  : The text to be splitted   into 
     */
    var split_lines = function(ctx, mw, font, text) {
        // We give a little "padding"
        // This should probably be an input param
        // but for the sake of simplicity we will keep it
        // this way
        mw = mw - 10;
        // We setup the text font to the context (if not already)
        ctx2d.font = font;
        // We split the text by words 
        var words = text.split(' ');
        var new_line = words[0];
        var lines = [];
        for(var i = 1; i < words.length; ++i) {
           if (ctx.measureText(new_line + " " + words[i]).width < mw) {
               new_line += " " + words[i];
           } else {
               lines.push(new_line);
               new_line = words[i];
           }
        }
        lines.push(new_line);
        // DEBUG 
        // for(var j = 0; j < lines.length; ++j) {
        //    console.log("line[" + j + "]=" + lines[j]);
        // }
        return lines;
    }
    // Obtains the context 2d of the canvas 
    // It may return null
    var ctx2d = document.getElementById("myCanvas").getContext('2d');
	
	// Create a custom fillText funciton that flips the canvas, draws the text, and then flips it back
    ctx2d.fillText = function(text, x, y) {
      this.save();       // Save the current canvas state
      this.scale(1, -1); // Flip to draw the text
      this.fillText.dummyCtx.fillText.call(this, text, x, -y); // Draw the text, invert y to get coordinate right
      this.restore();    // Restore the initial canvas state
    }
	
	// Create a dummy canvas context to use as a source for the original fillText function
    ctx2d.fillText.dummyCtx = document.createElement('canvas').getContext('2d');
	
    if (ctx2d) {
        // draw rectangular
        ctx2d.strokeStyle=Paint.RECTANGLE_STROKE_STYLE;
        ctx2d.lineWidth = Paint.RECTANGLE_LINE_WIDTH;
		if(dashed)
			ctx2d.setLineDash([6]);
        ctx2d.strokeRect(x, y, w, h);
		/// color for background	
		ctx2d.fillStyle = bckColor;
		/// draw background rect assuming height of font
		ctx2d.fillRect(x, y, w, h);
		/// text color
		ctx2d.fillStyle = '#000';
        // Paint text
        var lines = split_lines(ctx2d, w, Paint.VALUE_FONT, text);
        // Block of text height
        var both = lines.length * (fh + spl);
        if (both >= h) {
            // We won't be able to wrap the text inside the area
            // the area is too small. We should inform the user 
            // about this in a meaningful way
        } else {
            // We determine the y of the first line
            var ly = (h - both)/2 + y + spl*lines.length;
            var lx = 0;
            for (var j = 0, ly; j < lines.length; ++j, ly+=fh+spl) {
                // We continue to centralize the lines
                lx = x+w/2-ctx2d.measureText(lines[j]).width/2;
                // DEBUG 
                console.log("ctx2d.fillText('"+ lines[j] +"', "+ lx +", " + ly + ")");
                ctx2d.fillText(lines[j], lx, ly);
            }
        }
    } else {
    // Do something meaningful
    }
}

//return a color given a type of space
function findColor(type){
	if(type!=null)
		type=type.toLowerCase();
	switch(type) {
		case "office":
			return '#ff8000';
		case "laboratory":
			return '#ffbf00';
		case "meeting room":
			return '#ffff00';
		case "kitchen":
			return '#bfff00';
		case "rest room":
			return '#00ff40';
		case "class room":
			return '#00ffff';
		case "lounge":
			return '#0040ff';
		case "corridor":
			return '#8000ff';
		case "mail room":
			return '#ff00ff';
		case "elevator room":
			return '#ff0080';
		case "staircase":
			return '#ff0000';
		case "terrace":
			return '#8e481f';
		case "other":
			return '#808080';
		default:
			return '#FFFFFF'
	}
}


window.onload = function() {
	
	var myCanvas = document.getElementById("myCanvas");	
	
	//rotate canvas because of the issue with coordinate system
	myCanvas.getContext('2d').transform(1, 0, 0, -1, 0, myCanvas.height);	
	
	//paint rooms
	//$.getJSON("convertcsv_1st.json", function (data) {
	$.getJSON("convertcsv_2nd.json", function (data) {
	//$.getJSON("convertcsv_3rd.json", function (data) {
	//$.getJSON("convertcsv_4th.json", function (data) {
	//$.getJSON("convertcsv_5th.json", function (data) {
	//$.getJSON("convertcsv_6th.json", function (data) {
		$.each(data, function(key, value) {
			console.log(value);
			var scaleF =10;
			var colorRoom=findColor(value.type);
			
			paint_centered_wrap(myCanvas, value.x1*scaleF, (value.y1)*scaleF, (value.x2-value.x1)*scaleF, (value.y2-value.y1)*scaleF, value.name.toString(), 2, 2, colorRoom, false);
		});
	});	
	
	//paint legend
	$.getJSON("legend.json", function (data) {
		$.each(data, function(key, value) {
			console.log(value);
			var scaleF =9;
			var colorRoom=findColor(value.type);
			
			paint_centered_wrap(myCanvas, value.x1*scaleF, (value.y1)*scaleF, (value.x2-value.x1)*scaleF, (value.y2-value.y1)*scaleF, value.name.toString(), 2, 2, colorRoom, true);
		});
	});
}