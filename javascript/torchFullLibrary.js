/*
 * Torch basic library.
 * 
 * Objects here are common, everyday objects and shapes that any applet may want to use.
 * Examples include lines, circles, rectangles, patterns, etc.
 * 
 * This base file is not mandatory to include, but is highly recommended.
 * Other libraries (like charting and widgets) may reference shapes held here,
 * so you won't be able to include them without this base library.
 * 
 * When determining if an item belongs here, ask whether it is independent
 * and commonly used.  If it is, then consider putting it here.
 */

/*
 * A basic line between two points
 */
torch.lib.line = function(point1, point2, stroke, width, hitWidth)
{
	this.point1 = point1 || new torch.point2d();
	this.point2 = point2 || new torch.point2d();
	this.stroke = stroke || "black";
	this.width = width || 1;
	this.hitWidth = (hitWidth >= 0 && hitWidth) || this.width;
	
	this.draw = function(context)
	{
		context.save();
		context.strokeStyle = this.stroke;
		context.lineWidth = this.width;
		context.beginPath();
		context.moveTo(this.point1.x, this.point1.y);
		context.lineTo(this.point2.x, this.point2.y);
		context.stroke();
		context.restore();
	};
	
	this.hitDetect = function(x,y)
	{
		var distanceFromLine = Math.abs((this.point2.x-this.point1.x)*(this.point1.y-y)-(this.point1.x-this.x)*(this.point2.y-this.point1.y))/Math.sqrt(Math.pow(this.point2.x-this.point1.x)+Math.pow(this.point2.y-this.point1.y));
		return(distanceFromLine <= this.hitWidth);
	};
};
torch.lib.line.prototype = new torch.lib.baseTorchObject();

/*
 * A "trail", which is basically a multi-line of many points.
 * Hope to supplement/replace this with the Path objects when they come out.
 */
torch.lib.trail = function(strokeStyle, width, hitWidth)
{
	this.points = [];
	this.stroke = strokeStyle || "black";
	this.width = width || 1;
	if(this.width <=0){this.width = 1;}
	this.hitWidth = hitWidth || this.width;
	
	//convenience method; accessing points directly is also ok
	this.addPoint = function(point)
	{
		this.points.push(point);
	};
	
	this.draw = function(context)
	{
		if(this.points.length < 2){return;}
		
		var point = new torch.point2d();
		
		context.save();
		context.strokeStyle = this.stroke;
		context.lineWidth = this.width;
		context.beginPath();
		
		point = this.points[0];
		context.moveTo(point.x, point.y);
		
		for(var i=1; i<this.points.length; i++)
		{
			point = this.points[i];
			context.lineTo(point.x, point.y);
		}
		
		context.stroke();
		context.restore();
	};
	
	this.hitDetect = function(context)
	{
		//...yeah, I'll get back to you.
		//this will likely involve keeping bounds and doing
		//math beyond my ability.
		return false;
	};
};
torch.lib.trail.prototype = new torch.lib.baseTorchObject();

torch.lib.circle = function(radius, center, fill, stroke, strokeWidth)
{
	this.radius = radius || 10;
	this.center = center || new torch.point2d();
	this.fill = fill || "black";
	this.stroke = stroke || "black";
	this.strokeWidth = strokeWidth || 0;
	
	this.draw = function(context)
	{
		context.save();
		context.strokeStyle = this.stroke;
		context.lineWidth = this.strokeWidth;
		context.fillStyle = this.fill;
		context.beginPath();
		context.arc(this.center.x, this.center.y, this.radius, 0, 2*Math.PI, true);
		context.fill();
		
		if(this.strokeWidth > 0)
		{
			context.beginPath();
			context.arc(this.center.x, this.center.y, this.radius, 0, 2*Math.PI, true);
			context.stroke();
		}
		
		context.restore();
		
	};
	
	this.hitDetect = function(x,y)
	{
		var result = ( Math.sqrt(Math.pow(x-this.center.x, 2) + Math.pow(y-this.center.y, 2)) <= this.radius + this.strokeWidth/2 );
		return result;
	};
};
torch.lib.circle.prototype = new torch.lib.baseTorchObject();

