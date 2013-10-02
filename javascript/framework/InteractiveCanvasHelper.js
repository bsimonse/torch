/**!
 * torch.js
 * Version 2.0
 * 03/14/12
 * 
 * -Framework is moving away from ad-hoc development style and more
 * 	towards industry standards.  Syntactical and design improvements
 * 	are welcome.
 */

/**
 * InteractiveCanvasHelper.js
 *
 * A set of helper methods for a canvas object that allow
 * for easier interactivity with dynamically drawn objects.
 * Also can set up a context for 3-D drawing.
 *
 * To setup a canvas for interaction, call the setupInteractiveCanvas method
 * passing the intended canvas as the parameter.
 * 
 * To setup a context for 3-D drawing, call the setup3DContext method
 * passing the context as the parameter.
 */

/**
 * Notes about use:
 *	-------------------
 *	In many Flash files, elements drawn on the page have their own set of
 *	interactions, like mouseover, click, etc.  Native Javascript does not
 *	provide such interactions for elements drawn on a canvas, instead treating
 *	the canvas as a single HTML DOM object.
 *
 *	This file attempts to provide interactivity with elements drawn on a canvas.
 *	Elements that want interactivity must be added to a canvas using the canvas's add()
 *	method.  The canvas will then delegate events to that object whenever the canvas
 *	receives an event, allowing objects to perform their own mouseover or click events.
 *	The canvas delegation methods also perform their own evaluations to determine what
 *	event has occurred from the view of the held objects (for example, what the canvas
 *	thinks is a mousemove event may be a mouseout event to a drawn object.)
 *
 *	To set up interactivity, first use setupInteractiveCanvas() to prepare the canvas for
 *	delegation.  Then use the canvas' add() method to add each object to the canvas.
 *	Added objects need a hitDetect(localX, localY) method that returns true if the passed
 *	coordinates are within the drawn object and false otherwise.  Then, added objects
 *	can supply their own methods for each of the events that will be called when
 *	appropriate, e.g. obj.mouseover will be called when the mouse first moves over
 *	that object.  See below for a list of currently supported standard and custom events.
 */
 
 
/**
 * Setup the canvas event listeners to delegate to drawn objects
 * when clicked.
 *
 * If the canvas is desired to perform additional actions besides
 * event delegation, put those actions in a method called
 * canvas<Event>(), where <Event> is the triggering event
 * (e.g., canvasClick, canvasMouseOver).
 *
 * The additional actions are performed after delegation.
 *
 * NEW:
 * This method provides a getTransform() to the context of
 * the passed canvas.  NOTE THAT IT WILL RESET any transformation
 * back to the identity matrix when setupInteractiveCanvas is called.
 */

//Bind!
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

//Global object; makes "torch" a reserved variable (well... "reserved" in the sense that you shouldn't overwrite it.)
var torch = {};
torch.helperMethods = {};
torch.util = {};
torch.lib = {};

torch.util.isNegative = function(a){return a<0;};

torch.font = function(fontSize, fontColor, fontFace, fontStyle)
{
	this.fontSize = fontSize || 10;
	this.fontColor = fontColor || "black";
	this.fontFace = fontFace || "sans-serif";
	this.fontStyle = fontStyle || "";

	this.makeString = function()
	{
		return this.fontStyle+" "+this.fontSize+"px "+this.fontFace;
	};
};

