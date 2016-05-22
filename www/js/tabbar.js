define(['view'], function() {
	RL.TabBar = RL.View.extend({
		type: 'tabbar',
		initialize: function(params) {
			params = params || {};
			
			this.changeCallback = params.callback || function() {};
			
			this.tabs = params.tabs || {};
			this.supr(params);
		},
		render: function() {
			var elem = this.supr();
			
			$(this.tabs).each(function(i, v) {
				var btn = $('<button/>').html(v.getTitle()).data('index', i).addClass(v.cls).removeClass('view');
				elem.append($('<div/>').append(btn));
			});
			
			// elem.find('div').first().find('button').addClass('selected');
			
			return elem;
		},
		setupListeners: function() {
			var _this = this;
			
			this.elem.delegate('button', 'touchstart', function(event) {
				var target = $(event.target),
					index = target.data('index');
				
				_this.changeCallback(index);
			});
		},
		selectTab: function(index) {
			this.elem.find('.selected').removeClass('selected');
			this.elem.find('div').eq(index).addClass('selected');
			// 
			// this.elem.find('button').each(function(i, b) {
			// 	b.parentNode.style.cssText += ';-webkit-transform:rotateZ(0deg)';
			// 	b.parentNode.offsetHeight;
			// 	b.parentNode.style.cssText += ';-webkit-transform:none';
			// 	
			// 	console.log('HACK!');
			// });
		}
	});
});