/**These methods were creating using Chrome because of the ease of debugging.
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