torch.lib.baseTorchObject = function()
{
	var proto = Object.getPrototypeOf(this);
	//proto = this.__proto__;
	
	proto.boundAnimations = [];
	
	proto.draw = function(context)
	{
		//base class draws nothing
	};
	
	proto.hitDetect = function(x,y)
	{
		//base class can't be hit
		return false;
	};
	
	proto.tick = function()
	{
		this.tickAnimations();
	};
	
	proto.tickAnimations = function()
	{
		for(var i=0; i<this.boundAnimations.length; i++)
		{
			var binding = this.boundAnimations[i];
			var anim = binding.anim;
			if(!anim.done)
			{
				var animResult = anim.get();
				if(binding.transMethod != null)
				{animResult = binding.transMethod(animResult);}
				
				this[binding.variable] = animResult;
				
				anim.tick();
			}
		}
	};
	
	proto.bindAnimationToVar = function(animation, varString, translateMethod)
	{
		this.boundAnimations.push({anim:animation, variable:varString, transMethod:translateMethod});
	};
	
	proto.focus = function()
	{this.hasCanvasFocus = true;};
	
	proto.blur = function()
	{this.hasCanvasFocus = false;};
};

new function(){
	//haha private variables!  Cheating rules!
	var func = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	func = func || function(callback){window.setTimeout(callback,1);}
	torch.requestAnimationFrame = function(callback)
	{
		func(callback);
	}
}();

torch.setupInteractiveCanvas = function(canvas)
{
	if(canvas==undefined || canvas.getContext==undefined){return false;}
	
	var t = torch;
	var h = torch.helperMethods;
	
	t.setupAsObjectListener(canvas);
	
	//remove focus ring; I'm making all sorts of assumptions with this, so it
	//should be looked at again.
	canvas.style.outline = "0";
	
	canvas.redrawNeeded = true;
	canvas.tabIndex = "444";	//chosen arbitrarily; just needed to allow keyboard focus to canvas. You can overwrite it.
	
	canvas.pixelDensity = 1;
	
	//"private" variables
	canvas.mousePressPos = new torch.point2d(-1,-1);
	canvas.lastMousePos = new torch.point2d(-1,-1);
	canvas.canClick = false;
	
	canvas.touchMap = new torch.Map();
	
	canvas.clickPixelThreshold = 3;
	canvas.focusActive = false;
	canvas.ignoreLegacyEvents = false;

	/**
	 * Delegate the following events to added objects: 
	 *
	 *	Standard event method calls:
	 *	onclick
	 *	ondblclick
	 *	onmousedown
	 *	onmouseup
	 *	onmouseover
	 *	onmouseout
	 *	onmousemove
	 *	ontouchstart
	 *	ontouchmove
	 *	ontouchend
	 *	onkeydown
	 *	onkeyup
	 *	onkeypress
	 *
	 *	Custom events (called only on objects,  not the canvas):
	 *	onrightclick (called in place of click, not alongside)
	 *	ontap (like click for touch devices, more precise than click)
	 *	ontouchover (like mouseover for touch devices)
	 *	ontouchout (like mouseout for touch devices)
	 */
	h.createEventMethod(canvas, "click");
	h.createEventMethod(canvas, "dblclick");
	h.createEventMethod(canvas, "mousedown");
	h.createEventMethod(canvas, "mouseup");
	h.createEventMethod(canvas, "mouseover");
	h.createEventMethod(canvas, "mouseout");
	h.createEventMethod(canvas, "mousemove");
	h.createEventMethod(canvas, "touchstart");
	h.createEventMethod(canvas, "touchmove");
	h.createEventMethod(canvas, "touchend");
	h.createEventMethod(canvas, "touchcancel");
	h.createEventMethod(canvas, "keydown");
	h.createEventMethod(canvas, "keyup");
	h.createEventMethod(canvas, "keypress");
	
	canvas.onfocus = function(e) {
		this.focusActive = true;
	};
	
	canvas.onblur = function(e) {
		this.focusActive = false;
		//blur all objects in this canvas; they can't have focus since the canvas doesn't.
		for(var i=0; i<this.length(); i++)
		{
			var target = this.getByIndex(i);
			if(target.hasCanvasFocus && target.blur != null){target.blur();}
		}
		
		if(this.canvasBlur != null){this.canvasBlur(e);}
	};
	
	/**
	 * the event generated when the canvas is drawn.
	 */
	canvas.oncanvasdrawn = function()
	{
		this.redrawNeeded = false;
		var e = {};
		e.type = "ondrawn";
		
		//last mouse
		if(this.lastMousePos.x >= 0 && this.lastMousePos.y >= 0)
		{torch.helperMethods.canvasMouseDelegator(this.lastMousePos.x, this.lastMousePos.y, e, this);}
		
		//last touches
		for(var i=0; i<this.touchMap.length(); i++)
		{
			touch = this.touchMap.getByIndex(i);
			//hackey adjustment.  Please fix.
			var localPoint = torch.globalToLocal(touch.pageX-window.scrollX, touch.pageY-window.scrollY, this);
			//apply context inverse
			var m = this.getContext("2d").currentTransform.inverse();
			var newX = m.a*localPoint.x+m.c*localPoint.y+m.e;
			var newY = m.b*localPoint.x+m.d*localPoint.y+m.f;
			torch.helperMethods.canvasTouchDelegator(newX, newY, e, touch, this);
		}
	};
	
	canvas.requestRedraw = function()
	{this.redrawNeeded = true;};
	
	//allow context to remember its transformation matrix
	var context = canvas.getContext("2d");
	t.giveSmartCTM(context);
	
	//setup complete!
	return true;
};