torch.lib.rectangle = function(upperLeft, bottomRight, fill, strokeWidth, stroke)
{
	this.upperLeft = upperLeft;
	this.bottomRight = bottomRight;
	this.fill = fill || "black";
	this.strokeWidth = strokeWidth || 0;
	if(this.strokeWidth < 0){this.strokeWidth = 0;}
	this.stroke = stroke || "black";
	
	this.draw = function(context)
	{
		context.save();
		context.strokeStyle = this.stroke;
		context.fillStyle = this.fill;
		context.lineWidth = this.strokeWidth;
		
		//to do: check if fill is valid
		//string test alone won't work, as patterns are valid fills.
		context.beginPath();
		context.moveTo(this.point1.x, this.point1.y);
		context.lineTo(this.point2.x, this.point1.y);
		context.lineTo(this.point2.x, this.point2.y);
		context.lineTo(this.point1.x, this.point2.y);
		context.lineTo(this.point1.x, this.point1.y);
		context.fill();
		
		if(this.strokeWidth > 0)
		{
			context.beginPath();
			context.moveTo(this.point1.x, this.point1.y);
			context.lineTo(this.point2.x, this.point1.y);
			context.lineTo(this.point2.x, this.point2.y);
			context.lineTo(this.point1.x, this.point2.y);
			context.lineTo(this.point1.x, this.point1.y);
			context.stroke();
		}
		context.restore();
	};
	
	this.hitDetect = function(x,y)
	{
		//since upperleft/lowerright is not enforced, some error handling needed.
		var p1x = this.point1.x;
		var p1y = this.point1.y;
		var p2x = this.point2.x;
		var p2y = this.point2.y;
		var strokeAdjustX = this.strokeWidth/2;
		var strokeAdjustY = strokeAdjustX;
		
		if(p1x > p2x){strokeAdjustX*=-1;}
		if(p1y > p2y){strokeAdjustY*=-1;}
		
		var t = torch.util;
		return (t.isNegative(x - (p1x-strokeAdjustX)) == t.isNegative((p2x+strokeAdjustX) - x) && 
				t.isNegative(y - (p1y-strokeAdjustY)) == t.isNegative((p2y+strokeAdjustY) - y));
	};
};
torch.lib.rectangle.prototype = new torch.lib.baseTorchObject();

//NOTE:
//The font parameter is a torch.font object!
//
//Also note: current implementation auto-trims.
//Unsure whether non-trimmed strings would ever be desired.
torch.lib.textLabel = function(text, origin, font, alignment, baseline, maxWidth)
{
	//parameter order is still being finalized.
	this.text = text || "";
	this.origin = origin || new torch.point2d();
	this.font = font || new torch.font();
	this.alignment = alignment || "start";
	this.baseline = baseline || "alphabetic";
	this.maxWidth = maxWidth || -1;	//default is no max width
	
	this.draw= function(context)
	{
		context.save();
		context.font = this.font.makeString();
		context.textAlign = this.alignment;
		context.textBaseline = this.baseline;
		context.fillStyle = this.font.fontColor;
		
		if(this.maxWidth < 0)
		{
			context.fillText(this.text, this.origin.x, this.origin.y);
		}
		else
		{
			var lines = this.getLines(context, this.text, this.maxWidth);
			var verticalOffset = 0;
			for (var i = 0; i < lines.length; i++)
			{
				context.fillText(lines[i], this.origin.x, (this.origin.y + verticalOffset));
				verticalOffset += this.font.fontSize;
			}
		}
		context.restore();
	};
	
	this.getLines = function(context, words, maxLength) 
	{     
		var wordArray = words.split(" ");        
		var	lineArray = [];         
		var	line = "";                 
		var	measure = 0;     

		for (var i = 0; i < wordArray.length; i++) 
		{
			var word = wordArray[i];         
			measure = context.measureText(line+word).width;         
			
			if (measure < maxLength) 
			{
				line += (word+" ");
			} 
			else 
			{
				line = line.trim();
				lineArray.push(line); 
				line = word;
			}
		}     

		lineArray.push(line);
		return lineArray;
	}; 
	
	this.getWidthInContext = function(c)
	{
		var lines = this.getLines(c, this.text, this.maxWidth);
		var maxWidth = 0;
		
		c.save();
		c.font = this.font.makeString();
		
		for (var i = 0; i < lines.length; i++) 
		{
			var line = lines[i];         
			measure = c.measureText(line).width;         
			
			if (measure > maxWidth) 
			{maxWidth = measure;}
		} 
		
		return maxWidth;
	};
	
	this.getHeightInContext = function(c)
	{
		return this.font.fontSize*this.getLines.length;
	};
	
	this.hitDetect = function(x,y,context)
	{
		var dims = this.hitDetectDims(context);
		
		var xHit = (x > dims.startX && x < dims.endX);
		var yHit = (y > dims.startY && y < dims.endY);
		
		return (xHit && yHit);
	};
	

	
	//NOTE:
	//Doesn't yet work for width-constrained labels!
	//Future improvement.
	this.hitDetectDims = function(context)
	{
		//box method; not text method
		var startX, endX, startY, endY, a,b,d,w,h;
		a=this.alignment;
		b=this.baseline;
		context.save();
		context.font = this.font.makeString();
		context.textAlign = a;
		context.textBaseline = b;
		d = context.measureText(this.text);
		context.restore();
		
		w=d.width;
		h=this.font.fontSize;
		
		if(a=="start"||a=="left")	//This method only works for left-to-right languages like English.
		{startX = this.origin.x;endX = this.origin.x + w;}
		else if(a=="end"||a=="right")
		{startX = this.origin.x-w;endX = this.origin.x;}
		else if(a=="middle")
		{startX = this.origin.x-w/2;endX = this.origin.x+w/2;}
		
		if(b=="top")	//This method only works for top, middle, alphabetic, and bottom.  Alphabetic is a guess.
		{startY = this.origin.y;endY = this.origin.y + h;}
		else if(b=="middle")
		{startY = this.origin.y-h/2;endY = this.origin.y+h/2;}
		else if(b=="alphabetic")
		{startY = this.origin.y-h*0.8;endY = this.origin.y+h*0.2;}
		else if(b=="bottom")
		{startY = this.origin.y-h;endY = this.origin.y;}
		
		return {startX:startX, startY:startY, endX:endX, endY:endY};
	};
};
torch.lib.textLabel.prototype = new torch.lib.baseTorchObject();

