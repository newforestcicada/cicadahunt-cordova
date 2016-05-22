define(['view', 'tabbar'], function() {
	RL.kTABS_AT_TOP = 100;
	RL.kTABS_AT_BOTTOM = 101;
	
	RL.TabView = RL.View.extend({
		type: 'tabview',
		stretchY: true,
		
		initialize: function(params) {
			params = params || {};
			
			params.tabBarPosition = params.tabBarPosition || RL.kTABS_AT_BOTTOM;
			
			var _this = this;
			
			this.mainView = new RL.View();
			
			this.mainView.addClass('display stretch-y');
			
			this.tabs = params.subViews;
			
			this.tabBar = new RL.TabBar({
				tabs: this.tabs,
				callback: function(index) {
					_this.showTab(index);
				}
			});
			
			params.subViews = [
				this.mainView
			];
			
			if(params.tabBarPosition == RL.kTABS_AT_BOTTOM)
				params.subViews.push(this.tabBar);
			else
				params.subViews.unshift(this.tabBar);
			
			
			this.supr(params);
			
			this.selectedIndex = undefined;
		},
		currentTab: function() {
			return this.tabs[this.selectedIndex];
		},
		showTab: function(index) {
			if(index >= 0 && index < this.tabs.length) {
				var oldView = this.tabs[this.selectedIndex],
					newView = this.tabs[index];
				
				// Catch a bug where tapping the survey tab whilst recording causes a crash
				if(index == this.selectedIndex) {
					if(oldView && oldView.type == 'survey' && oldView.data().surveying)
						return;
				}
				
				this.mainView.surface().html('');

				if(oldView)	{
					oldView.didDisappear();
				}

				var elem = newView.render();
				this.mainView.surface().append(elem);
				newView.didAppear();

				this.tabBar.selectTab(index);

				this.selectedIndex = index;
				
				// Tell the nav view to go back to the start
				if(newView.type == 'navview' && window.device && window.device.platform == 'Android') {
					newView.popAllViews();
				}
			}
		},
		didAppear: function() {
			//this.supr();
			
			this.showTab(this.selectedIndex !== undefined ? this.selectedIndex : 0);
		},
		didDisappear: function() {
			this.currentTab().didDisappear();
		},
		nextResponder: function() {
			return this.currentTab();
		}
	});
});