torch.suppressNativeTouchEvents= function(canvas)
{
	canvas.onselectstart = function(){return false;}
	canvas.oncanvastouchstart = function(e){e.preventDefault();}
}
torch.drawController = function(controller, timeout)
{
	if(controller == undefined){return false;}
	return setTimeout(torch.helperMethods.drawControllerHelper, timeout, controller);
};

torch.helperMethods.createEventMethod = function(canvas, eventName)
{
	canvas["on"+eventName]=function(e) {
		torch.helperMethods.canvasEventHitDetection(e, this); 
		if(this["oncanvas"+eventName] != null)
		{
			try{return this["oncanvas"+eventName](e);}
			catch(e)
			{
				if(console){console.log(e.name+": "+e.message);}
			}
		}
	};
};

/* Created objects are given an array called "canvases" and are
*	added to canvases who listen for interactions with them.  They
*	are given a method they can call when their state changes to alert
*	their owner canvases of a need to redraw.  This is that method.
*/
torch.helperMethods.requestRedraw = function()
{
	if(this.listeners == undefined){return;}
	
	for(var i=0; i<this.listeners.length; i++)
	{this.listeners[i].requestRedraw();}
};

torch.helperMethods.drawControllerHelper = function(controller)
{controller.drawingLoop();};

torch.helperMethods.giveCanvasFocus = function()
{this.hasCanvasFocus = true;};

torch.helperMethods.clearCanvasFocus = function()
{this.hasCanvasFocus = false;};

//helper method to create a new layer by creating an equal canvas exactly under or
//over the main canvas
torch.createNewCanvasLayer = function(oldCanvas, zIndex)
{
	var newLayer = document.createElement('canvas');
	newLayer.width = oldCanvas.width;
	newLayer.height = oldCanvas.height;
	newLayer.style.position = 'absolute';
	newLayer.style.border = oldCanvas.style.border;
	
	//This only works like 98% of the time...
	//working on getting it higher.
	var position = torch.localToGlobal(0,0,oldCanvas);
	newLayer.style.left = ""+position.x+"px";
	newLayer.style.top = ""+position.y+"px";
	newLayer.style.zIndex = ""+zIndex;
	document.body.appendChild(newLayer);
	return newLayer;
};

/*  Hit detection methods.
 *  Given an appropiate input, calls the corresponding
 *  event method of any canvasObjects that were "hit" by
 *  the position given as input.
 */
torch.helperMethods.canvasEventHitDetection = function(globalE, hitCanvas)
{
	try
	{
		var h = torch.helperMethods;
		
		if(globalE.type.indexOf("touch") > -1)
		{h.canvasTouchHitDetection(globalE, hitCanvas)}
		else if(globalE.type.indexOf("key") > -1)
		{h.canvasKeyEvent(globalE, hitCanvas)}
		else
		{h.canvasMouseHitDetection(globalE, hitCanvas)}
	}
	catch(e)
	{
		if(console){console.log(e.name+": "+e.message);}
	}
};

