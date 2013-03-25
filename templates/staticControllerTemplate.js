/**
 *	The template for new static Controllers.
 *	Static controllers are similar to images; they are drawn once,
 *	then left alone.  They offer no interaction or animation,
 *	but no almost no impact at all on performance.
 *	
 *	You should start with this template if you are trying to create
 *	a static image using canvas and a library of components.
 *	
 *	You do not need to edit any of the existing code in here 
 *	(although you certainly can if you wish.) You can just
 *	add additional code to where block comments	have been placed
 *	in order to create your controller.  You can remove the existing
 *	comments as you go if desired.
 */

function s_Controller()
{

/*
	You can list your objects and variables here.
	Note that it is not required to list them
	here (you can create them dynamically in the code)
	but it is simply a convenience to keep track of
	your objects and help future developers understand them.
*/
this.canvas;
this.context;


/*
 * One-time setup method that links this controller to relevant DOM objects,
 * like canvases and divs.
 * This method accepts a setupVars Object that holds all needed objects.
 * Usually, this will be a single canvas object, but some controllers
 * may call for references to other elements on the page or multiple canvases.
 * However, be careful not to couple your controller too tightly with the
 * page it's presented on.
 * 
 * setupVars{
 * 	canvas:	<canvas> | a DOM canvas element.
 * 	...list other objects here...
 * }
 */
this.setup = function(setupVars)
{
    this.canvas = setupVars.canvas;
    if(!torch.setupInteractiveCanvas(this.canvas)){return false;}
	this.context = this.canvas.getContext("2d");
	
	//Calling this method is recommended for best results on mobile devices.
	//See InteractiveCanvasHelper.js for the API until we get documentation.
	//torch.setCanvasResolution(this.canvas, window.devicePixelRatio, false, false);
	
	/*
		Your setup code here
	*/
	
	return true;
};

/*
 * Data loading method, called whenever new data is to be displayed.
 * This method accepts a single data Object that holds all needed objects.
 * The exact implementation will depend on your controller, and some controllers
 * will not need to use this method at all.
 * 
 * data{
 * 	...list data objects here...
 * }
 */
this.loadData = function(data)
{
	/*
		Your setup code here
	*/
};

/*
 * The function that draws to the canvas.
 * All drawing should be centralized to this method if possible
 * to maintain code clarity.
 */
this.draw = function()
{
	//A sample drawing
	//Replace with your own!
	var c = this.context;
	c.save();
	
	c.scale(2,2);
	var leftX = 10.5;
	var rightX = 50.5;
	var topY = 10.5;
	var bottomY = 50.5;
	var butt = 5;
	
	c.beginPath();
	c.moveTo(leftX+butt,topY);
	c.lineTo(leftX,topY);
	c.lineTo(leftX,bottomY);
	c.lineTo(leftX+butt,bottomY);
	c.stroke();
	
	c.beginPath();
	c.moveTo(rightX-butt,topY);
	c.lineTo(rightX,topY);
	c.lineTo(rightX,bottomY);
	c.lineTo(rightX-butt,bottomY);
	c.stroke();
	
	c.fillText("a",leftX+butt, topY+10);
	c.fillText("b",leftX+butt, topY+22);
	c.fillText("c",(leftX+rightX)/2-2, topY+10);
	c.fillText("d",(leftX+rightX)/2-2, topY+22);
	c.fillText("x",rightX-butt-4, topY+10);
	c.fillText("y",rightX-butt-4, topY+22);
	c.fillText("0",leftX+butt, topY+34);
	c.fillText("0",(leftX+rightX)/2-2, topY+34);
	c.fillText("1",rightX-butt-4, topY+34);
	
	c.restore();
};

this.play = function()
{
	//Static controllers do not have animation,
	//but play() is provided for a consistent interface.
	//For static controllers, play() is equivalant to draw().
	this.draw();
};

this.pause = function()
{
	//Static controllers do not have animation,
	//but pause() is provided for a consistent interface.
};

}
