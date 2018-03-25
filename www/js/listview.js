define(['view'], function() {
	RL.ListView = RL.View.extend({
		type: 'list',
		template: [
			'<div class="list-cell">{{label}}</div>'
		],
		grouped: false,
		initialize: function(params) {
			params = params || {};
			
			this.supr(params);
			
			this.grouped = params.grouped || this.grouped;
			
			var _this = this;
			
			// Enable functions to be passed in as part of the params
			$(['getRowCountForGroup', 'getGroupCount', 'getDataForRowAndGroup', 'rowSelected', 'rowBuilt', 'getGroupHeader']).each(function(i, f) {
				if(params.f) {
					_this[f] = function() {
						return params.f.apply(_this, arguments);
					};
				}
			});
		},
		render: function() {
			this.elem.html('');
			
			if(this.grouped)
				this.elem.addClass('grouped');
			else
				this.elem.removeClass('grouped');
			
			for(var i=0; i<this.getGroupCount(); i++) {
				var group = $('<div class="group"></div>');

				for(var j=0; j<this.getRowCountForGroup(i); j++) {
					var d = this.getDataForRowAndGroup(j, i);
					var e = $(this.renderTemplate(d));
					this.rowBuilt(e.data('index', j).data('group', i), j, i);
					group.append(e);
				}

				var headerText = this.getGroupHeader(i);
				
				if(headerText)
					this.elem.append('<div class="header">'+headerText+'</div>');
					
				this.elem.append(group);
			}

			return this.elem;
		},
		setupListeners: function() {
			var _this = this;
			
			this.elem.delegate('.list-cell', 'touchstart', function(event) {
				var target = $(this),
					index = target.data('index'),
					group = target.data('group');
				
				if(!_this.rowCanBeSelected(index, group))
					return;
				
				// Listen for movement & prevent action
				var move = function(event) {
					moved = true;
					target.removeClass('selected');
					
					setTimeout(function() {
						//console.log("touch move");
						_this.elem.undelegate('.list-cell', 'touchmove', move);
						_this.elem.undelegate('.list-cell', 'touchend', end);
					}, 100);
					
				};
				
				var end = function(event) {
					target.removeClass('selected');
					
					_this.elem.undelegate('.list-cell', 'touchmove', move);
					_this.elem.undelegate('.list-cell', 'touchend', end);
					
					setTimeout(function() {
						_this.rowSelected(index, group);
					}, 10);
				};
				
				_this.elem.delegate('.list-cell', 'touchmove', move);
				_this.elem.delegate('.list-cell', 'touchend', end);
				
				_this.elem.find('.group').eq(group).find('.list-cell').eq(index).addClass('selected');
			});
		},
		getRowCountForGroup: function(group) {
			return 0;
		},
		getGroupCount: function() {
			return 1;
		},
		getGroupHeader: function(group) {
			return false;
		},
		getDataForRowAndGroup: function(index, group) {
			return {};
		},
		rowSelected: function(index, group) {
			
		},
		rowCanBeSelected: function(index, group) {
			return true;
		},
		rowBuilt: function(cell, index, group) {
			
		}
	});
});