torch.helperMethods.canvasMouseHitDetection = function(globalE, hitCanvas) {
	var localPoint = torch.globalToLocal(globalE.clientX, globalE.clientY, hitCanvas);
	
	//handle CSS transforms
	localPoint.x = localPoint.x*(hitCanvas.width/hitCanvas.clientWidth);
	localPoint.y = localPoint.y*(hitCanvas.height/hitCanvas.clientHeight);
	
	//apply context inverse
	var m = hitCanvas.getContext("2d").currentTransform.inverse();
	var newX = m.a*localPoint.x+m.c*localPoint.y+m.e;
	var newY = m.b*localPoint.x+m.d*localPoint.y+m.f;

	//determine scaling
	var scaleFactor = hitCanvas.width/hitCanvas.clientWidth;
	newX*=scaleFactor;
	newY*=scaleFactor;

	torch.helperMethods.canvasMouseDelegator(newX, newY, globalE, hitCanvas);
};

torch.helperMethods.canvasTouchHitDetection = function(globalE, hitCanvas)
{	
	//We spelled GREED, we locked two balls in the vault,
	//it's time for multi-touch!
	var touch;

	for(var i=0; i<globalE.changedTouches.length; i++)
	{
		touch = globalE.changedTouches[i];
		//hackey adjustment.  Please fix.
		var localPoint = torch.globalToLocal(touch.pageX-window.scrollX, touch.pageY-window.scrollY, hitCanvas);
		//apply context inverse
		var m = hitCanvas.getContext("2d").currentTransform.inverse();
		var newX = m.a*localPoint.x+m.c*localPoint.y+m.e;
		var newY = m.b*localPoint.x+m.d*localPoint.y+m.f;

		//determine scaling
		var scaleFactor = hitCanvas.width/hitCanvas.clientWidth;
		newX*=scaleFactor;
		newY*=scaleFactor;

		torch.helperMethods.canvasTouchDelegator(newX, newY, globalE, touch, hitCanvas);
	}
};
//NOTE:
/*
	The "click" event is handled differently here.
	"Clicks" are defined as a mouse pressing and releasing without moving too much.
	Clicks should be used mainly for selecting, and not for advanced manipulation.
	Use mouseup and mousedown for more control.
*/
torch.helperMethods.canvasTouchDelegator = function(localX, localY, globalE, touch, hitCanvas)
{	
	var eventType = globalE.type;
	var id = touch.identifier;
	//var touchIndex = touch.
	//When a finger slides across the canvas, it's still a 
	//click for the canvas, so touchend generates all the
	//relevant legacy events at the original finger point.
	//That means that you can press a circle, drag your
	//finger away and release, and the circle will get
	//mouseover through click events.  This is wrong.
	//In case of a touchmove event, prevent the mouseup and mousedown
	//events from firing until click is found or another touch
	//begins.
	
	//This part of the code is still in flux and is not
	//guaranteed to be stable or accurate, especially
	//in the case of multitouch.
	if(eventType == "touchstart")
	{hitCanvas.ignoreLegacyEvents = false;}
	
	if(eventType == "touchmove")
	{hitCanvas.ignoreLegacyEvents = true;}
	
	//if touchdown, prepare for a click event
	if(eventType == "touchstart")
	{
		hitCanvas["touchPressPos"+id] = new torch.point2d(localX, localY);
		hitCanvas["canTap"+id] = true;
		hitCanvas.touchMap.add(touch.identifier, hitCanvas.touchMap.length());
	}

	if(eventType == "touchend" || eventType == "touchcancel")
	{
		hitCanvas.touchMap.remove(touch.identifier);
	}
	
	hitCanvas["lastTouchPos"+id] = new torch.point2d(localX, localY);
	
	//if mouse moved too far, no longer a "click"
	if( eventType == "touchmove" && hitCanvas["canTap"+id] == true && 
	   (	hitCanvas["touchPressPos"+id].x > localX+hitCanvas.clickPixelThreshold ||
	   hitCanvas["touchPressPos"+id].x < localX-hitCanvas.clickPixelThreshold ||
	   hitCanvas["touchPressPos"+id].y > localY+hitCanvas.clickPixelThreshold ||
	   hitCanvas["touchPressPos"+id].y < localY-hitCanvas.clickPixelThreshold)	)
	{
		hitCanvas["canTap"+id] = false;
	}

	//for every given canvas object
	for(var i=hitCanvas.length()-1; i>-1; i--) {
		var target = hitCanvas.getByIndex(i);
		this.evaluateAndDelegateTouchEvent(target, localX, localY, globalE, hitCanvas, id);
	}
};