/**
 * Dashed line.
 * Development on this object will not be heavy, as the API is set to include
 * a dashed option on the context.  This option will be incorporated into the
 * existing line and trail objects, which will make this object redundant.
 * 
 * Until then, this is the API for a dashed line.
 * 
 * @param from
 * @param to
 * @param pattern
 * @param stroke
 * @param width
 * @param hitWidth
 */
torch.lib.dashedLine = function(from, to, pattern, stroke, width, hitWidth)
{
	this.f = from || new torch.point2d(0,0);
	this.t = to || new torch.point2d(0,0);
	this.p = pattern || [5,5];
	this.s = stroke || "black";
	this.w = width || 0;
	this.h = hitWidth || this.w;
	
	this.draw = function(context)
	{
		//t: this
		//c: context
		//n: length of pattern array
		//i: current time index
		//j: current pattern element
		//k: current pattern index
		//p: current point
		//d: draw or dash
		//f: yeah, it's useless.  It's a placholder for an anti-aliasing function.
		
		//Determine the line as a parameterized equation running from time [0,1].
		//(That is the method this.pointAtTime.)
		//
		//Start at time 0.  Start at point "from", the starting point.
		//Draw a line with the length given in the first element of the pattern
		//array; do this by determining at what time the end of that line
		//would be reached, finding the point at that time, and drawing
		//a line between your start point and newly determined point.
		//Set the start point to now be the newly determined point.
		//Using the next value in the pattern array (if there is one;
		//otherwise, begin again at the first value in the array), perform
		//the calculations again, but do not draw the line.  Repeat the
		//previous steps, alternating between drawing and not drawing, until
		//you have advance past time 1.
		//
		//If you can improve the antialiasing (which would probably depend
		//on the slope of the line), feel free to modify function f().
		this.xDif = this.t.x-this.f.x;
		this.yDif = this.t.y-this.f.y;
		this.d = Math.sqrt(Math.pow(this.xDif,2) + Math.pow(this.yDif,2));
		var t=this,c=context,n=t.p.length,i=0,k=0,j=t.p[k],p=t.f,d=true;
		var f=function(a){return a;};
		
		c.save();
		c.strokeStyle = this.s;
		c.lineWidth = this.w;
		while(i<1)
		{
			i+=j/t.d;if(i>1){i=1;};var a=this.pointAtTime(i);
			if(d){
				c.beginPath();c.moveTo(f(p.x),f(p.y));c.lineTo(f(a.x),f(a.y));c.stroke();
			}
			d=!d;p=a;k++;if(k>=n){k=0;};j=t.p[k];
		}
		c.restore();
	};
	
	this.pointAtTime = function(t)
	{return(new torch.point2d(this.f.x+this.xDif*t,this.f.y+this.yDif*t));};
	
	this.hitDetect = function(x,y,c)
	{
		var t = this.t;
		var f = this.f;
		
		//distance to line must be less than hitWidth
		var d = Math.abs((t.x-f.x)*(f.y-y)-(f.x-x)*(t.y-f.y))/Math.sqrt(Math.pow(t.x-f.x)+Math.pow(t.y-f.y));
		return(d <= this.h);
	};
};
torch.lib.dashedLine.prototype = new torch.lib.baseTorchObject();torch.lib.Slider = function(x, y, width, minValue, maxValue, increment, start)
{
	this.leftEdge = x || 0;
	this.y = y || 0;
	this.width = width || 75;
	this.rightEdge = this.leftEdge+this.width;
	this.height = 11;
	this.minValue = minValue || 0;
	this.maxValue = maxValue || 10;
	this.increment = increment || 1;
	this.tab = new torch.lib.SliderTab(this, start);
	
	//listens to entire canvas for a mouseup;
	//means dragging should stop
	this.canvasHitListener = {};
	this.canvasHitListener.owner = this;
	
	this.draw = function(context){
		context.save();
		context.fillStyle = "rgb(220,220,220)";
		context.lineWidth = 1;
		context.strokeStyle = "gray";
		context.fillRect(this.leftEdge, this.y, this.width, this.height);
		context.strokeRect(this.leftEdge+0.5, this.y+0.5, this.width, this.height);
		this.tab.draw(context);
		context.restore();
	};
	
	this.hitDetect = function(x,y)
	{
		return (x > this.leftEdge && x < this.leftEdge + this.width && y > this.y && y < this.y + this.height);
	};
	
	this.onmousedown  = function(x,y)
	{
		this.tab.slide(x);
		this.requestRedraw();
	};

	this.ontouchstart = function(x,y,e,context)
	{
		this.tab.dragging = true;
		this.onmousedown(x,y,e,context);
	};
	
	this.onHasBeenAdded = function(listener, name)
	{
		listener.add(name+".tab", this.tab);
		listener.add(name+".canvasHitListener", this.canvasHitListener);
	};
	
	this.canvasHitListener.hitDetect = function(){return this.owner.tab.dragging;};
	this.canvasHitListener.onmouseup = this.canvasHitListener.ontouchend = function(){this.owner.tab.dragging = false;this.owner.requestRedraw();};
	this.canvasHitListener.onmousemove = this.canvasHitListener.ontouchmove = function(x,y){if(this.owner.tab.dragging){this.owner.tab.slide(x);this.owner.requestRedraw();}};
	this.canvasHitListener.onmouseout = function(x,y,e){this.owner.tab.onmouseup();};
	this.tick = function(){};
	return this;
};
torch.lib.Slider.prototype = new torch.lib.baseTorchObject();

