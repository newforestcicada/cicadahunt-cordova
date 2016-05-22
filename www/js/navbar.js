define(['view', 'navbar'], function() {
	RL.NavBar = RL.View.extend({
		type: 'navbar',
		initialize: function(params) {
			params = params || {};
			
			// var _this = this;
			// 
			// this.mainView = new RL.View();
			// 
			// this.mainView.addClass('display stretch-y');
			// 
			// this.navBar = new RL.NavBar({
			// });
			// 
			// params.subViews = [
			// 	this.mainView,
			// 	this.navBar
			// ]
			
			params.subViews = this.buildSubViews(params.view, params.showBack);
			
			this.backCallback = params.backCallback || function() {};
			
			this.supr(params);
		},
		setupListeners: function() {
			var _this = this;
			
			this.elem.delegate('.left', 'touchend', function(event) {
				_this.backCallback();
			});
		},
		buildSubViews: function(view, showBack) {
			var leftParams = {};
			
			if(showBack) {
				leftParams.template = '<button>Back</button>';
			}
			
			var left = new RL.View(leftParams);
			var right = new RL.View();
			
			var title = new RL.View({
				template: [
					'<span>',
						view.getTitle(),
					'</span>'
				]
			});
			
			left.addClass('left');
			right.addClass('right');
			title.addClass('title');
			
			
			
			return [left, title, right];
		}
	});
});