torch.helperMethods.evaluateAndDelegateTouchEvent = function(target, x, y, e, canvas, touchId)
{
	//prep touches
	if(!target.activeTouches){target.activeTouches = [];}
	if(!target.currentTouchCount){target.currentTouchCount = 0;}

	//First, cleanup touches that have been removed
	for(index in target.activeTouches)
	{
		var elem = target.activeTouches[index];
		var id = canvas.touchMap.getByKey(elem);
		if(elem != undefined && id == null && id != touchId)
		{
			//listening to a dead touch; remove
			target.activeTouches[index] = undefined;
			target.currentTouchCount--;
		}
	}

	//splice out undefineds later?


	var eventType = e.type;
	var context = canvas.getContext("2d");
	if (target.hitDetect != null && target.hitDetect(x, y, context, e))
	{
		if(target.activeTouches.indexOf(touchId) < 0)
		{
			if(target.currentTouchCount < target.maxSimulTouches)
			{
				target.activeTouches.push(touchId);
				target.currentTouchCount++;
			}
			else
			{return;}
		}
		
		//if mouse was not over but now is, active mouseover event
		if(target.isTouchOver != true)
		{
			target.isTouchOver = true;
			
			if(target.ontouchover != null){target.ontouchover(x, y, e, context, touchId);}
		}
		else
		{
			//if mouse was over and didn't move a lot and is now raised, do click event
			//Assumes only one button is being pressed at a time.
			if(eventType == "touchend")
			{
				if(canvas["canTap"+touchId])
				{
					if(canvas.focusActive && target.focus != undefined && target.hasCanvasFocus == false){target.focus();};
					if(target.ontap != null){target.ontap(x, y, e, context, touchId);}
				}
				
				if(canvas.focusActive && target.hasCanvasFocus){target.blur();}
	
				if(target.isTouchOver == true)
				{
					target.isTouchOver = false;
					if(target.ontouchout != null){target.ontouchout(x, y, e, context, touchId);}
				}
				
				var index = target.activeTouches.indexOf(touchId);
				target.activeTouches[index] = undefined;
				target.currentTouchCount--;
			}
		}

		//delegate event, except for two that may have been performed
		if(eventType != null && eventType != "tap")
		{
			if(target["on"+eventType] != null){target["on"+eventType](x, y, e, context, touchId);};
		}
	}
	else if(target.activeTouches.indexOf(touchId) > -1)	//target not hit but is tracking touch
	{
		if(canvas.focusActive && target.hasCanvasFocus){target.blur();}
		
		if(target.isTouchOver == true)
		{
			target.isTouchOver = false;
			if(target.ontouchout != null){target.ontouchout(x, y, e, context, touchId);}
		}
		var index = target.activeTouches.indexOf(touchId);
		target.activeTouches[index] = undefined;
		target.currentTouchCount--;
	}
};