torch.lib.SliderTab = function(owner, start)
{
	this.owner = owner;
	this.width = 8;
	this.height = this.owner.height+10;
	this.value = start;
	this.dragging = false;
	this.range = this.owner.maxValue - this.owner.minValue;
	this.unitDistance = this.range/this.owner.width;	//dollars per pixel
	this.x = this.owner.leftEdge + (this.value - this.owner.minValue)/this.unitDistance - this.width/2;
	this.slideFlag = false;

	this.draw = function(context)
	{
		if(this.dragging)
		{
			context.canvas.style.cursor = "pointer";
		}
		else{context.canvas.style.cursor = "default";}
		context.save();
		context.fillStyle = "black";
		this.x = Math.floor(this.owner.leftEdge + (this.value - this.owner.minValue)/this.unitDistance - this.width/2);
		
		context.fillRect(this.x, this.owner.y-5, this.width, this.height);
		context.restore();
	};
	
	this.onmousedown = this.ontouchstart = function(x,y)
	{
		this.dragging = true;
		this.owner.requestRedraw();
	};
	
	this.onmouseup = this.ontouchend = function(x,y)
	{
		this.dragging = false;
		this.owner.requestRedraw();
	};
	
	this.slide = function(x)
	{
		//determine what dollar amount to be;
		var distanceOver = x-this.owner.leftEdge;
		this.value = Math.round((distanceOver * this.unitDistance)/this.owner.increment)*this.owner.increment+this.owner.minValue;
		
		//snap to nearest increment
		this.value = Math.round(this.value/this.owner.increment)*this.owner.increment;
		
		if(this.value > this.owner.maxValue){this.value = this.owner.maxValue;}
		if(this.value < this.owner.minValue){this.value = this.owner.minValue;}
		
		//this.x = this.value*this.unitDistance + this.owner.leftEdge;
		
		this.slideFlag = true;
	};
	
	this.hitDetect = function(x,y)
	{
		var leftSide = this.x;
		var rightSide = this.x+this.width;
		var topSide = this.owner.y-7;
		var bottomSide = topSide + this.height;
		
		return ( x < rightSide && x > leftSide && y < bottomSide && y > topSide);
	};
	
	this.focus = function()
	{this.giveCanvasFocus();};
	
	this.blur = function()
	{this.clearCanvasFocus();};
	
	this.tick = function(){};
	return this;
};
torch.lib.SliderTab.prototype = new torch.lib.baseTorchObject();


