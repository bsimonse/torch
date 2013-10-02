/*
During events, the parameters that the object receives are thus:

 - The x and y coordinates, given IN THE CONTEXT OF THE RECEIVER.
If you think you are a square drawn from (0,0) to (20,20), then
all clicks in your center will come back as (10,10), regardless of
how your parent Group is drawn.

 - The event itself, if you need more details about the event.

 - The context of the canvas that triggered the event.  The context's
current transformation matrix is THE ABSOLUTE transformation matrix
for the receiver.  This means if you draw a line from (20,0) to (0,20),
it will always cross the diagonal of the square if drawn in the passed
context.  The context's inverse transformation can also be applied
to give the absolute position, although this position probably should not
be used inside the method as the given context is likely to have been
transformed.  The absolute position can be given to another object,
however, and in that object's methods you can apply the current transformation
to the held points, giving you a way to get a single point's position
in multiple Groups.

NOTE:
When using this method to translate across multiple canvases (like if
you had multiple layers), it is assumed that the canvases have the same
position and CSS styling.  If one canvas is translated 100 to the right while
another is not, then all positions based between them using this method
will be off by 100. 

This method is NOT called automatically anywhere in the framework.  It is each 
controller's responsibility to call this as needed to translate between
two canvases.

@point: 	a point2d to transform.
@context1:	the context the point comes from.
@context2:	the context to translate the point to.
@returns:	a new point2d containing the transformed point.
			The original point as drawn in context1
			and the returned point as drawn in context2
			should be the same pixel on screen.
*/
torch.transformAcrossColocatedContexts = function(point, context1, context2)
{
	var m = context2.currentTransform.inverse();
	var x = point.x;
	var y = point.y;
	var baseX = m.a*x+m.c*y+m.e;
	var baseY = m.b*x+m.d*y+m.f;
	
	x = baseX;
	y = baseY;
	m = context1.currentTransform;
	var finalX = m.a*x+m.c*y+m.e;
	var finalY = m.b*x+m.d*y+m.f;
	
	return new torch.point2d(finalX, finalY);
};

torch.getNewSVGMatrix = function()
{
	//temporary, for testing.
	return new torch.helperMethods.SVGMatrix();
	
	try
	{
		var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		return svg.getCTM();
	}
	catch(err)
	{
		return new torch.helperMethods.SVGMatrix();
	}
};

/**
 * Since not all devices support it, here's an implementation
 * for those old devices.
 */
torch.helperMethods.SVGMatrix = function()
{
	this.a = 1;
	this.b = 0;
	this.c = 0;
	this.d = 1;
	this.e = 0;
	this.f = 0;
	
	this.multiply = function(f)
	{
		var t = this;
		var o = torch.getNewSVGMatrix();
		
		o.a = f.a*t.a+f.b*t.c;
		o.b = f.a*t.b+f.b*t.d;
		o.c = f.c*t.a+f.d*t.c;
		o.d = f.c*t.b+f.d*t.d;
		o.e = f.e*t.a+f.f*t.c+t.e;
		o.f = f.e*t.b+f.f*t.d+t.f;
		
		t.a=o.a;t.b=o.b;t.c=o.c;t.d=o.d;t.e=o.e;t.f=o.f;
		return t;
	};
	
	this.inverse = function()
	{
		var t = this;
		var o = torch.getNewSVGMatrix();
		
		var det = t.a*t.d-t.b*t.c;
		
		o.a = t.d/det;
		o.b = (-t.b)/det;
		o.c = (-t.c)/det;
		o.d = t.a/det;
		o.e = (t.c*t.f-t.e*t.d)/det;
		o.f = (t.b*t.e-t.a*t.f)/det;

		return o;

		//t.a=o.a;t.b=o.b;t.c=o.c;t.d=o.d;t.e=o.e;t.f=o.f;
		//return t;
	};
	
	this.translate = function(x, y)
	{
		var t = this;
		t.e = t.a*x+t.c*y+t.e;
		t.f = t.b*x+t.d*y+t.f;
		return t;
	};
	
	this.scale = function(s)
	{
		return this.scaleNonUniform(s,s);
	};
	
	this.scaleNonUniform = function(x, y)
	{
		var t = this;
		t.a*=x;t.b*=x;t.c*=y;t.d*=y;
		return t;
	};
	
	//Theta is in degrees; note that context's API is in radians!
	this.rotate = function(theta)
	{
		var t = this;
		var o = torch.getNewSVGMatrix();
		var c = Math.cos(theta*Math.PI/180);
		var s = Math.sin(theta*Math.PI/180);
		
		o.a = t.a*c+t.c*s;
		o.b = t.b*c+t.d*s;
		o.c = t.c*c-t.a*s;
		o.d = t.d*c-t.b*s;
		
		t.a=o.a;t.b=o.b;t.c=o.c;t.d=o.d;
		return t;
	};
	
	this.rotateFromVector = function(x, y)
	{
		var rads = Math.atan2(y,x);
		return this.rotate(rads*180/Math.PI);
	};
	
	this.flipX = function()
	{return this.multiply(-1, 0, 0, 1, 0, 0);};
	
	this.flipY = function()
	{return this.multiply(1, 0, 0, -1, 0, 0);};
	
	this.skewX = function(angle)
	{
		//unsure how to implement
		return this;
	};
	
	this.skewY = function(angle)
	{
		//unsure how to implement
		return this;
	};
};

