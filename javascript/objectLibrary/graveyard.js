/**
*	The graveyard.
*	Feel free to use anything you find,
*	but remember that it died for a reason.
*/

//need to add font, height, etc. later.
//For now, proof of concept of a text box functionality.
//Has tons of terrible "fixes" to handle ExCanvas...
//Not its fault though.  Hopefully they won't be
//needed one day and can be removed.
torch.lib.textBox = function(x, y, width)
{	
	this.x = x|0;
	this.y = y|0;
	this.width = width|100;
	this.height = 28;
	this.text = "";
	this.selectedText = "";
	this.selectedTextStartIndex = -1;
	this.selectedTextEndIndex = -1;
	this.cursorIndex = 0;	//character index for cursor to be at
	this.margin = 3;
	this.natrualBlur = true;
	
	this.cursorShow = false;
	this.timer = new Date();
	this.blinkTime = 500;	//ms between cursor blinks
	this.lastBlink = this.timer.getTime();//time of last blink
	
	this.dragging = false;
	
	//prep for keyboard events like copy and paste
	this.keyboardEventOccured = false;
	this.keyboardEventType = "";
	
	//remove anti-aliasing
	this.x = Math.floor(this.x)+0.5;
	this.y = Math.floor(this.y)+0.5;
	
	//two drawing modes
	//1.  Text fits in box or end is not visible; draw from front
	//2.  Text is too long for box and end of string is visible; draw from back
	this.drawingMode = 1;
	this.drawIndex =0;
	
	this.copyBox = document.createElement("textarea");
	//wanted to make it just invisible... but offscreen will have to
	//do for now.
	this.copyBox.style.position = "absolute";
	this.copyBox.style.width = "0px";
	this.copyBox.style.height = "0px";
	this.copyBox.style.left = "-1000px";
	this.copyBox.style.top = "-1000px";
	this.copyBox.owner = this;
	document.body.appendChild(this.copyBox);
	//see bottom of class for copyBox functions	

	this.draw = function(context)
	{
		context.clearRect(this.x, this.y, this.width, this.height);
		
		//box
		context.save();
		context.lineWidth = 1;
		context.strokeStyle = "black";	
		context.beginPath();
		context.moveTo(this.x,this.y);
		context.lineTo(this.x+this.width, this.y);
		context.lineTo(this.x+this.width, this.y+this.height);
		context.lineTo(this.x, this.y+this.height);
		context.lineTo(this.x, this.y);
		context.stroke();
		
		//clip text box
		context.beginPath();
		context.moveTo(this.x+this.margin-1,this.y);
		context.lineTo(this.x+this.width+1-this.margin, this.y);
		context.lineTo(this.x+this.width+1-this.margin, this.y+this.height+1);
		context.lineTo(this.x+this.margin-1, this.y+this.height+1);
		context.lineTo(this.x+this.margin-1, this.y);
		context.clip();
		
		context.fillStyle = "black";
		context.textAlign = "start";
		context.textBaseline = "middle";
		context.font = "13px Arial";
		var textWidth = context.measureText(this.text).width;
		if(textWidth > this.width - this.margin*2)
		{
			if(this.cursorIndex == this.text.length){this.drawingMode = 2;}
		}
		else{this.drawingMode = 1;}
		
		//cursor
		//comes first because cursor determines where text starts
		if(this.hasCanvasFocus)
		{
			//must be time to show cursor, and no text selected
			if(this.cursorShow && (this.selectedTextEndIndex-this.selectedTextStartIndex < 1) )
			{
				if(this.drawingMode == 2)
				{
					//being draw from end, so get position from end.
					var newX = this.x+this.width-this.margin;
					var moveLeft = context.measureText(this.text.substr(this.cursorIndex)).width;
					newX = newX-moveLeft;
					
					if(newX <= this.x+this.margin)
					{
						this.drawingMode = 1;
						this.drawIndex = this.cursorIndex;
					}
					else
					{
						newX = Math.floor(newX)+0.5;
						context.beginPath();
						context.moveTo(newX, this.y+this.height*0.2);
						context.lineTo(newX, this.y+this.height*(1-0.2));
						context.stroke();
					}
				}
				
				if(this.drawingMode == 1)
				{	
					if(this.cursorIndex < this.drawIndex)
					{
						this.drawIndex = this.cursorIndex;
					}
					
					var adjustX = 0;
					var complete = false;
					while(!complete)
					{
						var newText = this.text.substr(this.drawIndex);
						var realIndex = this.cursorIndex-this.drawIndex;
						var subText = newText.substr(0,realIndex);
						adjustX = context.measureText(subText).width;
						if(adjustX > this.width-2*this.margin)
						{
							//move right
							this.drawIndex++;
						}
						else
						{
							complete = true;
						}
					}
					
					context.beginPath();
					context.moveTo(Math.floor(this.x+this.margin+1+adjustX)+0.5, this.y+this.height*0.2);
					context.lineTo(Math.floor(this.x+this.margin+1+adjustX)+0.5, this.y+this.height*(1-0.2));
					context.stroke();
				}
			}
			
			
			//selection
			if(this.drawingMode == 1)
			{
				//selection
				if(this.selectedTextEndIndex - this.selectedTextStartIndex > 0)
				{
					var startX;
					var endX;
					
					var visibleText = this.text.substring(this.drawIndex);
					startX = Math.floor(this.x+this.margin+context.measureText(visibleText.substring(0,this.selectedTextStartIndex-this.drawIndex)).width) + 1.5;
					endX = Math.floor(this.x+this.margin+context.measureText(visibleText.substring(0,this.selectedTextEndIndex-this.drawIndex)).width) + 1.5;
					
					context.save();
					
					context.strokeStyle = context.fillStyle = "rgba(150,150,255,1)";
					
					context.beginPath();
					context.moveTo(startX, this.y+this.margin);
					context.lineTo(endX, this.y+this.margin);
					context.lineTo(endX, this.y+this.height-this.margin);
					context.lineTo(startX, this.y+this.height-this.margin);
					context.closePath();
					context.stroke();
					context.fill();
					
					context.restore();
				}
			}
			else if(this.drawingMode == 2)
			{
				//selection
				//TODO
			}
		}
		
		//text
		if(this.drawingMode == 1)
		{			
			var myText = this.text.substr(this.drawIndex);
			context.fillText(myText, this.x+this.margin, this.y+Math.floor(this.height/2));
		}
		else if(this.drawingMode == 2)
		{
			//draw from end
			context.textAlign = "end";
			var myText = this.text;
			context.fillText(myText, this.x+this.width-this.margin, this.y+Math.floor(this.height/2));
		}
		context.restore();
	};

	this.tick = function()
	{
		this.timer = new Date();
		if(this.timer.getTime() - this.lastBlink > this.blinkTime)
		{
			this.cursorShow = !this.cursorShow;
			this.lastBlink = this.timer.getTime();
			this.requestRedraw();
		}
		
		if(this.keyboardEventOccured)
		{
			this.keyboardEventOccured = false;
			switch(this.keyboardEventType)
			{
				case "paste":
					this.insertText(this.copyBox.value);
					this.copyBox.value = "";
					this.requestRedraw();
				break;
				
				case "copy":
					
					this.requestRedraw();
				break;
				
				case "selectAll":
				
					this.requestRedraw();
				break;
				
				case "cut":
				
					this.insertText("");
					this.requestRedraw();
				break;
				
				default:
				break;
			}
		}
	};

	this.hitDetect = function(x,y)
	{
		return (x >= this.x && x <= this.x+this.width &&
				y >= this.y && y <= this.y+this.height);
	};
	
	this.selectAll = function()
	{
		this.selectedText = this.text;
		this.selectedTextStartIndex = 0;
		this.selectedTextEndIndex = this.text.length;
	};
	
	this.onmouseover = function(x,y,e)
	{
		e.currentTarget.style.cursor = "text";
	};
	
	this.onmouseout = function(x,y,e)
	{
		e.currentTarget.style.cursor = "";
	};
	
	this.onmousedown = function(x,y,e)
	{
		if(this.text.length < 1){return;}
		
		var canvas = e.currentTarget;
		var context = canvas.getContext("2d");
			
		//put context settings to be same as when drawing
		context.save();
		context.font = "13px Arial";
		
		if(this.drawingMode == 1)
		{
			//get text that's showing
			var visibleText = this.text.substring(this.drawIndex);
			var localX = x-this.x-this.margin;

			//debug var
			var shortTextLength = context.measureText(visibleText.substring(0, visibleText.length - 1)).width;
			
			//keep cutting text until cutting another letter would make it too small
			while(visibleText.length > 0 && shortTextLength > localX )
			{
				visibleText = visibleText.substring(0, visibleText.length - 1);
				shortTextLength = context.measureText(visibleText.substring(0, visibleText.length - 1)).width;
			}
			
			//found letter that was clicked on... now, 
			//if the cursor is more than halfway across it,
			//go right; otherwise, left.
			var rightDif = context.measureText(visibleText).width - localX;
			var leftDif = context.measureText(visibleText.substring(0, visibleText.length - 1)).width - localX;
			
			//if closer to right, use full substring
			if(Math.abs(rightDif) < Math.abs(leftDif))
			{this.cursorIndex = this.drawIndex + visibleText.length;}
			//if closer to left, cut last letter off
			else
			{this.cursorIndex = this.drawIndex + visibleText.length - 1;}
			
			this.selectedTextStartIndex = this.selectedTextEndIndex = this.cursorIndex;
			
			this.wakeBlink();
			this.requestRedraw();
		}
		else
		{
		}
		
		this.dragging = true;
		context.restore();
	};
	
	this.onmousemove = function(x,y,e)
	{
		if(this.dragging)
		{
			if(this.text.length < 1){return;}
		
			var canvas = e.currentTarget;
			var context = canvas.getContext("2d");
				
			//put context settings to be same as when drawing
			context.save();
			context.font = "13px Arial";
			
			if(this.drawingMode == 1)
			{
				//get text that's showing
				var visibleText = this.text.substring(this.drawIndex);
				var localX = x-this.x-this.margin;
				var mouseIndex = -1;
				//debug var
				var shortTextLength = context.measureText(visibleText.substring(0, visibleText.length - 1)).width;
				
				//keep cutting text until cutting another letter would make it too small
				while(visibleText.length > 0 && shortTextLength > localX )
				{
					visibleText = visibleText.substring(0, visibleText.length - 1);
					shortTextLength = context.measureText(visibleText.substring(0, visibleText.length - 1)).width;
				}
				
				//found letter that was clicked on... now, 
				//if the cursor is more than halfway across it,
				//go right; otherwise, left.
				var rightDif = context.measureText(visibleText).width - localX;
				var leftDif = context.measureText(visibleText.substring(0, visibleText.length - 1)).width - localX;
				
				//if closer to right, use full substring
				if(Math.abs(rightDif) < Math.abs(leftDif))
				{mouseIndex = this.drawIndex + visibleText.length;}
				//if closer to left, cut last letter off
				else
				{mouseIndex = this.drawIndex + visibleText.length - 1;}
				
				
				if(mouseIndex <= this.cursorIndex)
				{
					this.selectedTextStartIndex =mouseIndex;
				}
				
				if(mouseIndex >= this.cursorIndex)
				{
					this.selectedTextEndIndex = mouseIndex;
				}
				
				//debug
				//this.selectedTextStartIndex= 3;
				//this.selectedTextEndIndex = 5;
				
				this.wakeBlink();
				this.requestRedraw();
			}
			else
			{
			}
		}
	};
	
	this.onmouseup = function(x,y,e)
	{
		this.dragging = false;
	};
	
	this.onkeydown = function(e)
	{
		//Toad: YAAAAHOO!  Here we go!
		var key;
		key = e.which;
		
		//Don't listen if control key is down; user is not talking to you.
		if(e.ctrlKey)
		{
			//prepare for copy/paste/cut
			this.selectedText = this.text.substring(this.selectedTextStartIndex, this.selectedTextEndIndex);
			this.naturalBlur = false;
			this.copyBox.backCanvas = e.currentTarget;
			
			this.copyBox.innerHTML = this.selectedText;		
			this.copyBox.focus();
			this.copyBox.select();
				
			//it's up to you now, copybox!
			
			return;	
		}
		
		
		//number
		if(key >=48 && key <= 60)
		{
			if(e.shiftKey)
			{
				//not a number
				this.lookupAndAdd(key, e);
			}
			else
			{
				this.insertText(String.fromCharCode(key));
			}
		}
		
		//letter
		else if(key >=65 && key <= 90)
		{
			//regular letter
			if(e.shiftKey)
			{
				//capital
				this.insertText(String.fromCharCode(key));
			}
			else
			{
				//lowercase
				this.insertText(String.fromCharCode(key).toLowerCase());
			}
		}
		
		//symbol and special
		else {
			switch(key)
			{
				//space
				case 32: this.insertText(" "); break;
				//backspace; prevent default of "back"
				case 8:  if(!runningExCanvas){e.preventDefault();} if(this.text.length > 0){this.removeAndReverse();}; break;
				//delete
				case 46: if(this.text.length > 0){this.cursorIndex++;this.removeAndReverse();}; break;
				//left arrow
				case 37: this.cursorIndex--; if(this.cursorIndex < 0){this.cursorIndex = 0;}; this.wakeBlink(); break;
				//right arrow
				case 39: this.cursorIndex++; if(this.cursorIndex > this.text.length){this.cursorIndex = this.text.length;}; this.wakeBlink(); break;
				//Home
				case 36: this.cursorIndex = 0; this.drawingMode = 1; this.drawIndex = 0; this.wakeBlink(); break;
				//end
				case 35: this.cursorIndex = this.text.length; this.drawingMode = 2; this.wakeBlink(); break;
				//non-letter or -number key
				default: this.lookupAndAdd(key, e); break;
			}
		}
		this.requestRedraw();
	};
	
	this.focus = function()
	{this.giveCanvasFocus();this.cursorShow = true;this.lastBlink = this.timer.getTime();this.requestRedraw();};
	
	this.blur = function()
	{if(this.naturalBlur){this.selectedTextStartIndex = this.selectedTextEndIndex = -1;}
		this.clearCanvasFocus();this.cursorShow = false;this.requestRedraw();};
	
	this.insertAndAdvance = function(text)
	{
		var preString = this.text.substring(0,this.cursorIndex);
		var postString = this.text.substring(this.cursorIndex, this.text.length);
		this.text = preString + text + postString;
		if(text.length != undefined)
		{
			this.cursorIndex += text.length;
		}
		else{this.cursorIndex++;}
		this.wakeBlink();
	};
	
	this.removeAndReverse = function()
	{
		if(this.cursorIndex == 0){return;}
		
		var preString = this.text.substring(0,this.cursorIndex-1);
		var postString = this.text.substring(this.cursorIndex, this.text.length);
		this.text = preString + postString;
		this.cursorIndex--;
		this.drawIndex--;
		if(this.drawIndex<0){this.drawIndex=0;}
		this.wakeBlink();
	};
	
	this.insertText = function(replacementText)
	{
		if(this.selectedTextEndIndex - this.selectedTextStartIndex > 0)
		{
			var startText = this.text.substring(0,this.selectedTextStartIndex);
			var endText = this.text.substring(this.selectedTextEndIndex);
			this.text = startText+replacementText+endText;
			this.selectedTextStartIndex = -1;
			this.selectedTextEndIndex = -1;
			this.selectedText = "";
			this.cursorIndex = startText.length+replacementText.length;
		}
		else
		{
			this.insertAndAdvance(replacementText);
		}
	};
	
	this.wakeBlink = function()
	{
		this.timer = new Date(); this.lastBlink = this.timer.getTime(); this.cursorShow = true;
	};
	
	this.lookupAndAdd = function(key, e)
	{
		//find code using key and shift
		//preferably using a big table, but for now a few by hand as a proof of concept.
		var charToAdd = "";
		var valid=true;
		var isShifted = e.shiftKey;
		
		switch(key)
		{
			//!
			case 49: if(isShifted){charToAdd = '!';}; break;
			//,
			case 188: if(isShifted){charToADd = '<';}else{charToAdd = ",";}; break;
			//.
			case 190: if(isShifted){charToAdd = '>';}else{charToAdd = '.';}; break;
			//'/'
			case 191: if(isShifted){charToAdd = '?';}else{charToAdd = '/';}; break;
			//'
			case 222: e.preventDefault(); if(isShifted){charToAdd = '"';}else{charToAdd = "'";}; break;
			
			default: valid=false; break;
		}
		
		if(valid){this.insertText(charToAdd);}
	};
	
	
	/*
	*	Copybox functions
	*/
	
	this.copyBox.onfocus = function()
	{
		//next blur may be natural
		this.owner.naturalBlur = true;
		this.owner.focus();	//maintain blinking when control key is down
	};
	
	this.copyBox.onkeydown = function(e)
	{
		var key=0;
		key = e.which;
		
		if(key == 65)
		{
			//select all
			this.owner.keyboardEventOccured = true;
			this.owner.keyboardEventType = "selectAll";
			this.owner.selectAll();
			this.value = this.owner.selectedText;
		}
		
		if(key == 67)
		{
			//copy
			this.owner.keyboardEventOccured = true;
			this.owner.keyboardEventType = "copy";
			this.value = this.owner.selectedText;
		}
		
		if(key == 86)
		{
			//paste
			this.owner.keyboardEventOccured = true;
			this.owner.keyboardEventType = "paste";
		}
		
		if(key == 88)
		{
			//cut
			this.owner.keyboardEventOccured = true;
			this.owner.keyboardEventType = "cut";
			this.value = this.owner.selectedText;
		}
	};
	
	this.copyBox.onkeyup = function(e)
	{
		if(!e.ctrlKey)
		{
			this.backCanvas.focus();
			this.owner.focus();
			this.owner.requestRedraw();
		}
	};
};
torch.lib.textBox.prototype = new torch.lib.baseTorchObject();