//NOTE:
/*
	The "click" event is handled differently here.
	"Clicks" are defined as a mouse pressing and releasing without moving too much.
	Clicks should be used mainly for selecting, and not for advanced manipulation.
	Use mouseup and mousedown for more control.
*/
torch.helperMethods.canvasMouseDelegator = function(localX, localY, globalE, hitCanvas)
{	
	var t = torch;
	var eventType = globalE.type;
	hitCanvas.lastMousePos = new t.point2d(localX, localY);
	
	if(hitCanvas.ignoreLegacyEvents)
	{
		if(eventType == "mousedown" || eventType == "mouseup")
		{return;}
		
		if(eventType == "click")
		{hitCanvas.ignoreLegacyEvents = false;return;}
	}
	
	//if mousedown, prepare for a click event
	if(eventType == "mousedown")
	{
		hitCanvas.mousePressPos = new t.point2d(localX, localY);
		hitCanvas.canClick = true;
		hitCanvas.mouseButtonDown = globalE.button;
	}
	
	//if mouse moved too far, no longer a "click"
	if( (eventType == "mousemove") && hitCanvas.canClick == true && 
	   (	hitCanvas.mousePressPos.x > localX+hitCanvas.clickPixelThreshold ||
	   hitCanvas.mousePressPos.x < localX-hitCanvas.clickPixelThreshold ||
	   hitCanvas.mousePressPos.y > localY+hitCanvas.clickPixelThreshold ||
	   hitCanvas.mousePressPos.y < localY-hitCanvas.clickPixelThreshold)	)
	{
		hitCanvas.canClick = false;
	}
	
	//for every given canvas object
	for(var i=hitCanvas.length()-1; i>-1; i--) {
		var target = hitCanvas.getByIndex(i);
		t.helperMethods.evaluateAndDelegateMouseEvent(target, localX, localY, globalE, hitCanvas);
	}
};

/*
*	On keyboard events, passes those events to whatever objects have focus
*	Still working on focus... for now, it seems to be consistent if I provide
*	focus() and blur() events and let the objects and controller set canvas
*	focus.  This allows the coder to decide if blur() will remove focus, or if
*	focus() will add it.  There are giveCanvasFocus() and removeCanvasFocus()
*	methods that each object can use.
*
*	I am assuming that no object needs to be told which canvas it has focus in,
*	since only one canvas can assign focus at a time, there won't be a chance
*	that an object with focus in a canvas will be able to hear events from
*	another canvas it exists in.
*/
torch.helperMethods.canvasKeyEvent = function(keyEvent, hitCanvas)
{
	for(var i=hitCanvas.length()-1; i>-1; i--) {
		var target = hitCanvas.getByIndex(i);
		
		if(target.hasCanvasFocus)
		{
			if(target[keyEvent.type] != null){target[keyEvent.type](keyEvent);};
		}
	}
};

