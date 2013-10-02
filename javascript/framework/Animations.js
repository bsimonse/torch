
torch.anim = new Object();

//These need better names.
//Enums for bounce.
torch.anim.stop = 0;
torch.anim.bounce = 1;
torch.anim.loop = 2;

//bounce needs a better name too.  Will change.
torch.anim.LinearAnimation = function(min, max, frames, bounce, startValue, startDirection, easeForward, easeBackward)
{
	this.min = min || 0;
	this.max = max || 1;
	this.dif = this.max - this.min;
	this.start = startValue || this.min;
	this.maxFrame = frames-1 || 0;
	this.bounce = bounce || torch.anim.stop;
	this.direction = startDirection || 1;
	this.easeForward = easeForward || new torch.anim.noEase();
	this.easeBackward = easeBackward || (this.easeForward || new torch.anim.noEase());
	this.done = false;
	
	this.frame = Math.round(((this.start-this.min)/this.dif)*this.maxFrame);
	this.currVal = this.start;
	
	this.tick = function()
	{
		if(this.done){return;}
		
		if(this.bounce == torch.anim.bounce)
		{
			if(this.frame >= this.maxFrame && this.direction > 0)
			{this.direction*=-1;}
			else if(this.frame <= 0 && this.direction < 0)
			{this.direction*=-1;}
		}
		else if(this.bounce == torch.anim.loop)
		{
			if(this.frame >= this.maxFrame && this.direction == 1)
			{this.frame = -1;}
			else if(this.frame <= 0 && this.direction == -1)
			{this.frame = this.maxFrame+1;}
		}
		else if(this.bounce == torch.anim.stop)
		{
			if(this.frame >= this.maxFrame && this.direction == 1)
			{this.done = true; return;}
			else if(this.frame <= 0 && this.direction == -1)
			{this.done = true; return;}
		}
		
		if(this.direction > 0)
		{this.currVal = this.easeForward.get(this.min, this.dif, this.frame/this.maxFrame);}
		else
		{this.currVal = this.easeBackward.get(this.max, -this.dif, 1-(this.frame/this.maxFrame));}
		
		this.frame += 1*this.direction;
	};
	
	this.get = function()
	{
		return this.currVal;
	};
};

/********************
 * Easing Templates *
 ********************/

torch.anim.noEase = function()
{
	this.get = function(min, dif, t)
	{
		return min+dif*t;
	};
};

torch.anim.easeIn = function()
{
	return new torch.anim.easeBezier(new torch.point2d(0.2, 0.8), new torch.point2d(0.5, 0.9));
};

torch.anim.easeOut = function()
{
	return new torch.anim.easeBezier(new torch.point2d(0.8, 0.2), new torch.point2d(0.9, 0.5));
};

//Haha, magic!
//parameters are xE[0,1] (the t parameter)
//bezier control point 1 (bound in the [0,0],[1,1] square)
//bezier control point 2 (also bound)
torch.anim.easeBezier = function(p1, p2)
{
	this.p1 = p1;
	this.p2 = p2;

	this.get = function(min, dif, x)
	{
		var a = this.doBez(x, this.t, this.b, this.s);
		var m = min+dif*a;
		return m;
	};
	
	//Haha!  Awesome math time!
	//Math answer: this is an iterative approximation method on the explicit definition of a Bezier curve,
	//				taking at most 11 iterations to be at 99.9% accuracy.
	//Human answer: Starting at 1/2, this method keeps evaluating what the x value of the curve
	//				at the determined point in time is.  If it's bigger than the desired time, it removes
	//				half of itself and tries again; if it's smaller than expected, it adds half itself
	//				and tries again, until it gets within 99.9% accuracy of the time we were looking
	//				for.  Then it evaluates what the y value is at that point in time and returns it.
	this.doBez = function(x, t, b, s)
	{
		var h,z;
		var t = 0.5;	//starting value... don't modify!
		var b = 0.0005;	//accuracy value... can modify either up or down as desired.
		var s = t/2;
		
		//explicit definition of Bezier curve.
		//Parameters are NOT points, but single values.
		//Run twice to get a point.
		//Done for efficiency, as results will probably be discarded.
		this.bez = function(p1,p2)
		{
			h=1-t;
			return 3*h*h*t*p1+3*t*t*h*p2+t*t*t;
		};
		
		//Iterative method
		while(s>b)
		{
			z=this.bez(p1.x,p2.x);
//if(Math.abs(z-x) < b){return this.bez(p1.y,p2.y);}else{z>x?t-=s:t+=s;s/=2;}
			if(Math.abs(z-x) < b){return this.bez(p1.y,p2.y);}else if(z > x){t-=s;s/=2;}else if(z < x){t+=s;s/=2;}
		}
		
		return this.bez(p1.y,p2.y);
	};
};
