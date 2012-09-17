/*
 *
 * ARRAY
 *
 */
function ConstantArray2d(sx, sy, val) {
    var rv = new Array(sx);
    for (var i=0; i<sx; i++) rv[i] = ConstantArray(sy, val);
    return rv;
}

function ConstantArray(len, val) {
    var rv = new Array(len);
    while (--len >= 0) {
        rv[len] = val;
    }
    return rv;
}

Array.prototype.writeIndices = function( n ) {
    for( var i = 0; i < (n || this.length); ++i ) this[i] = i;
    return this;
};

// Flatten taken from
// http://tech.karbassi.com/2009/12/17/pure-javascript-flatten-array/
Array.prototype.flatten = function flatten(){
   var flat = [];
   for (var i = 0, l = this.length; i < l; i++){
       var type = Object.prototype.toString.call(this[i]).split(' ').pop().split(']').shift().toLowerCase();
       if (type) { flat = flat.concat(/^(array|collection|arguments|object)$/.test(type) ? flatten.call(this[i]) : this[i]); }
   }
   return flat;
};

Array.prototype.sample = function ( n ) {
    var arr = shuffle(this);
    return arr.slice(0,n);
};


Array.prototype.query = function ( property ) {
    var ans = [];
    for(var i=0; i<this.length; i++) { ans.push( this[i][property] ) };
    return ans;
};


function range(N) {
    return [].writeIndices(N);
}

function sample_range (N, r) {
    var arr = [].writeIndices(N);
    newarr = shuffle(arr);
    return newarr.slice(0,r);
};

function randrange ( lower, upperbound ) {
	// Finds a random integer from 'lower' to 'upperbound-1'
	return Math.floor( Math.random() * upperbound + lower );
}

function randarray (N) {
    var arr = [];
    for (var i=0; i<N; i++) {
        arr.push( Math.random() );
    };
    return arr;
}

function ascending (a,b) { return a-b };

function descending (a,b) { return b-a };



/*
 *
 * CANVAS 
 *
 */
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x+r, y);
  this.arcTo(x+w, y,   x+w, y+h, r);
  this.arcTo(x+w, y+h, x,   y+h, r);
  this.arcTo(x,   y+h, x,   y,   r);
  this.arcTo(x,   y,   x+w, y,   r);
  this.closePath();
  return this;
}



/*
 *
 * TIMING
 *
 */
function pause(ms) {
ms += new Date().getTime();
while (new Date() < ms){}
} 



/*
 *
 * FORMS
 *
 */
function insert_hidden_into_form(findex, name, value ) {
    var form = document.forms[findex];
    var hiddenField = document.createElement('input');
    hiddenField.setAttribute('type', 'hidden');
    hiddenField.setAttribute('name', name);
    hiddenField.setAttribute('value', value );
    form.appendChild( hiddenField );
}

// Assert functions stolen from 
// http://aymanh.com/9-javascript-tips-you-may-not-know#assertion
function AssertException(message) { this.message = message; }
AssertException.prototype.toString = function () {
	return 'AssertException: ' + this.message;
};

function assert(exp, message) {
	if (!exp) {
	  throw new AssertException(message);
	}
}

// Fisher-Yates shuffle algorithm.
// modified from http://sedition.com/perl/javascript-fy.html
function shuffle( arr, exceptions ) {
	var i;
	exceptions = exceptions || [];
	var shufflelocations = new Array();
	for (i=0; i<arr.length; i++) {
	    if (exceptions.indexOf(i)==-1) { shufflelocations.push(i); }
	}
	for (i=shufflelocations.length-1; i>=0; --i) {
		var loci = shufflelocations[i];
		var locj = shufflelocations[randrange(0, i+1)];
		var tempi = arr[loci];
		var tempj = arr[locj];
		arr[loci] = tempj;
		arr[locj] = tempi;
	}
	return arr;
}

// Preload images
function imagepreload(src) 
{
    var heavyImage = new Image(); 
    heavyImage.src = src;
    return heavyImage;
}

/** 
 * SUBSTITUTE PLACEHOLDERS WITH string values 
 * @param {String} str The string containing the placeholders 
 * @param {Array} arr The array of values to substitute 
 * From Fotiman on this forum:
 * http://www.webmasterworld.com/javascript/3484761.htm
 */ 
function substitute(str, arr) { 
	var i, pattern, re, n = arr.length; 
	for (i = 0; i < n; i++) { 
		pattern = "\\{" + i + "\\}"; 
		re = new RegExp(pattern, "g"); 
		str = str.replace(re, arr[i]); 
	} 
	return str; 
}; 


function mousePos( el, event ) {
    // find the mouse position relative to an element
    var x = event.pageX - el.offsetLeft;
    var y = event.pageY - el.offsetTop;
    return [x, y];
};




/*
 *
 * DATA HANDLING
 *
 */
var starttime,
    outputprefix,
    datastring = "";

function settimestamp() { starttime = new Date().getTime(); };

function trialtime (timestamp) { return (new Date().getTime()) - timestamp };

function setoutputprefix( arr ) { outputprefix = arr.join(' '); };

function output( data ) {
    var t = trialtime(starttime);
    var str;
    
    // if data is a string, just add to data file with outputprefix prepended
    if (typeof data === "string") {
        str = [outputprefix,data,t].join(' ');
    };
    // if data is an array, join into a string
    if (typeof data === "object") {
        str = [outputprefix,data.join(' '),t].join(' ');
    };
   
    if (LOGGING) { console.log(str) };
    datastring += str + "\n";
};

function log( s ) { console.log(s) };



/*
 *
 * HTML templates and variables
 *
 */
function fillVariables() {
    $('.var').each( function(index, el) {
        var d = eval(el.innerHTML);
        if (typeof d == "number") {
            el.innerHTML = d;
        } else if (typeof d =="string") {
            el.innerHTML = d;
        } else {
            el.innerHTML="";
            el.appendChild(d);   
        };
    });
};

var PAGENAMES = [];
var PAGES = {};
var showpage = function(pagename) {
    $('body').html( PAGES[pagename] );
    fillVariables();
};




/*
 *
 * EXPERIMENT 
 *
 */
var startTask = function (alertmsg) {
	$.ajax("inexp", {
			type: "POST",
			async: true,
			data: {subjId: subjid}
	});

	// Provide opt-out 
	window.onbeforeunload = function(){
    	$.ajax("quitter", {
    			type: "POST",
    			async: false,
    			data: {subjId: subjid, dataString: datastring}
    	});
                log( "trying to leave" );
		alert( alertmsg );
		return "Are you sure you want to leave the experiment?";
	};
};

var finishTask = function () {
	window.onbeforeunload = function(){ };
};


function dollar_str( num ) {
    return '$'+String(num.toFixed(2))
};

