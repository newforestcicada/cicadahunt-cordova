define(['view'], function() {
	RL.LoadingView = RL.View.extend({
		cls: 'loadingview',
		initialize: function(params) {
			this.supr(params);
			this.overlay = $('<div class="overlay"></div>').css({
				position: 'absolute',
				top: '0px',
				left: '0px',
				width: '100%',
				height: '100%'
			});
			this.spinner = $('<div class="spinner"></div>').appendTo(this.overlay);
			this.label = $('<div class="label"></div>').appendTo(this.overlay);
			this.elem.append(this.overlay);
		},

		render: function() {
			return this.elem;
		},

		show: function(view) {
			console.debug('LoadingView::attatchToView()');
			var surface = window.app.elem;
			surface.css({
				position: 'relative'
			});
			
			var thisSurface = this.surface();

			surface.append(thisSurface);
			
			var _this = this;
			
			setTimeout(function() {
				_this.overlay.css('opacity', 1);
				_this.spinner.addClass('grow');
			}, 10)
			
		},

		dismiss: function() {
			this.surface().css('opacity', 0);
			
			var _this = this;
			
			setTimeout(function() {
				_this.surface().remove();
				_this.spinner.removeClass('success failure');
				_this.setLabel('');
			}, 500);
			
		},

		setLabel: function(l) {
			this.label.html(l);
		}
	});
});