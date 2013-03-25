torch.lib.glideChart = function(startIndex, endIndex, lowValue, highValue, originX, originY, width, height)
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
torch.lib.lineGraph.prototype = new torch.lib.baseTorchObject();