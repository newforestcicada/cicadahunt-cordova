define(['visualisationview', 'surveyendview', 'insectnotificationview', 'loadingview'], function() {
	
	RL.INSECTS = {
		kCICADA: 0,
		kFIELDGRASSHOPPER: 1,
		kDARKBUSHCRICKET: 2,
		kROESELSBUSHCRICKET: 3,
		kWOODCRICKET: 4
	};
	
	RL.SurveyView = RL.View.extend({
		type: 'survey',
		cls: 'survey',
		stretchY: true,
		startSurveyMessage: 'Tap the cicada to start survey',
		initialize: function(params) {
			params = params || {};

			this._data = {
				updateFrequency: Math.round(1000 / 10), // ms
				surveying: false,
				surveyDuration: 30000,
				surveyStart: null,
				surveyCompletion: 0,
				surveyLastSample: null,
				surveySecondsRemaining: null,
				freq: [],
				message: 0,
				labelVisible: false,
				cicada: 0	// The probability of a cicada
			}
			
			this.overlay = new RL.View({
				template: [
					'<div class="title">'+this.startSurveyMessage+'</div>'
				]
			});
			
			this.canvas = new RL.VisualisationView({
				data: this.data()
			});
			
			params.subViews = [this.overlay, this.canvas, this.notifications]
			
			this.supr(params);
			this.surface().css('position', 'relative');
		},
		startUpdateLoop: function() {
			if(this.updating)
				return;
			
			this.updating = true;
			
			if(this.timeout)	
				window.cancelAnimationFrame(this.timeout);
			
			var _this = this;
			
			setTimeout(function() {
				_this.updateTick();
			}, 60);
		},
		stopUpdateLoop: function() {
			this.updating = false;
			
			if(this.timeout)	
				window.cancelAnimationFrame(this.timeout);
		},
		updateTick: function() {
			var d = this.data()
				_this = this,
				t = +new Date;
			
			// Throttle the update requests	
			if(t - d.surveyLastSample >= d.updateFrequency) {
				this.updateData();
				d.surveyLastSample = t;
			}
			
			if(this.updating) {
				this.timeout = window.requestAnimationFrame(function() {
					_this.updateTick();
				});				
			}
		},
		updateData: function() {
			var d = this.data()
				_this = this,
				t = +new Date,
				delta = t - d.surveyStart,
				remaining = Math.ceil((d.surveyDuration - delta) / 1000);
			
			if(d.surveying) {
				d.surveyCompletion = delta / d.surveyDuration;
				
				// Update the counter
				if(remaining != d.surveySecondsRemaining) {
					if (remaining <= 0) {
						this.elem.find('.title').html('Analysing...');
					} else {
						this.elem.find('.title').html('Surveying – ' + remaining + ' sec remaining');
					}
					d.surveySecondsRemaining = remaining;
				}
				
				// Make enough getFrequencies request for the time elapsed since last update
				for(var i=0; i < Math.ceil(delta/d.updateFrequency) - d.freq.length; i++) {			
					// Get a new set of freq data
					CicadaDetector.getFrequencies(function(data) {
						//console.log(JSON.stringify(data));
						d.freq.push(data);
					});
					
					CicadaDetector.getCicada(function(confidence) {
						d.cicada = confidence;
					});
				}

				// Check if we've completed the survey
				if(d.surveyCompletion > 1) {
					d.surveyCompletion = 1;
					d.surveying = false;
					
					// Check that we've drawn a full circle
					var segments = Math.ceil(d.surveyDuration/d.updateFrequency);
					
					for(var i = d.freq.length; i < segments; i++) {
						CicadaDetector.getFrequencies(function(data) {
							d.freq.push(data);
						});
					}
					
					// Handle the end of the survey
					setTimeout(function() {
						_this.surveyCompleted();
					}, 50);
				}
			}
			else if(d.listening && !CicadaDetector.isShim) {
				// We're in a waiting state before surveying has begun
				CicadaDetector.getFrequencies(function(data) {
					d.freq.push(data);					
					if(d.freq.length > 1)
						d.freq.shift();
				});
				
				// Update the cicada likelyhood				
				CicadaDetector.getCicada(function(confidence) {
					d.cicada = confidence;
					
				});
			}
		},
		reset: function() {
			var d = this.data();
			d.surveying = false;
			d.freq.length = 0;
			d.surveyLastSample = 0;
			d.cicada = 0;
			d.surveyCompletion = 0;
			d.surveySecondsRemaining = d.surveyDuration / 1000;
			
			this.canvas.reset();
			this.elem.find('.title').removeClass('countdown').html(this.startSurveyMessage);
		},
		checkAndStartSurvey: function() {
			var d = this.data()
				_this = this;

			if (d.surveying) {
				return;
			}

			var callBack = function(button) {
				if ( button == 2 ) {
					_this.startSurvey();
				}
			}

			if ( window.app.data.getReports().length == 0 ) {
				var message = "This will record 30 seconds of sound from your phone's microphone. You can stop this recording at any time by selecting another tab at the bottom of the screen. Once the survey is complete, you can choose to upload or delete the recording.";
				if(window.device.platform == 'iOS' && window.orientation != 180) {
					message = message + " For best results, hold your phone upside down so that the microphone is pointing up.";
				}
				RL.confirm(message, callBack, "Start Survey", "Cancel,OK");
			} else {
				_this.startSurvey();
			}
		},
		startSurvey: function() {				
			var d = this.data()
				_this = this;

			var success = function(position) {
				console.log('Update GPS location for survey ' + position.coords.latitude + ',' + position.coords.longitude + ' with accuracy ' + position.coords.accuracy + ' at timestamp ' + position.timestamp);
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

			setTimeout(function() {
				navigator.geolocation.getCurrentPosition(success, error, {
					enableHighAccuracy: true,
					maximumAge: 0,
					timeout: 25000
				});
			}, 50);

			setTimeout(function() {
				window.CicadaDetector.startSurvey();
				
				d.listening = false;
				_this.reset();
				d.surveying = true;
				
				d.surveyStart = +new Date;
				_this.canvas.startDrawing();
				_this.elem.find('.title').addClass('countdown').html('Surveying – ' + d.surveySecondsRemaining + ' sec remaining');
			}, 50);
		
			this.canvas.stopDrawing();
		},
		surveyCompleted: function() {

			console.log('Completed survey duration: '+(+new Date - this.data().surveyStart)+'ms');
			
			var _this = this;

			var survey = {
				timestamp: (+new Date)/1000
			};
			
			var processSurvey = function(s) {

				console.log('Survey::processSurvey()');
				
				var processData = function(data) {

					//var loading = new RL.LoadingView(),
					//	startTime = +new Date();
						
					//loading.setLabel('Processing');
					//loading.show();
					
					window.app.data.addReport(data, function() {

						//var timeElapsed = (+new Date()) - startTime,
						//	delay = timeElapsed < 4000 ? 4000 : 0;
							
						//setTimeout(function() {
						//	loading.dismiss();
							
							_this.elem.find('.title').css('opacity', 0.0);
							data.labelVisible = false;
							
							// The addReport method is async
							var loaded = function() {
								window.app.showModalView(v, function() {
									_this.reset();
								});
							};

							var v = new RL.SurveyEndView({
								data: data,
								loaded: loaded
							});
						//}, delay);
						
						
					});
				}
				
				if(s.keep_recording) {
					// Get the file path for the recording, then process
					console.log('CicadaDetector.writeRecording');
					
					var win = function(path) {
						console.log("Filepath: "+path);
						s.filepath = path;
						
						processData(s);
					};
					
					var fail = function(path) {
						console.log('error in writeRecording');
						processData(s);
					}
					
					CicadaDetector.writeRecording(win, fail, parseInt(_this.data().surveyDuration/1000, 10));
				}
				else
					processData(s);	// Process straight away
				
			};
			
			var w = screen.width;
			
			if(window.devicePixelRatio)
				w = w * window.devicePixelRatio;
			
			// Image size should have aspect ration of 4:1
			CicadaDetector.stopSurvey(w, w/4, function(data) {	
				console.log('stopSurvey() callback');
				survey = $.extend({}, survey, data);
				_this.data().message = data.message;		
				processSurvey(survey);
			});
		},
		didAppear: function() {
			// We need about 60px for the top message section so if there is not space automatically we should force this
			var w = this.elem.width(),
				h = this.elem.height();
				
			var topSpace = (h - w) / 2;
			
			if(topSpace < 60)
				this.overlay.surface().height(60);
			
			this.supr();
			
			var _this = this,
				d = this.data();
			
			d.labelVisible = false;
			d.listening = true;
			d.surveying = false;
			_this.elem.find('.title').css('opacity', 0.0);
			this.reset();

			CicadaDetector.startDetector(function() {
				_this.startUpdateLoop();
			});

		},
		didDisappear: function() {
			this.supr();
			
			var d = this.data();

			var _this = this;
			
			var stopD = function() {
				CicadaDetector.stopDetector();
				var message = _this.data().message;
				if (message == 1) {
					navigator.notification.vibrate(1000);
					_this.data().message = 0;
				} else if (message == 2) {
					navigator.notification.vibrate(2000);
					_this.data().message = 0;
				}
			};
			
			if (d.surveying) {
			
				d.surveying = false;
				d.listening = true;
				this.reset();
				
				CicadaDetector.stopSurvey(null, null, stopD);
			
			} else {

				stopD();

			}
				
			this.stopUpdateLoop();
		}
	});
});