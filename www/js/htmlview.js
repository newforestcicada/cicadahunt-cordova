define(['scrollview', 'media'], function() {
	RL.HTMLView = RL.ScrollView.extend({
		cls: 'html',
		initialize: function(params) {
			params = params || {};
			
			this.supr(params);
			this.filename = params.filename;
			
			var _this = this;

			this.html = null;
			this._loaded = false;
			this._loadedSuccessful = false;
			this._loadedCallbacks = [];
			
			this._media = [];
			
			var win = function(content) {
				// On iOS the Ajax request succeeds but returns an empty string if the file doesn't exist
				if(content == "") {
					fail();
					return;
				}
				
				var body = content.match(/<body>[\s\S]*<\/body>/)[0];
				
				_this.html = _this.processHTML(body);
				
				_this._loadedSuccessful = true;
				_this._loaded = true;
				
				$(_this._loadedCallbacks).each(function(i, fn) {
					fn(_this._loadedSuccessful);
				});
			};
			
			var fail = function() {
				_this._loadedSuccessful = false;
				_this._loaded = true;
				
				$(_this._loadedCallbacks).each(function(i, fn) {
					fn(_this._loadedSuccessful);
				});
			};
			
			// Load the file via AJAX
			$.ajax({
				url: 'html/'+this.filename+'.html',
				success: win,
				error: fail,
				dataType: 'html'
			});
		},
		processHTML: function(html) {
			var _this = this;
			
			// Make sure all references to media still work
			html = html.replace(/"media\/(.*?)"/gm, '"html/media/$1"');

			// Turn into a Zepto object
			html = $('<div>'+html+'</div>');
			
			// Ensure all links open in the default browser
			html.find('a').each(function(i, a) {
				a = $(a);
				
				if(!a.attr('href').match(/^mailto/))
					a.attr('target', '_blank');
			});
			
			// If we have images then updated iScroll once they've loaded
			var images = html.find('img');
			
			if(images.length) {
				var loaded = 0;
				
				images.each(function(i, img) {
					var image = new Image();
					image.onload = function() {
						loaded++;
						
						if(loaded >= images.length) {
							_this.refresh();
						}
					}
					
					image.src = $(img).attr('src');
				});
			}
			
			
			// Wrap videos with a play button (iOS HTML5 Video workaround)
			if(/iOS|iPhone|iPad/.test(window.navigator.userAgent)) {
				html.find('video').wrap('<div class="video-container"></div>');
				html.find('.video-container').append('<button class="play"></button>');
				
				this.surface().delegate('.video-container .play', 'click', function(event) {
					var target = $(this),
						video = target.closest('.video-container').find('video').get(0);
			
					video.play();
				});
			}
			
			// Cordova 2.3 changed how links are handled - we need to tell both platforms to load in external browsers
			this.surface().delegate('a[target="_blank"]', 'click', function(event) {
				event.preventDefault();
				if(navigator.app)
					navigator.app.loadUrl($(event.target).attr('href'), {openExternal: true});
				else
					window.open($(event.target).attr('href'), '_system');
			});
			
			return html;
		},
		didAppear: function() {
			this.supr();
			
			this._media.length = 0;
			
			var _this = this;
			
			this.surface().find('audio:not(.processed)').each(function(i, a) {
				if(RL.Media && window.device) {
					// Use native PhoneGap call where possible
					var am = new RL.Media.Audio(a);
					_this._media.push(am);
				}
				else {
					_this._media.push(a);
				}
				
				$(a).addClass('processed');
			});
			
			// Center the play buttons
			this.surface().find('.video-container').each(function(i, elem) {
				elem = $(elem);
				var height = elem.find('video').height(),
					button = elem.find('.play'),
					buttonHeight = button.height();
					
				button.css('top', ((height - buttonHeight) / 2) + 'px');
			});
		},
		didDisappear: function() {
			this.supr();
			
			$(this._media).each(function(i, a) {
				if(a.stop) {
					// Our custom PhoneGap powered object has a stop button
					a.stop();
				}
				else {
					// Native HTML5 has no stop() function (wtf?)
					try {
						a.pause();
						a.currentTime = 0;
					}
					catch(e) {
						console.log(e);
					}
				}
			});
		},
		render: function() {
			this.elem.append(this.html);
			return this.wrapper;
		}, 
		loaded: function(callback) {
			callback = callback || function() {};
			
			if(this._loaded)
				callback(_this._loadedSuccessful);
			else
				this._loadedCallbacks.push(callback);
		}
	});
});