/**
 * Gives the passed object "smart" CTM transform methods
 * that can remember their state.  Overrides and saves
 * old methods if they existed.
 * 
 * HTML5 Spec is set to make this method obsolete for contexts, which is good.
 * It will be added only to groups.
 * 
 * Note that this API will always match the context API, even though it
 * uses an SVGMatrix to store its CTM.
 */
torch.giveSmartCTM = function(c)
{
	//do not set up twice.
	if(c.currentTransform != null){return;}
	
	//save old methods
	if(c.translate != null){c.nativeTranslate = c.translate;}
	if(c.scale != null){c.nativeScale = c.scale;}
	if(c.rotate != null){c.nativeRotate = c.rotate;}
	if(c.transform != null){c.nativeTransform = c.transform;}
	if(c.setTransform != null){c.nativeSetTransform = c.setTransform;}
	if(c.save != null){c.nativeSave = c.save;}
	if(c.restore != null){c.nativeRestore = c.restore;}
	if(c.resetTransform != null){c.nativeResetTransform = c.resetTransform;}
	
	c.currentTransform = torch.getNewSVGMatrix();
	c.currentTransformStack = [];
	
	c.translate = function(x,y)
	{
		this.currentTransform = this.currentTransform.translate(x,y);
		if(this.nativeTranslate != null){this.nativeTranslate(x,y);}
	};
	
	c.scale = function(x,y)
	{
		this.currentTransform = this.currentTransform.scaleNonUniform(x,y);
		if(this.nativeScale != null){this.nativeScale(x,y);}
	};
	
	c.rotate = function(theta)
	{
		this.currentTransform = this.currentTransform.rotate(theta*180/Math.PI);
		if(this.nativeRotate != null){this.nativeRotate(theta);}
	};
	
	c.transform = function(a, b, c, d, e, f)
	{
		var o = torch.getNewSVGMatrix();
		o.a=a;o.b=b;o.c=c;o.d=d;o.e=e;o.f=f;
		this.currentTransform = this.currentTransform.multiply(o);
		if(this.nativeTransform != null){this.nativeTransform(a, b, c, d, e, f);}
	};
	
	c.setTranslate = function(x,y)
	{
		var t = this.currentTransform;
		t.e = x;
		t.f = y;
	};

	c.setTransform = function(a, b, c, d, e, f)
	{
		//reset and transform
		this.currentTransform = torch.getNewSVGMatrix();
		this.transform(a,b,c,d,e,f);
		if(this.nativeSetTransform != null){this.nativeSetTransform(a, b, c, d, e, f);}
	};
	
	c.save = function()
	{
		var t = this.currentTransform;
		var o = torch.getNewSVGMatrix();
		o.a=t.a;o.b=t.b;o.c=t.c;o.d=t.d;o.e=t.e;o.f=t.f;
		this.currentTransformStack.push(o);
		if(this.nativeSave != null){this.nativeSave();}
	};
	
	c.restore = function()
	{
		var t = this.currentTransform;
		if(this.currentTransformStack.length > 0)
		{
			var o = this.currentTransformStack.pop();
			t.a=o.a;t.b=o.b;t.c=o.c;t.d=o.d;t.e=o.e;t.f=o.f;
		}
		else
		{this.resetTransform();}
		
		if(this.nativeRestore != null){this.nativeRestore();}
	};
	
	c.resetTransform = function()
	{
		this.currentTransform = torch.getNewSVGMatrix();
		if(this.nativeResetTransform != null){this.nativeResetTransform();}
	};
	
	//Note you can access the currentTransform directly
};