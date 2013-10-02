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

torch.lib.shape = function(fillStyle)
{
	this.points = [];
	this.fill = fillStyle || "";
	
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
		context.fillStyle = this.fill;
		context.beginPath();
		point = this.points[0];
		context.moveTo(point.x, point.y);
		
		for(var i=1; i<this.points.length; i++)
		{
			point = this.points[i];
			context.lineTo(point.x, point.y);
		}

		point = this.points[0];
		context.lineTo(point.x, point.y);
		context.fill();
		context.restore();
	};
};
torch.lib.shape.prototype = new torch.lib.baseTorchObject();

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

torch.lib.rectangle = function(x,y,width,height, fill, strokeWidth, stroke)
{
	this.x = x;
	this.y = y;
	this.width=width;
	this.height=height;
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
		context.moveTo(this.x, this.y);
		context.lineTo(this.x+this.width, this.y);
		context.lineTo(this.x+this.width, this.y+this.height);
		context.lineTo(this.x, this.y+this.height);
		context.lineTo(this.x, this.y);
		context.lineTo(this.x+this.width, this.y);	//for the mitering
		context.fill();
		
		if(this.strokeWidth > 0)
		{
			context.beginPath();
			context.moveTo(this.x, this.y);
			context.lineTo(this.x+this.width, this.y);
			context.lineTo(this.x+this.width, this.y+this.height);
			context.lineTo(this.x, this.y+this.height);
			context.lineTo(this.x, this.y);
			context.lineTo(this.x+this.width, this.y);
			context.stroke();
		}
		context.restore();
	};
	
	this.hitDetect = function(x,y)
	{
		var strokeAdjust = this.strokeWidth/2;
		
		var t = torch.util;
		return (t.isNegative(x - (this.x-strokeAdjust)) == t.isNegative((this.x+this.width+strokeAdjust) - x) && 
				t.isNegative(y - (this.y-strokeAdjust)) == t.isNegative((this.y+this.height+strokeAdjust) - y));
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
				line = word+" ";
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
torch.lib.dashedLine.prototype = new torch.lib.baseTorchObject();