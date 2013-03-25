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