torch.lib.SlideWheel = function(x, y, barWidth, minValue, maxValue, increment, start, singleSwipePercent)
{
	this.leftEdge = x;
	this.y = y;
	this.rightEdge = x+barWidth;
	this.width = barWidth;
	this.height = 7;
	this.minValue = minValue;
	this.maxValue = maxValue;
	this.increment = increment;
	this.singleSwipePercent = singleSwipePercent || 0.5;
	this.tab = new torch.lib.SlideWheelWindow(this, start);
	
	this.draw = function(context){
		context.save();
		context.fillStyle = "rgb(220,220,220)";
		context.strokeStyle = "gray";
		context.lineWidth = 1;
		context.fillRect(Math.floor(this.leftEdge)+0.5, Math.floor(this.y)+0.5, this.width, this.height);
		context.strokeRect(Math.floor(this.leftEdge)+0.5, Math.floor(this.y)+0.5, this.width, this.height);
		
		context.fillStyle = "rgb(160,0,0)";
		var percentOver = (this.tab.actingValueIndex)/(this.tab.range/this.increment);
		var xSpot = this.leftEdge + this.width*percentOver;
		context.beginPath();
		context.arc(xSpot, this.y+this.height/2, this.height/2+2, 0, Math.PI*2, false);
		context.fill();
		
		this.tab.draw(context);
		context.restore();
	};
	
	this.hitDetect = function(x,y)
	{
		return (x > this.leftEdge && x < this.leftEdge + this.width && y > this.y && y < this.y + this.height);
	};
	
	this.onmousedown = this.ontouchstart = function(x,y)
	{
		this.tab.slide(x);
		this.requestRedraw();
	};

	this.onHasBeenAdded = function(listener, name)
	{
		listener.add(name+".tab", this.tab);
	};

	this.tick = function(){};

	return this;
};
torch.lib.SlideWheel.prototype = new torch.lib.baseTorchObject();

torch.lib.SlideWheelWindow = function(owner, start)
{
	this.width = owner.width/2;
	if(this.width < 70){this.width = 70;};
	this.height = 40;
	
	this.owner = owner;
	this.value = start;
	this.trueValueIndex = (this.value-this.owner.minValue)/(this.owner.increment);
	this.dragging = false;
	this.range = this.owner.maxValue - this.owner.minValue;
	this.unitDistance = this.range/this.owner.width;	//dollars per pixel
	this.x = this.owner.leftEdge + (this.value - this.owner.minValue)/this.unitDistance - this.width/2;
	this.y = this.owner.y-this.height-5;
	this.slideFlag = false;
	this.actingValueIndex = this.trueValueIndex;
	this.startCoord = 0;
	
	//try: sliding one width gives 10%
	var steps = this.range/this.owner.increment;
	this.distancePerStep = this.width/(steps*this.owner.singleSwipePercent);
	
	
	this.draw = function(context)
	{
		context.save();
		context.fillStyle = "white";
		context.strokeStyle = "black";
		context.lineWidth = 2;
		this.x = this.owner.leftEdge + (this.owner.width/2)-(this.width/2);
		
		context.fillRect(this.x, this.y, this.width, this.height);
		context.strokeRect(this.x, this.y, this.width, this.height);
		
		context.fillStyle = "black";
		context.font = "38px sans-serif";
		context.textAlign = "center";
		context.fillText(this.value, this.x+this.width/2, this.y+this.height-5);
		context.restore();
	};
	
	this.onmousedown = this.ontouchstart = function(x,y,e,context)
	{
		this.dragging = true;
		context.canvas.style.cursor = "pointer";
		this.startCoord = new torch.point2d(x,y);
		this.owner.requestRedraw();
	};
	
	this.onmouseup = this.ontouchend = function(x,y,e,context)
	{
		this.dragging = false;
		context.canvas.style.cursor = "default";
		this.actingValueIndex = this.trueValueIndex = Math.round(this.actingValueIndex);
		this.owner.requestRedraw();
	};
	
	this.onmouseout = this.ontouchout = function(x,y,e,context)
	{
		if(this.dragging){this.mouseup(x,y,e,context);}
	};
	
	this.onmousemove = this.ontouchmove = function(x,y,e,context)
	{
		if(this.dragging)
		{
			this.actingValueIndex = this.trueValueIndex + (x-this.startCoord.x)/(this.distancePerStep);
			if(this.actingValueIndex > this.range/this.owner.increment)
			{this.actingValueIndex = this.range/this.owner.increment;}
			if(this.actingValueIndex < 0)
			{this.actingValueIndex = 0;}
			var representativeTotal =Math.round(this.actingValueIndex)*this.owner.increment+this.owner.minValue;
			representativeTotal = Math.floor(representativeTotal/this.owner.increment);
			representativeTotal /= 1/this.owner.increment;	//because this makes sense.  Mostly, it seems to counter floating-point errors.
			if(this.value != representativeTotal)
			{this.updateValue(representativeTotal);}
			this.requestRedraw();
		}
	};
	
	this.slide = function(x)
	{
		//determine what dollar amount to be;
		var distanceOver = x-this.owner.leftEdge;
		this.value = Math.round((distanceOver * this.unitDistance)/this.owner.increment)*this.owner.increment+this.owner.minValue;
		
		//snap to nearest increment
		this.setValue(Math.round(this.value/this.owner.increment)*this.owner.increment);
		
		if(this.value > this.owner.maxValue){this.value = this.owner.maxValue;}
		if(this.value < this.owner.minValue){this.value = this.owner.minValue;}
		
		//this.x = this.value*this.unitDistance + this.owner.leftEdge;
		
		this.slideFlag = true;
	};
	
	this.hitDetect = function(x,y)
	{
		var leftSide = this.x;
		var rightSide = this.x+this.width;
		var topSide = this.y;
		var bottomSide = this.y+this.height;
		
		return ( x < rightSide && x > leftSide && y < bottomSide && y > topSide);
	};
	
	this.setValue = function(x)
	{
		this.updateValue(x);
		this.trueValueIndex = (this.value-this.owner.minValue)/(this.owner.increment);
		this.actingValueIndex = this.trueValueIndex;
	};
	
	this.updateValue = function(x)
	{
		this.value = x;
		this.slideFlag = true;
	};
	
	this.getValue = function()
	{
		return this.value;
	};
	
	this.focus = function()
	{this.giveCanvasFocus();};
	
	this.blur = function()
	{this.clearCanvasFocus();};
	
	this.tick = function(){};
	
	return this;
};
torch.lib.SlideWheelWindow.prototype = new torch.lib.baseTorchObject();torch.lib.glideChart = function(startIndex, endIndex, lowValue, highValue, originX, originY, width, height)
{
	this.count = 0;
	this.startIndex = startIndex;
	this.endIndex = endIndex;
	this.lowValue = lowValue;
	this.highValue = highValue;
	this.originX = originX;
	this.originY = originY;
	this.width = width;
	this.height = height;
	
	this.glidePaths = [];
	this.currentValues = [];
		
	this.addGlidePath = function(data, name, color)
	{
		this.glidePaths.push(new torch.lib.glidePath(data, name, this, color));
		this.count++;
	};
	
	this.draw = function(context)
	{
		for(var i=startIndex; i<=endIndex; i++)
		{this.currentValues[i] = 0;}
		//context.fillRect(originX, originY, width, 0-height);
		for(var i=this.count-1; i>=0; i--)
		{
			this.glidePaths[i].draw(context);
		}
	};
	
	this.hitDetect = function(x,y)
	{
		return (x > originX && x < originX+this.width &&
				y < originY && y > originY-this.height);
	};
	
	this.focus = function()
	{this.giveCanvasFocus();};
	
	this.blur = function()
	{this.clearCanvasFocus();};
};
torch.lib.glideChart.prototype = new torch.lib.baseTorchObject();