//determines and takes appropiate action for a given canvas event.
//For a given target, determine what the event means for that
//object and calls the appropiate method listener.
torch.helperMethods.evaluateAndDelegateMouseEvent = function(target, x, y, e, canvas)
{
	var eventType = e.type;	
	
	if (target.hitDetect != null && target.hitDetect(x, y, canvas.getContext("2d"), e)) {
		//if mouse was not over but now is, active mouseover event
		if(target.isMouseOver == false)
		{
			target.isMouseOver = true;
			if(target.onmouseover != null){target.onmouseover(x, y, e, canvas.getContext("2d"));}
		}
		else
		{
			//if mouse was over and didn't move a lot and is now raised, do click event
			//Assumes only one button is being pressed at a time.
			if(eventType == "mouseup" && canvas.mouseButtonDown == e.button && canvas.canClick)
			{
				//check for right click; only standard mouse button across browsers.
				if(e.button == 2 && target.rightclick != null)
				{target.rightclick(x, y, e, canvas.getContext("2d"));}
				else if(e.button != 2)
				{
					if(canvas.focusActive && target.focus != undefined && target.hasCanvasFocus == false){target.focus();}
					if(target.onclick != null){target.onclick(x, y, e, canvas.getContext("2d"));}
				}
			}
			
			if(eventType == "mousedown" && e.button != 2)
			{
				if(canvas.focusActive && target.focus != undefined && target.hasCanvasFocus == false){target.focus();}
			}
		}

		//delegate event, except for two that may have been performed
		if(eventType != null && eventType != "click" && eventType != "mouseover")
		{
			if(eventType == "mouseout" && target.isMouseOver == true)
			{
				target.isMouseOver = false;
				target.mousePressed = false;
				if(target.onmouseout != null){target.onmouseout(x, y, e, canvas.getContext("2d"));}
			}
			else
			{
				if(target["on"+eventType] != null){target["on"+eventType](x, y, e, canvas.getContext("2d"));}
			}
		}

	}
	else	//target not hit
	{
		if(canvas.focusActive && eventType == "click" && target.hasCanvasFocus){target.blur();}
		
		if(target.isMouseOver == true)
		{
			target.isMouseOver = false;
			target.mousePressed = false;
			if(target.onmouseout != null){target.onmouseout(x, y, e, canvas.getContext("2d"));}
		}
	}
};

/* a simple group object that holds one or more objects.
 * Its utility is in the fact that it can provide
 * a transformation to all held objects.
 *
 * Still working on whether this is the right track
 * to take.  I think I get it though.
 * The main "group" is the controller, and the controller
 * itself is a descendant of group that can listen to the
 * canvases it controls as well.  But the controller is
 * a group because it can manipulate the context and draw
 * children, which all a group does.
 *
 * It's not hard to make, but it is hard to make RIGHT.
 */
torch.Group = function()
{
	torch.giveSmartCTM(this);
	torch.setupAsObjectListener(this);
	this.maxSimulTouches = 100;

	this.requestRedraw = function()
	{
		if(this.listeners != null)
		{
			for(var i=0; i<this.listeners.length;i++)
			{
				this.listeners[i].requestRedraw();
			}
		}
	};
	
	this.draw = function(context)
	{
		var ctm = this.currentTransform;
		context.save();
		context.transform(ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f);
		for(var i=0; i<this.speakingObjects.length(); i++)
		{
			var object = this.speakingObjects.getByIndex(i);
			if(object.draw != null){object.draw(context);}
		}
		context.restore();
	};
			
	this.hitDetect = function(x,y,context)
	{
		var detected = false;
		var ctm = this.currentTransform;
		var ctmI = this.currentTransform.inverse();

		//apply inverse
		var newX = ctmI.a*x+ctmI.c*y+ctmI.e;
		var newY = ctmI.b*x+ctmI.d*y+ctmI.f;
		
		context.save();
		context.transform(ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f);
		for(var i=0; i<this.speakingObjects.length(); i++)
		{
			//if any object is detected, then Group should receive event.
			detected = detected | this.speakingObjects.getByIndex(i).hitDetect(newX,newY,context);
			if(detected){i=this.speakingObjects.length();}
		}
		context.restore();
		return detected;
	};
	
	//all mouse events get the same delegator, but
	//not all events are listed here!
	//For example, mouseup and click may result in duplicate events 
	//for children, as both of those events can be passed in a single
	//evaluation, so evaluating twice will double the number of events.
	//only events that are passively passed on in
	//evaluateAndDelegateMouseEvent() are listed here.
	//Other "determined" events that are called specifically
	//will be generated from these listed events and will only
	//result in duplicates if they are assigned.
	this.oncanvasdrawn = this.onmouseup = this.onmouseout = this.onmousemove = this.onmousedown = this.ondblclick = this.onmouseover = function(x,y,e,context)
	{		
		var ctm = this.currentTransform;
		var ctmI = this.currentTransform.inverse();
		
		//apply inverse
		var newX = ctmI.a*x+ctmI.c*y+ctmI.e;
		var newY = ctmI.b*x+ctmI.d*y+ctmI.f;
		
		context.save();
		context.transform(ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f);
		for(var i=0; i<this.speakingObjects.length(); i++)
		{
			var child = this.speakingObjects.getByIndex(i);
			torch.helperMethods.evaluateAndDelegateMouseEvent(child, newX, newY, e, context.canvas);
		}
		context.restore();
	};
	
	this.ontouchstart = this.ontouchend = this.ontouchmove = function(x,y,e,context,touch)
	{
		var ctm = this.currentTransform;
		var ctmI = this.currentTransform.inverse();
		
		//apply inverse
		var newX = ctmI.a*x+ctmI.c*y+ctmI.e;
		var newY = ctmI.b*x+ctmI.d*y+ctmI.f;

		context.save();
		context.transform(ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f);
		for(var i=0; i<this.speakingObjects.length(); i++)
		{
			var child = this.speakingObjects.getByIndex(i);
			torch.helperMethods.evaluateAndDelegateTouchEvent(child, newX, newY, e, context.canvas,touch);
		}
		context.restore();
	};
};
torch.Group.prototype = new torch.lib.baseTorchObject();

