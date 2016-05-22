define([], function() {
	if(window.Media) {
		RL.Media = {};

		RL.Media.Audio = klass({
			initialize: function(audio) {
				var _this = this;

				this.loaded = false;
				this.playing = false;

				this.audio = $(audio).css({
					display: 'none',
					visibility: 'hidden'
				});
				var src = window.device && window.device.platform == 'Android' ? '/android_asset/www/' : '';
				
				src += this.audio.find('[type="audio/mpeg"]').attr('src');
				
				console.log(src);

				var win = function() {
					_this.loaded = true;
					a.play();
					button.addClass('playing');
				};

				var fail = function(err) {
					console.error('Audio failed to load: '+src);
				};

				this.media = new Media(src, win, fail);

				this.button = $('<button></button>');
				this.updateLabel();	

				this.audio.before(this.button);

				var lastClick = 0;

				this.button.click(function(event) {
					now = +new Date;
					
					if(now - lastClick <= 500)
						return;
						
					lastClick = now;
					
					console.log('audio clicked');
					
					if(_this.playing) {
						_this.stop();
					}
					else {
						_this.play();
					}
				});
			},
			play: function() {
				this.playing = true;
				this.updateLabel();
				this.media.play();
			},
			stop: function() {
				this.playing = false;
				this.updateLabel();
				this.media.stop();
			},
			updateLabel: function() {
				this.button.html(this.playing ? 'Stop Audio' : 'Play Audio');
				this.button.width(); // Force the element to reflow so the label is definitely updates (iOS bug)
			}
		});
	}
	
})