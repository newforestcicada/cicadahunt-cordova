define(['view'], function() {
	RL.ScrollView = RL.View.extend({
		type: 'scroll',
		initialize: function(params) {
			params = params || {};
			
			params.title = params.title || ((params.subViews && params.subViews.length) ? params.subViews[0].getTitle() : '');
			
			this.supr(params);
			
			this.wrapper = $(this.elem.get(0)).addClass('scroll stretch-y');
			this.elem = $('<div class="content"></div>').appendTo(this.wrapper);
			
			var _this = this;
			
			if(this.subViews.length) {
				$(this.subViews[0].cls.split(' ')).each(function(i, c) {
					if(c !== '')
						_this.wrapper.addClass(c+'-wrapper');
				});
			}
			
			this.iScrollSetup();
		},
		// setupListeners: function() {
		// 	var _this = this;
		// 	
		// 	this.elem.delegate('button', 'touchend', function(event) {
		// 		var newView = new RL.View({
		// 			title: 'testing 123',
		// 			template: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
		// 		});
		// 		
		// 		_this.navView.pushView(newView);
		// 	});
		// },
		iScrollSetup: function() {
			if(this.scroller)
				this.scroller.destroy();
				
			this.scroller = new iScroll(this.wrapper.get(0), {
				hScroll: false,
				// useTransform: false,
				// onBeforeScrollStart: function (e) {
				// 	var target = e.target;
				// 	while (target.nodeType != 1) target = target.parentNode;
				// 
				// 	if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA' && $(target).attr('contenteditable') == null)
				// 		e.preventDefault();
				// }
			});
		},
		enableScroll: function() {
			this.iScrollSetup()
		},
		disableScroll: function() {
			if(this.scroller)
				this.scroller.destroy();
				
			this.scroller = null;
		},
		didAppear: function() {
			this.supr();
			this.elem.css('min-height', this.wrapper.height());
			this.refresh();
		},
		refresh: function() {
			var _this = this;
			
			setTimeout(function() {
				if(_this.scroller)
					_this.scroller.refresh();
			}, 50);
		},
		render: function() {
			this.supr();
			return this.wrapper;
		},
		surface: function() {
			return this.wrapper;
		}
	});
});