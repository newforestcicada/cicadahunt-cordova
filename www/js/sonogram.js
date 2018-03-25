define(['view', 'scrollview', 'reportheaderview', 'sonogram'], function() {
	RL.SonogramView = RL.View.extend({
		type: 'sonogram',
		template: [
			'<img src="" />'
		],
		initialize: function(params) {
			this.supr(params);
			
			var loaded = params.loaded || function() {};
			
			var imgPath = params.sonogram,
				_this = this;
		
			if(!window.CicadaDetector.isShim) {
				var reader = new FileReader();
			    reader.onloadend = function(evt) {
			        _this.imgSrc = evt.target.result;
					
					// Ensure the callback is async
					setTimeout(function() {
						loaded();
					}, 10);
			    };
			
				window.resolveLocalFileSystemURL("file://"+imgPath,
					// success callback; generates the FileEntry object needed to convert to Base64 string
					function (fileEntry) {
						// convert to Base64 string
						var win = function (file) {
							reader.readAsDataURL(file);
						};
						var fail = function (evt) {
							console.log("error: "+evt);
						};
						fileEntry.file(win, fail);
					},
					// error callback
					function (e) {
						console.log("error: ");
						console.log(e);
					}
				);
				
				
				
				
			}
			else {
				this.imgSrc = imgPath;
				setTimeout(function() {					
					loaded();
				}, 10);
			}
		},
		render: function() {
			var ret = this.supr();
		
			ret.find('img').attr('src', this.imgSrc);
		
			return ret;
		}
	});
});