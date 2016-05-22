define(['view', 'navbar'], function() {
	RL.NavView = RL.View.extend({
		type: 'navview',
		stretchY: true,
		initialize: function(params) {
			params = params || {};
			
			this.stack = [];
			
			if(!params.rootView)
				console.error("NavView expects a 'rootView' param");
			
			this.stack.push(this.wrapView(params.rootView));
			
			params.subViews = [
				this.stack[0]
			];
			
			this.supr(params);
		},
		currentView: function() {
			return this.stack[this.stack.length-1];
		},
		render: function() {
			return this.elem.html('').append(this.currentView().render());
		},
		didAppear: function() {
			var v = this.stack[this.stack.length-1];
			
			v.didAppear();
		},
		didDisappear: function() {
			var v = this.stack[this.stack.length-1];
			
			v.didDisappear();
		},
		wrapView: function(view, showBack) {
			showBack = !!showBack; // Turn into a boolean
			
			var _this = this;
			
			var navBar = new RL.NavBar({
				view: view,
				showBack: showBack,
				backCallback: function() {
					_this.popView();
				}
			});
			
			view.addClass('stretch-y');
			view.navView = this;
			
			var output = new RL.View({
				subViews: [navBar, view]
			});
			
			output.addClass('stretch-y container transition');
			
			var terms = view.cls.split(' ');
			terms = terms.concat(view.type.split(' '));
			
			output.addClass('container-'+terms.join(' container-'));
			
			return output;
		},
		pushView: function(view) {
			if(this.animating)
				return;
			
			this.animating = true;
				
			var wrapped = this.wrapView(view, true);
			
			var oldView = this.stack[this.stack.length-1],
				oldElem = oldView.surface();
			
			this.stack.push(wrapped);
			
			var elem = wrapped.render();
			elem.addClass('transition-from-right');
			
			var _this = this;
			
			setTimeout(function() {
				_this.elem.append(elem);
				view.didAppear();

				var transitionEnd = function(event) {
					oldElem.unbind('webkitTransitionEnd').remove().removeClass('transition-left');
					_this.animating = false;
					oldView.didDisappear();
				};

				oldElem.bind('webkitTransitionEnd', transitionEnd);

				setTimeout(function() {
					elem.removeClass('transition-from-right');
					oldElem.addClass('transition-from-left');
				}, 50);
			}, 50);
		},
		popView: function() {
			if(this.stack.length <= 1)
				return;
				
			if(this.animating)
				return;
			
			this.animating = true;
			
			var oldView = this.stack.pop(),
				oldElem = oldView.surface(),
				view = this.stack[this.stack.length-1],
				elem = view.surface();
				
			elem.addClass('transition-from-left');

			this.elem.append(elem);

			var _this = this;

			var transitionEnd = function(event) {
				oldElem.unbind('webkitTransitionEnd').remove().removeClass('transition-from-right');
				_this.animating = false;
				view.didAppear();
				oldView.didDisappear();
			};

			oldElem.bind('webkitTransitionEnd', transitionEnd);

			setTimeout(function() {
				elem.removeClass('transition-from-left');
				oldElem.addClass('transition-from-right');
			});
		},
		popAllViews: function() {
			if(this.stack.length <= 1)
				return;
				
			if(this.animating)
				return;
			
			this.animating = true;
			
			var oldView = this.stack.pop(),
				oldElem = oldView.surface(),
				view = this.stack[0],
				elem = view.surface();
				
			this.stack.length = 1;
				
			elem.addClass('transition-from-left');

			this.elem.append(elem);

			var _this = this;

			var transitionEnd = function(event) {
				oldElem.unbind('webkitTransitionEnd').remove().removeClass('transition-from-right');
				_this.animating = false;
				view.didAppear();
				oldView.didDisappear();
			};

			oldElem.bind('webkitTransitionEnd', transitionEnd);

			setTimeout(function() {
				elem.removeClass('transition-from-left');
				oldElem.addClass('transition-from-right');
			});
		},
		processBackButton: function() {
			if(this.stack.length > 1) {
				this.popView();
				return true;
			}
			else
				return false;
		}
	});
});