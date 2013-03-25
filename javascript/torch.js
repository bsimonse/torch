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

torch.drawController = function(controller, timeout)
{
	if(controller == undefined){return false;}
	return setTimeout(torch.helperMethods.drawControllerHelper, timeout, controller);
};

torch.helperMethods.createEventMethod = function(canvas, eventName)
{
	canvas["on"+eventName]=function(e) {
		torch.helperMethods.canvasEventHitDetection(e, this); 
		if(this["oncanvas"+eventName] != null){return this["oncanvas"+eventName](e);}
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
	var h = torch.helperMethods;
	if(globalE.type.indexOf("touch") > -1)
	{h.canvasTouchHitDetection(globalE, hitCanvas);}
	else if(globalE.type.indexOf("key") > -1)
	{h.canvasKeyEvent(globalE, hitCanvas);}
	else
	{h.canvasMouseHitDetection(globalE, hitCanvas);}
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
	
	if(eventType == "touchend")
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
	var eventType = e.type;
	var context = canvas.getContext("2d");
	if (target.hitDetect != null && target.hitDetect(x, y, context, e))
	{
		if(target["isListeningTo"+touchId] != true)
		{
			if(target.currentTouchCount < target.maxSimulTouches)
			{
				target["isListeningTo"+touchId] = true;
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
				
				target["isListeningTo"+touchId] = undefined;
				target.currentTouchCount--;
			}
		}

		//delegate event, except for two that may have been performed
		if(eventType != null && eventType != "tap")
		{
			if(target["on"+eventType] != null){target["on"+eventType](x, y, e, context, touchId);};
		}
	}
	else if(target["isListeningTo"+touchId] == true)	//target not hit
	{
		if(canvas.focusActive && target.hasCanvasFocus){target.blur();}
		
		if(target.isTouchOver == true)
		{
			target.isTouchOver = false;
			if(target.ontouchout != null){target.ontouchout(x, y, e, context, touchId);}
		}
		target["isListeningTo"+touchId] = undefined;
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
			detected = detected || this.speakingObjects.getByIndex(i).hitDetect(newX,newY,context);
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
	
	//although the signature has 6 parameters,
	//this method will also accept a single array
	//of length 6 that contains the variables as well.
	//Javascript does not have overloading.
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
//SCALING

//These scaling methods ONLY affect the context drawing area of the canvas,
//and will NOT affect the HTML size of the canvas itself.  That responsibility
//should fall to the CSS of the page, not the JavaScript.

//The purpose of these methods is to allow the app and canvas to communicate in common
//pixel terms.  If no scaling values are used (which should be the default), then the
//two are already communicating correctly.  However, if scaling is used or required
//(like for the Retina display), then the two values will need some translation so
//that the final image does not appear too large or too small.

//As the commands come from the app, it is assumed that all pixel values will be
//in App pixels, or "appps".  These are not immediately usable; they need to be converted
//to canvas pixels, or "caps".  The appp to cap ratio may depend on viewportScale, cssScale,
//and context scale of the canvas.  In order to assist the code, a helper object
//will be created on startup that holds all relevant numbers and has simple
//functions that translate between appps and caps.
//
//There are always going to be quirks; for example, if a phone rotates from portrait to landscape
//and keeps the same viewport width, the screen will zoom, but that may be acceptable and you
//won't want to change any canvas values.  Since not enough information on best practices is
//known at this time, the methods try to make all practices available, with the hopes that
//they won't be necessary in most cases.  Do not make the mistake of thinking that you must
//understand and use every form of scaling to properly construct your page!  The best-designed
//pages will likely use no scaling whatsoever, with rare exceptions.

/**
 * Sets up the appPixelTranslator object, which is used to handle scaling.  
 * This method should only be called by html pages that need scaling, and all parameters are optional.
 * In fact, you should strive to code your screen in such a way that you don't have to call this method.
 * 
 * This method sets up the framework objects that handle translations between the app
 * and JavaScript controller, such as scaling factors and message handling.  Even if
 * you are not using these features, you should still call this method with no parameters
 * to ensure that everything is set up correctly.
 * 
 * In an ideal world, you would never set any of the possible parameters,
 * and would instead leave them blank and accept the defaults.  All new
 * projects should assume the defaults as development is being done. 
 * However, we know that there are some cases where the values need to change
 * (as a quick example, the iPhone 3G and iPhone 4 cannot use identical values,
 * as this will cause a blurry image on the Retina display of the iPhone 4.)
 * 
 * In order to provide the ability to handle special cases, the given helper methods
 * have been provided.  BE WARNED: blindly relying on these parameters is a sure way to cause
 * errors across multiple devices.  Always try to resolve the issues by making your code
 * responsive and based off of percentages and available area, rather than hard-coded
 * values.
 * 
 * @param givenViewportScale	the amount the viewport has been scaled by.  The assumed default is 1.
 * 
 * 								It's not recommended to scale the viewport manually or to allow the user to scale,
 * 								but it may be necessary in very select cases.  However, note that if
 * 								you ever change the viewport scale, you'll have to call this method again
 * 								and pass the new zoom level.
 * 
 * 								For sites where the viewport width is fixed, rather than scaling, the number
 * 								returned by this method will be wrong for the other orientation, where the scale
 * 								is not 1.0.  However, as this is a simple ratio (same as between height and width
 * 								of the device itself), that measurement is left up to the app to convert.  I
 * 								realize this is messy, but then again, your site should be responsive and you
 * 								should have almost no need for a number in this case, so this is an outlier
 * 								situation.
 * 
 * @param givenCssWidth			the flat pixel width css rule applied to the canvas tag.  The default is equal
 * 								to each canvas's width attribute (1x scaling).
 * 								Note that this parameter is different from the others... if you are NOT using
 * 								a CSS rule for width, then you MUST NOT pass a value to this parameter,
 * 								as it will cause canvases of all sizes to try and scale to this value.
 * 								It is very much not recommended that you give the canvas a hard-coded pixel width,
 * 								unless you are using a small canvas that will fit easily on all screen sizes.
 * 								The best practice is to have a stretchable canvas that draws based on its own
 * 								width, if it is feasible.
 * 
 * @param shouldSetViewport		whether the viewport scale should immediately be set to the new given value.
 * 								Defaults to false/no.
 * 								Can safely be ignored most of the time, as the viewport should not be scaled
 * 								manually, but is provided just in case.  Older apps also need this setting.
 * 		
 */
torch.setupScaling = function(givenViewportScale, givenCanvasCssWidth, shouldSetViewport)
{
	var viewportScale = givenViewportScale || 1;
	var cssWidth = givenCanvasCssWidth || -1;
	
	torch.isInApp = true;
	this.scaleHelper.canvasCssWidth = cssWidth;
	this.scaleHelper.viewportScale = viewportScale;
	
	//style canvas CSS
	var head = document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
	style.type = 'text/css';
	style.innerText = "canvas{-webkit-tap-highlight-color:rgba(0,0,0,0); -webkit-touch-callout:none;} ";
	head.appendChild(style);
	
	//viewport
	if(shouldSetViewport)
	{
		this.scaleHelper.setupViewport();
	}
};

/**
 * This object helps translate between caps and appps, if it is setup.
 */
torch.scaleHelper = {
		
	canvasCssWidth:-1,
	viewportScale:-1,
	
	/**
	 * Rewrites the viewport meta tag to use the viewportScale value of this object.
	 */
	setupViewport:function()
	{
		var viewport = document.querySelector("meta[name=viewport]");
		if(viewport != null)
		{
			viewport.setAttribute("content", "target-densitydpi=device-dpi, width=device-width, initial-scale="+this.viewportScale+", user-scalable=no");
		}
	},
	
	/**
	 * Converts the given value from a canvas pixel to an app
	 * pixel.
	 * The canvas parameter is not needed if the canvasCssWidth
	 * parameter was set in setupForDevice, but it is strongly
	 * recommended that you do not set this value.  See setupForDevice
	 * for more information.
	 * 
	 * @param value		the pixel value (e.g. a coordinate, a width, a radius) to convert
	 * @param canvas	the canvas whose properties should be used
	 */
	canvasPixelToAppPixel:function(value, canvas)
	{
		var finalValue = value;
		finalValue /= canvas.pixelDensity;
		
		if(this.viewportScale > 0)
		{
			finalValue /= viewportScale;
		}
		
		if(this.canvasCssWidth > 0 && canvas.width > 0)
		{
			var scaleFactor = this.canvasCssWidth/canvas.width;
			finalValue /= scaleFactor;
		}
		
		return finalValue;
	},
	
	/**
	 * Converts the given value from an app pixel to a canvas pixel.
	 * 
	 * The canvas parameter is not needed if the canvasCssWidth
	 * parameter was set in setupForDevice, but it is strongly
	 * recommended that you do not set this value.  See setupForDevice
	 * for more information.
	 * 
	 * @param value		the pixel value (e.g. a coordinate, a width, a radius) to convert
	 * @param canvas	the canvas whose properties should be used
	 */
	appPixelToCanvasPizel:function(value, canvas)
	{
		var finalValue = value;
		
		finalValue *= canvas.pixelDensity;
		
		if(this.viewportScale > 0)
		{finalValue *= viewportScale;}
		
		if(this.canvasCssWidth > 0 && canvas.width > 0)
		{
			var scaleFactor = this.canvasCssWidth/canvas.width;
			finalValue *= scaleFactor;
		}
		
		var context = canvas.getContext("2d");
		if(context.resolution != null)
		{finalValue *= context.resolution;}
		
		return finalValue;
	}
};

//MESSAGING

torch.canSendAppMessages = false;
torch.appMessagePrefix = "app:";

/**
 * Setter for whether the app accepts messages from this page.
 * Implementation for how this is done is defined by sendMessageToApp below.
 * 
 * All apps who want to receive callbacks from the JavaScript should
 * set this flag to true.
 * 
 * @param appWillAcceptMessages		whether the app accepts the messaging contract
 */
torch.setAppAcceptsMessages = function(appWillAcceptMessages)
{
	torch.canSendAppMessages = appWillAcceptMessages;
};

/**
 * Sends a message back to the app using a made up protocol.
 * Current implementation changes the location of the window,
 * which should trigger a method in the WebView's delegate on either device.
 * Future versions of this method may take advantage of Android's
 * linker object, but maintain the same API, so it is a best practice
 * to use this method.
 */
torch.sendMessageToApp = function(message)
{
	if(torch.canSendAppMessages)
	{window.location = ""+torch.appMessagePrefix+message;}
};
//A simple utility hashmap
torch.Map = function()
{
	this.keys = new Array();
	this.values = new Object();	//Intentionally not an array... just a data object
	
	//Add a new key-value pair to the hashmap.
	//Duplicates are accepted, but should be avoided.
	this.add = function(key, value){
		this.keys.push(key);
		this.values[key] = value;	
	};
	
	//Returns the number of key-value pairs held.
	this.length = function(){
		return this.keys.length;
	};
	
	//Returns a value with the associated key.
	this.getByKey = function(key) {
		return this.values[key];
	};
	
	//Returns the value at the given index.
	//Elements are ordered by when they are added.
	//
	//Indices are NOT maintained through removals,
	//so a single value's index may change and should not
	//be counted on to stay the same.
	//
	//This method is primarily for accessing all values
	//through a loop.
	//For other uses, use getKey().
	this.getByIndex = function(index) {
		var key = this.keys[index];
		return this.values[key];
	};
	
	//Removes a key-value pair from the hashmap.
	//Returns true if successful, false if not.
	this.remove = function(key) {
		this.values[key] = null;
		for(var i=0; i<this.keys.length; i++)
		{
			if(this.keys[i] == key)
			{
				this.keys.splice(i, 1);
				return true;
			}
		}
		
		//could not find or remove
		return false;
	};
}/**These methods were creating using Chrome because of the ease of debugging.
*They still work in other browsers, but have many small quirks that have not
*been ironed out (for instance, in IE, small adjustments are needed for
*reasons that are not quite clear.)

*A lot of this is makeshift, so please improve whatever you can.
*Also, if you can replace this with jQuery or an actual professional
*framework, then by all means do so.  There's nothing specific in
*these methods that the framework depends on, other than the right
*answer.
*/

torch.point2d = function(x,y)
{
	this.x = x || 0;
	this.y = y || 0;
};

//Converts a global coordinate to a local coordinate in the destination.
//
torch.globalToLocal = function(x,y,dest)
{
	var totalOffsetX = 0-window.scrollX;
	var totalOffsetY = 0-window.scrollY;
	var container = dest;
	
	while(container.offsetParent != null)
	{
		totalOffsetX += container.offsetLeft+container.clientLeft;
		totalOffsetY += container.offsetTop+container.clientTop;
		container = container.offsetParent;
	}
	
	//the u is for untransformed
	var uX = x-totalOffsetX;
	var uY = y-totalOffsetY;
	
	//assume no transformation
	var transformedX = uX;
	var transformedY = uY;
	
	//CSS transformations.
	//TURNED OFF FOR NOW; research needed to fully implement.  Demo code remains.
	//assume parents have no CSS transform (see how long we get away with that...)
	/*var origin = window.getComputedStyle(dest, null).getPropertyValue("-webkit-transform-origin");
	var transform = window.getComputedStyle(dest,null).getPropertyValue("-webkit-transform");
	
	//the Droid doesn't seem to support 3d transforms... hmmm.  Revisit.
	if(navigator.userAgent.match(/Android/i) == null && transform.indexOf("atrix") >= 0)
	{
		//parse out individual transforms
		var m = new Array(6);
		var splits = transform.split(",",6);
		m[0] = parseFloat(splits[0].substr(splits[0].indexOf("(")+1, 12));
		m[1] = parseFloat(splits[1]);
		m[2] = parseFloat(splits[2]);
		m[3] = parseFloat(splits[3]);
		m[4] = parseFloat(splits[4]);
		m[5] = parseFloat(splits[5].substring(0, splits[5].indexOf(")")));
		
		//assume origin of 0,0
		
		//get inverse transformation 
		var inverse = new Array(6);
		var determinant = m[0]*m[3]-m[1]*m[2];
		
		inverse[0] = m[3]/determinant;
		inverse[1] = (0-m[1])/determinant;
		inverse[2] = (0-m[2])/determinant;
		inverse[3] = m[0]/determinant;
		inverse[4] = (m[2]*m[5]-m[4]*m[3])/determinant;
		inverse[5] = (m[1]*m[4]-m[0]*m[5])/determinant;
		
		//apply inverse transformation
		transformedX = inverse[0]*uX+inverse[2]*uY+inverse[4];
		transformedY = inverse[1]*uX+inverse[3]*uY+inverse[5];
	}*/

	return new torch.point2d(transformedX, transformedY);
};

//Converts a locally obtained coordinate to a global coordinate.
torch.localToGlobal = function(x,y, src)
{
	var totalOffsetX = 0;
	var totalOffsetY = 0;
	var container = src;

	//adjust for border
	var myStyle;
	var fixBorder = false;
	myStyle = window.getComputedStyle(container, null);
	fixBorder = myStyle.getPropertyValue("border-left-style") != "none";
	
	if(fixBorder)
	{
		var type = myStyle.getPropertyValue("border-left-width");
		
		switch(type)
		{
			case "thin":
			totalOffsetX-=2;totalOffsetY-=2;
			break;
			
			case "medium":
			totalOffsetX-=4;totalOffsetY-=4;
			break;
			
			case "thick":
			totalOffsetX-=6;totalOffsetY-=6;
			break;
			
			default:
			var amount = type.substring(0,type.indexOf('px'));
			totalOffsetX-=amount;totalOffsetY-=amount;
			break;
		}
	}



	while(container.offsetParent != null)
	{
		totalOffsetX += container.offsetLeft+container.clientLeft;
		totalOffsetY += container.offsetTop+container.clientTop;
		container = container.offsetParent;
	}

	return new torch.point2d(x+totalOffsetX, y+totalOffsetY);
};

//Converts a local coordinate in one object to a local coordinate in another.
//Useful in overlapping objects or drag and drop.
torch.localToOtherLocal = function(x,y,src,dest)
{
	var point = torch.localToGlobal(x,y,src);
	return torch.globalToLocal(point.x,point.y,dest);
};


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
			if(Math.abs(z-x) < b){return this.bez(p1.y,p2.y);}else if(z > x){t-=s;s/=2;}else if(z < x){t+=s;s/=2;}
		}
		
		return this.bez(p1.y,p2.y);
	};
};