torch.setupAsObjectListener = function(c)
{
	//do not set up twice
	if(c.speakingObjects != null){return;}
	
	c.speakingObjects = new torch.Map();
	c.add = torch.helperMethods.addInteractiveObject;
	c.remove = function(objectKeyID){this.speakingObjects.remove(objectKeyID);};
	c.getByIndex = function(index){return this.speakingObjects.getByIndex(index);};
	c.getByKey = function(key){return this.speakingObjects.getByKey(key);};
	c.length = function(){return this.speakingObjects.length();};
};

torch.helperMethods.addInteractiveObject = function(objectKeyID, objectValue)
{
	this.speakingObjects.add(objectKeyID, objectValue);
	torch.helperMethods.setupInteractiveObject(objectValue);
	if(objectValue.onHasBeenAdded != null){objectValue.onHasBeenAdded(this, objectKeyID);};
	objectValue.listeners.push(this);
};

torch.helperMethods.setupInteractiveObject = function(obj)
{
	if(obj.listeners != null){return;}

	obj.listeners = [];
	obj.requestRedraw = torch.helperMethods.requestRedraw;
	obj.giveCanvasFocus = torch.helperMethods.giveCanvasFocus;
	obj.clearCanvasFocus = torch.helperMethods.clearCanvasFocus;
	obj.hasCanvasFocus = false;
	obj.isMouseOver = false;
	obj.isTouchOver = false;
	obj.maxSimulTouches = obj.maxSimulTouches || 1;
	obj.currentTouchCount = obj.currentTouchCount || 0;

};

torch.helperMethods.browserHasCanvas = function()
{
	return !!(document.createElement("canvas").getContext("2d"));
};

/**
 * Adjusts the canvas resolution for 
 * 
 * @param canvas				canvas whose 2d resolution to set.
 * @param canvasResolution		resolution the canvas to scale to.  2 is twice the density, 1/2 is half.
 */
torch.setCanvasResolution = function(canvas, pixelDensity, cssSizeHasBeenSet, sizesAreBasedOnWidth)
{
	var cr = pixelDensity || window.devicePixelDensity || 1;
	if(!cssSizeHasBeenSet)
	{
		canvas.style.width = ""+canvas.width+"px";
		canvas.style.height = ""+canvas.height+"px";
		canvas.width = canvas.width * cr;
		canvas.height = canvas.height * cr;
	}
	else
	{
		canvas.width = canvas.clientWidth * cr;
		canvas.height = canvas.clientWidth * cr;
	}
	
	canvas.pixelDensity = cr;
	
	if(!sizesAreBasedOnWidth)
	{
		var context = canvas.getContext("2d");
		context.save();
		context.scale(cr,cr);
	}
};