torch.lib.glidePath = function(data, name, owner, color)
{
	this.data = data;				//array of values to display, mapped to appropiate index
	this.name = name;
	this.owner = owner;
	this.color = color;

	this.draw = function(context)
	{
		context.save();
		
		context.fillStyle = this.color;
		
		context.beginPath();
		context.moveTo(this.owner.originX, this.owner.originY);
		
		var xPos;
		var yPos;
		var widthPerIndex = this.owner.width/(this.owner.endIndex - this.owner.startIndex);
		var heightPerUnit = this.owner.height/(this.owner.highValue - this.owner.lowValue);
		
		for(var i=this.owner.startIndex; i<=this.owner.endIndex; i++)
		{
			xPos = this.owner.originX+widthPerIndex*(i-this.owner.startIndex);
			yPos = this.owner.originY-heightPerUnit*(this.owner.highValue - this.owner.currentValues[i]);
			this.owner.currentValues[i] += this.data[i];
			context.lineTo(xPos, yPos);
		}
		
		context.lineTo(this.owner.originX+this.owner.width, this.owner.originY);
		context.lineTo(this.owner.originX, this.owner.originY);
		context.fill();
		context.restore();
	};
	
	this.focus = function()
	{this.giveCanvasFocus();};
	
	this.blur = function()
	{this.clearCanvasFocus();};
};
torch.lib.glidePath.prototype = new torch.lib.baseTorchObject();


/**
 * slices: Array()
 * slices[x]: object
 * {
 * 		label: String
 * 		value: float
 * 		color: CSS color string
 * }
 * 
 * center: point2d()
 * 
 * radius: float
 * 
 */
