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
				this.values[key]=null;
				return true;
			}
		}
		
		//could not find or remove
		return false;
	};
}