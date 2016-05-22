define(['zepto-rjs', 'util'], function() {	
	RL.View = klass({
		template: [],
		type: 'view',
		cls: '',
		stretchY: false,
		initialize: function(params) {
			params = params || {};
			
			this.id = RL.util.autoIncrement();
			
			var _this = this;
			
			this._data = params.data || this._data || {};
			this._title = params.title || "";
			this.template = params.template || this.template;
			this.stretchY = params.stretchY || this.stretchY;
			
			if(params.classes)
				this.cls = this.cls + ' ' + params.classes;
				
			this.subViews = [];
			
			$(params.subViews).each(function(i, v) {
				v.setParentView(_this);
				_this.subViews.push(v);
			});
			
			this.compiledTemplate = Handlebars.compile(this.processTemplate(this.template));
			this.elem = $('<div></div>').addClass(this.type+' '+this.cls).addClass('view view-'+this.id);
			
			if(this.stretchY)
				this.elem.addClass('stretch-y');
			
			this.setupListeners();
		},
		// Function called when a view is no longer needed
		_destroy: function() {
			
		},
		destroy: function() {			
			$(this.subViews).each(function(i, v) {
				v.destroy();
			});
			
			var _this = this;
			
			setTimeout(function() {
				_this._destroy();
			}, 50);
		},
		setModal: function(modal) {
			console.log('View::setModal()');
			modal = modal === undefined ? true : modal;
			
			this._isModal = modal;
		},
		surface: function() {
			return this.elem;
		},
		setupListeners: function() {
			
		},
		setParentView: function(view) {
			this._parentView = view;
		},
		getParentView: function() {
			return this._parentView;
		},
		addClass: function(cls) {
			this.elem.addClass(cls);
		},
		removeClass: function(cls) {
			this.elem.removeClass(cls);
		},
		render: function() {
			this.elem.html('');
			
			if(this.subViews.length) {
				var _this = this;

				$(this.subViews).each(function(i, v) {
					_this.elem.append(v.render());
				});

				return this.elem;
			}
			else {
				return this.elem.append(this.renderTemplate(this.data()));
			}
		}, 
		renderTemplate: function(data) {
			data = data || {};
			return this.compiledTemplate(data);
		},
		processTemplate: function(template) {
			template = template || [];

			if(template instanceof Array)
				return template.join('');
			else
				return template;
		},
		data: function() {
			return this._data || {};
		},
		didAppear: function() {
			$(this.subViews).each(function(i, v) {
				v.didAppear();
			});
		},
		didDisappear: function() {
			$(this.subViews).each(function(i, v) {
				v.didDisappear();
			});
		},
		getTitle: function() {
			return this._title || "";
		},
		nextResponder: function() {
			return this.subViews.length ? this.subViews[0] : false;
		},
		
		/**
		 * Called to give this View the chance to handle the back button event
		 * @returns {Boolean} Did this view use the event
		 */
		
		processBackButton: function() {
			return false;
		},
		
		/**
		 * Propogates the back button event down the View heirachy
		 * @returns {Boolean} If the backbutton has been handled or not
		 */
		
		handleBackButton: function() {
			var nextResponder = this.nextResponder(),
				nextResponderHandledBackButton = false;
			
			if(nextResponder)	
				nextResponderHandledBackButton = nextResponder.handleBackButton();
				
			return nextResponderHandledBackButton || this.processBackButton();
		}
	})
});