torch.lib.pieChart = function(slices, center, radius)
{	
	this.slices = slices;
	this.center = center;
	this.hovering = false;
	
	var total = 0;
	for(var i=0; i<slices.length; i++)
	{
		total += slices[i].value;
	}
	this.totalPercent = total;
	
	this.count = slices.length;

	this.radius = radius;
	
	this.draw = function(context)
	{
		var currentAngle = -Math.PI*1/2;	//in radians; starting at top, NOT right edge; going CLOCKWISE, not counter
		var x=this.center.x;
		var y=this.center.y;
		
		context.save();
		
		for(var i=0; i<this.count; i++)
		{
			var myPercentage = this.slices[i].value/this.totalPercent;
			var myAngle = 2*Math.PI*(myPercentage);
			context.fillStyle = this.slices[i].color;
			context.beginPath();
			context.moveTo(x,y);
			context.arc(x,y, this.radius, currentAngle, currentAngle+myAngle, false);
			context.lineTo(x,y);
			context.fill();
			currentAngle += myAngle;
		}
		
		context.restore();
	};

	this.hitDetect = function(x,y)
	{
		//simple distance formula
		return ( Math.sqrt(Math.pow(x-this.x, 2) + Math.pow(y-this.y, 2)) < this.radius );
	};
};
torch.lib.pieChart.prototype = new torch.lib.baseTorchObject();

//It is assumed the line graph has complete consecutive data starting with the value of origin on the x-axis.
torch.lib.lineGraph = function(values, color, lineWidth, xGraphStart, yGraphStart, yValueStart, pixelsPerX, pixelsPerY)
{
	this.values = values;
	this.color = color;
	this.lineWidth = lineWidth;
	this.xGraphStart = xGraphStart;
	this.yGraphStart = yGraphStart;
	this.yValueStart = yValueStart;
	this.pixelsPerX = pixelsPerX;
	this.pixelsPerY = pixelsPerY;
	
	this.draw = function(context)
	{
		context.save();
		context.lineWidth = this.lineWidth;
		context.miterLimit = 1;	//just like rounding
		context.strokeStyle = this.color;
		context.beginPath();
		
		var xCoord;
		var yCoord;
		for(var i=0; i<this.values.length; i++)
		{
			xCoord = this.xGraphStart + i*this.pixelsPerX;
			yCoord = this.yGraphStart - (this.values[i]-this.yValueStart)*this.pixelsPerY;
			context.lineTo(xCoord, yCoord);
		}
		
		context.stroke();
		context.restore();
	};
	
	this.hitDetect = function(x,y)
	{
		//figure out index that would be near x
		var index = Math.round((x-this.xGraphStart)/this.pixelsPerX);
		//figure out how many pixels away from value in y direction
		var yDistance = y-Math.round(this.yGraphStart-(this.values[index]-this.yValueStart)*this.pixelsPerY);
		
		return Math.abs(yDistance) < 15;
	};
};
torch.lib.lineGraph.prototype = new torch.lib.baseTorchObject();/**
*	lol.
*	Can you guess why there are so few 3d objects?
*/

torch.lib.circle3d = function(radius, center, fill, stroke, strokeWidth)
{
	this.radius = radius;
	this.center = center;
	this.fill = fill;
	this.stroke = stroke;
	this.strokeWidth = strokeWidth;
	
	this.projectedCenter = 0;
	this.pixelRadius = 0;
	
	this.draw= function(context)
	{
		//gives point 1 radius distance away from center
		var radiusEnd = new torch.point3d(this.center.x + this.radius, this.center.y, this.center.z);
		var projectedRadiusEnd = context.project(radiusEnd);
		this.projectedCenter = context.project(this.center);
		this.pixelRadius = projectedRadiusEnd.x - this.projectedCenter.x;
		
		context.fillStyle = this.fill;
		context.strokeStyle = this.stroke;
		context.lineWidth = this.strokeWidth;
		
		context.beginPath();
		context.arc(this.projectedCenter.x, this.projectedCenter.y, this.pixelRadius,
					0, 2*Math.PI, true);
		context.fill();
		
		context.beginPath();
		context.arc(this.projectedCenter.x, this.projectedCenter.y, this.pixelRadius,
					0, 2*Math.PI, true);
		context.stroke();
	};
	
	this.hitDetect = function(x,y)
	{
		return ( Math.sqrt(Math.pow(x-this.projectedCenter.x, 2) + Math.pow(y-this.projectedCenter.y, 2)) < this.pixelRadius + this.strokeWidth/2);
	};
};
torch.lib.circle3d.prototype = new torch.lib.baseTorchObject();

