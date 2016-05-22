// requestAnimation shim by Erik Möller 
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelRequestAnimationFrame = window[vendors[x]+
          'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
		console.log("No native support for requestAnimationFrame, adding a shim");
		
		 window.requestAnimationFrame = function(callback, element) {
	            var currTime = new Date().getTime();
	            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
	            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
	              timeToCall);
	            lastTime = currTime + timeToCall;
	            return id;
	        };
	}
       

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

// JSON Parse polyfill to prevent falling over on null values on some Android implementations
(function(){
	var _parse = JSON.parse;
	
	JSON.parse = function(text){
		if (text != null) {
			return _parse(text);
		} else {
			// no longer crashing on null value but just returning null
			return null;
		}
	}
	
})();

define([], function() {
	var _autoIncrement = 0;
	
	RL.util = {
		autoIncrement: function() {
			return ++_autoIncrement;
		},
		getInsectFromData: function(type, data) {
			var found = false;
			
			$(data).each(function(i, insect) {
				if(insect.insect == type)
					found = insect;
			});
			
			return found;
		}
	};
	
	// Helper functions for device detection
	RL.device = {
		is: {
			android: function() {
				return window.device ? window.device.platform == 'Android' : false;
			},
			iOS: function() {
				return window.device ? window.device.platform == 'iOS' : false;
			},
			iPhone3G: function() {
				return window.device ? window.device.model == 'iPhone1,2' : false;
			},
			iPhone3GS: function() {
				return window.device ? window.device.model == 'iPhone2,1' : false;
			},
			iPhone4: function() {
				return window.device ? window.device.model == 'iPhone3,1' || window.device.model == 'iPhone3,2' || window.device.model == 'iPhone3,3' : false;
			},
			iPhone4S: function() {
				return window.device ? window.device.model == 'iPhone4,1' : false;
			},
			iPhone4S: function() {
				return window.device ? window.device.model == 'iPhone5,1' || window.device.model == 'iPhone5,2' : false;
			},
			iPod3G: function() {
				return window.device ? window.device.model == 'iPod3,1' : false;
			},
			iPod4G: function() {
				return window.device ? window.device.model == 'iPod4,1' : false;
			},
			iPod5G: function() {
				return window.device ? window.device.model == 'iPod5,1' : false;
			}
		}
	};
});