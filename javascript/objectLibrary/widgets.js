torch.lib.Slider = function(x, y, width, minValue, maxValue, increment, start)
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
torch.lib.SlideWheelWindow.prototype = new torch.lib.baseTorchObject();