/*
*	A 3D texture that can rotate around the upAxis (for now, assumed to always be the y-axis)
*	Draws faster than canvas' drawImage() at the cost of quality loss when enlarging small images.
*
*	Occasionally still produces a small flicker when drawing, must be improved.
*/
torch.lib.canvasTexture = function(upperLeft, lowerRight, sourceURL, alpha, upAxis)
{
	this.point1 = upperLeft;
	this.point2 = lowerRight;
	this.image = new Image();
	if(sourceURL != undefined && sourceURL.length > 0){this.image.src = sourceURL;}
	this.width = this.image.width;
	this.height = this.image.height;
	this.alpha = alpha;
	
	//for hit detection
	this.projectedTopLeft = null;
	this.projectedTopRight = null;
	this.projectedBottomLeft = null;
	this.projectedBottomRight = null;
	
	//4 seems to be the best number for performance and quality
	//Feel free to try others
	this.pixelsPerSlice = 4;
	
	//Use upAxis if given, otherwise use vector (0,1,0)
	(upAxis != null) ? this.upAxis = upAxis : this.upAxis = new torch.point3d(0,1,0);
	
	this.draw = function(context)
	{
		//drawing will be weird without this due to rounding in the aliasing...
		//Please feel free to improve this terrible hack.
		var roundingNudge = 1;
		

		
		this.projectedTopLeft = context.project(this.point1);
		this.projectedBottomRight = context.project(this.point2);
		
		//for hit detection
		var topRight = new torch.point3d(this.point2.x, this.point1.y, this.point2.z);
		var bottomLeft = new torch.point3d(this.point1.x, this.point2.y, this.point1.z);
		this.projectedTopRight = context.project(topRight);
		this.projectedBottomLeft = context.project(bottomLeft);
		
		//Always face the camera, never paint backwards.
		if(this.projectedTopLeft.x > this.projectedTopRight.x)
		{
			var temp = this.projectedTopLeft;
			this.projectedTopLeft = this.projectedTopRight;
			this.projectedTopRight = temp;
			
			temp = this.projectedTopLeft;
			this.projectedTopLeft = this.projectedTopRight;
			this.projectedTopRight = temp;
			
			temp = this.point1;
			this.point1 = this.point2;
			this.point2 = temp;
		}
		
		//back to drawing
		var xStep = (this.point2.x - this.point1.x)/this.image.width;
		var zStep = (this.point2.z - this.point1.z)/this.image.width;

		//Grabbing "slices" of the original image, projecting them
		//into the canvas, and drawing them all side by side.
		for(var column=0; column<this.image.width; column+=this.pixelsPerSlice)
		{
			var topPoint = new torch.point3d(column*xStep + this.point1.x, this.point1.y, column*zStep + this.point1.z);
			var projTop = context.project(topPoint);
			
			var bottomPoint = new torch.point3d(column*xStep + this.point1.x, this.point2.y, column*zStep + this.point1.z);
			var projBottom = context.project(bottomPoint);
			
			//This isn't supposed to always be 2.  It's supposed to figure itself out dynamically,
			//based on the number of slices and pixels per slice.
			var displaySliceWidth = 2;
			prevPoint = projTop;
			
			var displaySliceHeight = projBottom.y - projTop.y;
	
			var grabbed = this.pixelsPerSlice;
			if(this.image.width-column < this.pixelsPerSlice){grabbed = this.image.width-column;}
			
			
			//determine rounding nudge
			
			var nextX = context.project(new torch.point3d((column+this.pixelsPerSlice)*xStep + this.point1.x, this.point1.y, (column+this.pixelsPerSlice)*zStep + this.point1.z));
			roundingNudge = Math.round(nextX.x)-Math.round(projTop.x)-displaySliceWidth;
			context.drawImage(this.image, column, 0, grabbed, this.image.height,
										  projTop.x, projTop.y, displaySliceWidth+roundingNudge, displaySliceHeight);
		}
	};
	
	this.hitDetect = function(x,y,context)
	{
		var xHit = false;
		var yHit = false;
		
		var top1 = context.project(this.point1);
		var bottom2 = context.project(this.point2);
		var top2 = context.project(new torch.point3d(this.point2.x, this.point1.y, this.point2.z));
		var bottom1 = context.project(new torch.point3d(this.point1.x, this.point2.y, this.point1.z));
		
		//crappy... for now.
		//Assume up axis is y-axis for simple x check
		if(x < top1.x)
		{if(x > top2.x)
			{xHit = true;}
		}
		else{
			if(x < top2.x)
			{xHit = true;}
		}
		
		var sideOfTopLine = (top2.x - top1.x)*(y-top1.y)-(top2.y-top1.y)*(x-top1.x);
		var belowTopLine = (top2.x - top1.x)*(bottom1.y-top1.y)-(top2.y-top1.y)*(x-top1.x);
		
		var sideOfBottomLine = (bottom2.x - bottom1.x)*(y-bottom1.y)-(bottom2.y-bottom1.y)*(x-bottom1.x);
		var aboveBottomLine = (bottom2.x - bottom1.x)*(top1.y-bottom1.y)-(bottom2.y-bottom1.y)*(x-bottom1.x);
		
		if(torch.isNegative(sideOfTopLine) == torch.isNegative(belowTopLine) && torch.isNegative(sideOfBottomLine) == torch.isNegative(aboveBottomLine))
		{yHit = true;}
		
		return xHit && yHit;
	};
	
	this.focus = function()
	{this.giveCanvasFocus();};
	
	this.blur = function()
	{this.clearCanvasFocus();};
};
torch.lib.canvasTexture.prototype = new torch.lib.baseTorchObject();