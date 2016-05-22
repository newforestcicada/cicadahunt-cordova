// Define a namespace
window.RL = {
	_cordovaReadyFired: false
};

if(window.PhoneGap || window.Cordova || window.cordova) {
	document.addEventListener("deviceready", function () {
	    if(window.app) {
			window.app.ready();
		}
		else {
			RL._cordovaReadyFired = true;
			console.log('Cordova is ready but window.app is not yet defined');
		}
	}, false);
}

// Helper function for an alert dialog that works in both the browser and native cordova code
RL.alert = function(message, alertCallback, title, buttonName) {
	if(navigator.notification && navigator.notification.alert)
		navigator.notification.alert(message, alertCallback, title, buttonName);
	else {
		alert(message);
		
		if(alertCallback)
			alertCallback();
	}
};

// Helper function for an confirm dialog that works in both the browser and native cordova code
RL.confirm = function(message, confirmCallback, title, buttonLabels) {
	if(navigator.notification && navigator.notification.confirm)
		navigator.notification.confirm(message, confirmCallback, title, buttonLabels);
	else {
		var response = confirm(message);
		
		if(confirmCallback)
			confirmCallback(response == true ? 1 : 2); // Mimic the Cordova implementation
	}
};

// We can remove this block when we go live - just to help with dev (cache busting)
if(/iOS/.test(window.navigator.userAgent)) {
	require.config({
	    urlArgs: "bust=" + (new Date()).getTime()
	});
}

// Define the strings and views used for different types of reports
RL.ReportTypes = [
	{
		h1: 'No Cicada Detected',
		h2: "Recording will not be saved",
		view: 'SurveyEndNothingDetectedView'
	},
	{
		h1: 'Sounds Interesting',
		h2: "Upload the recording for analysis",
		view: 'SurveyEndInsectDetectedView'
	},
	{
		h1: 'Possible Cicada Detected',
		h2: "Upload the recording for analysis",
		view: 'SurveyEndCicadaDetectedView'
	}
];

require(['tabview', 'navview', 'infoview', 'scrollview', 'surveyview', 'data', 'reportslistview', 'api'], function() {
	var app = klass({
		initialize: function() {
			console.log('app.intialize');
			this.elem = $('<div/>').addClass('app');

			$('body').append(this.elem);
			
			this.infoView = new RL.InfoView({title: 'Information'});
			this.reportsView = new RL.ReportsView({ title: 'Reports' });
			
			this.view = new RL.TabView({
				subViews: [
					new RL.SurveyView({ title: 'Survey' }),
					new RL.NavView({ 
						classes: 'info', title: 'Info', rootView: new RL.ScrollView({ subViews: [this.infoView] })
					}),
					new RL.NavView({ 
						classes: 'reports', title: 'Reports', rootView: this.reportsView
					})
				],
				tabBarPosition: $.os.android ? RL.kTABS_AT_TOP : RL.kTABS_AT_BOTTOM
			});
			
			this.data = new RL.DataStore();
			this.api = new RL.API();
		},
		ready: function() {
			console.log('app.ready()');
			
			var _this = this;
			
			// Listen for backbutton presses
			document.addEventListener("backbutton", function(event) {
				console.log('Back button pressed');
				_this.handleBackButton(event);
			}, true);
			
			document.addEventListener("pause", function(event) {
				_this.view.didDisappear();
			}, false);
			
			document.addEventListener("resume", function(event) {
				_this.view.didAppear();
			}, false);
			
			$(window).on('data:changed', function() {
				var count = _this.data.getUnsentReports().length;
				console.log('Update app badge count ('+count+')');
				CicadaDetector.setApplicationIconBadgeNumber(count);
			});
			
			if(window.device)
				$('html').addClass(device.platform.toLowerCase());
			
			this.render();
			
			if(navigator.splashscreen) {
				setTimeout(function() {
					navigator.splashscreen.hide();
				}, 800);
			}
			
			var success = function(position) {
				console.log('Initial GPS location on app launch ' + position.coords.latitude + ',' + position.coords.longitude + ' with accuracy ' + position.coords.accuracy + ' at timestamp ' + position.timestamp);
			};

			var error = function(error) {
				console.log('GPS Failed');
				if(error && error.code) {
					switch(error.code) {
						case error.TIMEOUT:
							console.error('Geo: Timeout');
							break;
						case error.POSITION_UNAVAILABLE:
							console.error('Geo: Position unavailable');
							break;
						case error.PERMISSION_DENIED:
							console.error('Geo: Permission denied');
							break;
						case error.UNKNOWN_ERROR:
							console.error('Geo: Unknown error');
							break;
					}
				}
			};


			if(navigator.geolocation) {
				setTimeout(function() {
					navigator.geolocation.getCurrentPosition(success, error, {
						enableHighAccuracy: true,
						maximumAge: 0,
						timeout: 25000
					});
				}, 50);
			}

			if(window.CicadaDetector)
				window.CicadaDetector.initialiseDetector();
			
			setTimeout(function() {
				_this.api.sendToServer();
			}, 10000);
		},
		render: function() {
			console.log('app.render()');
			this.elem.append(this.view.render());
			
			var _this = this;
			
			setTimeout(function() {
				_this.view.didAppear();
			}, 100);
		},
		showModalView: function(view, callback) {
			callback = callback || function() {};
			
			view.setModal();
			
			var s = view.render(),
				modal = $('<div/>').addClass('modal transition-from-below transition').append(s);
						
			this.elem.append(modal);
			view.didAppear();
			this.view.didDisappear();
			
			this.modalView = view;
			
			var end = function(event) {
				modal.unbind('webkitTransitionEnd', end);
				
				callback();
			};
			
			modal.bind('webkitTransitionEnd', end);
			
			setTimeout(function() {
				modal.removeClass('transition-from-below');
			}, 50);
		},
		dismissModalView: function() {
			if(this.modalView) {
				var _this = this,
					s = _this.modalView.surface().closest('.modal');
					
				var end = function(event) {
					s.unbind('webkitTransitionEnd', end);
					
					s.remove();
					_this.modalView.setModal(false);
					_this.modalView.didDisappear()
					_this.modalView.destroy();
					_this.view.didAppear();
				};
				
				s.bind('webkitTransitionEnd', end);
				
				setTimeout(function(){
					s.addClass('transition-from-below');
				}, 50);
			}
		},
		handleBackButton: function(event) {
			var backButtonHandled = this.view.handleBackButton();
			
			if(!backButtonHandled && this.modalView) {
				backButtonHandled = this.modalView.handleBackButton();
				
				if(!backButtonHandled) {
					this.dismissModalView();
					backButtonHandled = true;
				}
			}
			
			if(!backButtonHandled) {
				console.log('Back button not handled');
				
				if(navigator.app && navigator.app.exitApp)
					navigator.app.exitApp();
			}
			else
				event.preventDefault();
		}
	});
	
	window.app = new app();
	
	if((!window.PhoneGap && !window.Cordova && !window.cordova) || RL._cordovaReadyFired) {
		$(function() {
			window.app.ready();
		});
	};
});