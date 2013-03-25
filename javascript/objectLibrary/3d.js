/**
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