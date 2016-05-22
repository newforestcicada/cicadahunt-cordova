define(['view', 'scrollview', 'reportheaderview', 'sonogram'], function() {
	RL.SurveyEndView = RL.View.extend({
		type: 'surveyendview',
		stretchY: true,
		title: 'Survey Result',
		cls: 'reportview',
		initialize: function(params) {
			params = params || {};
			
			var loaded = params.loaded || function() {};
			
			this._data = params.data;
			
			this.headerView = new RL.ReportHeaderView({
				modal: true,
				show_h2: true
			});
			
			// Load the correct subview based on the result of the survey
			var message = this._data.message < RL.ReportTypes.length ? this._data.message : 0,
				subViewClass = RL.ReportTypes[message].view;

			var scrollViewSubs = [new RL[subViewClass]()];
			
			// Show the sonogram for the survey
			scrollViewSubs.unshift(new RL.SonogramView({sonogram: this._data.sonogram, loaded: loaded}));
			
			params.subViews = [
				this.headerView,
				new RL.ScrollView({subViews: scrollViewSubs})
			];
			
			this.supr(params);
		},
		setupListeners: function() {
			var _this = this;
			
			this.elem.delegate('.dismiss-modal', 'touchstart', function(event) {
				event.preventDefault();
				window.app.dismissModalView();
			});
		},
		saveAndSubmitReport: function() {
			window.app.data.writeToDisk();
			window.app.dismissModalView();
			window.app.api.sendToServer();
		},
		data: function() {
			var d = $.extend({}, this._data, {
				cicadaFound: false
			});
			
			var cicada = RL.util.getInsectFromData(RL.INSECTS.kCICADA, this._data.insects);
			d.cicadaFound = cicada && cicada.found;
			
			return d;
		}
	});
	
	// There are various options for what to display in the bottom half of this view
	
	RL.SurveyEndNothingDetectedView = RL.View.extend({
		type: 'surveyend-partial',
		cls: 'nothing',
		template: [
			'<div class="divider">Did you know?</div>',
			'<div class="fact"></div>',
			'<div class="buttons">',
				'<button class="button">OK</button>',
			'</div>'
		],
		facts: [
		    "What you see above is called a sonogram or spectrogram. This is a visual representation of sound, and shows how frequencies (on the vertical axis) change over time (on the horizontal axis).",
		    "The cicada was first discovered in the New Forest in 1812.",
		    "The cicada has never been recorded in the New Forest earlier than the 13th of May or later than the 30th of July in any year.",
		    "Adults above the age of 40 often cannot hear the song of the cicada since it is too high pitched (around 14-15kHz).",
		    "The song we hear is the mating call of male individuals. Females only have 200 milliseconds to respond to this call, with a rapid wing click.",
		    "The last confirmed sighting of the cicada in the New Forest was in 1993, but there was one in 2000 which was not confirmed at the time.",
		    "The largest population of cicadas ever observed in the New Forest consisted of over 100 individuals.",
		    "The scientific name of the New Forest cicada is Cicadetta montana. This species is found in several other countries around the world.",
		    "The typical habitat of the New Forest cicada is warm, sunny, south-facing and sheltered slopes.",
		    "Cicadas stop singing when the wind blows, when the sun goes behind a cloud, and when they detect danger.",
		    "Young adults and children can hear the cicada from over 60m away.",
		    "The cicada lives underground as a nymph for 7-8 year, before emerging, turning into an adult, mating and finally dying, all in less than 6 weeks.",
		    "The cicada is an insect of the order Hemiptera, and not of the order Orthoptera as many people think. This means that it is more closely related to a bed bug than to a cricket or a grasshopper.",
		    "The cicada often flies up into the canopy. It is from there that you are likely to hear it singing."
		],
		setupListeners: function() {
			var _this = this;
			
			this.elem.delegate('.buttons button', 'touchstart', function() {
				var target = $(this).addClass('active');
				
				_this.elem.delegate('.buttons button', 'touchmove', function() {
					target.removeClass('active');
					_this.elem.undelegate('.buttons button', 'touchmove');
				});

			});
			
			this.elem.delegate('.buttons button', 'touchend', function() {
				if(!$(this).is('.active'))
					return;

				_this.getParentView().getParentView().saveAndSubmitReport();
			});
		},
		_destroy: function() {
			this.elem.undelegate('.buttons button', 'touchstart');
			this.elem.undelegate('.buttons button', 'touchend');
		},
		render: function() {
			var ret = this.supr();
			var count = window.app.data.getReports().length;
			var randomIndex = 0;
			if ( count > 1 ) {
				randomIndex = Math.floor(Math.random()*this.facts.length);
			}
			ret.find('.fact').html(this.facts[randomIndex]);
			
			return ret;
		}
	});
	
	RL.SurveyEndCicadaDetectedView = RL.View.extend({
		type: 'surveyend-partial',
		cls: 'cicada',
		template: [
			'<div class="divider">The cicada should look like this:</div>',
			'<img class="cicada" src="img/cicada-sonogram.png" />',
			'<div class="buttons">',
				'<button class="button" data-id="delete">Delete Recording</button>',
				'<button class="button" data-id="upload">Upload Recording</button>',
			'</div>'
		],
		setupListeners: function() {
			var _this = this;
			
			this.elem.delegate('.buttons button', 'touchstart', function() {
				var target = $(this).addClass('active');
				
				_this.elem.delegate('.buttons button', 'touchmove', function() {
					target.removeClass('active');
					_this.elem.undelegate('.buttons button', 'touchmove');
				});
			});
			
			this.elem.delegate('.buttons button', 'touchend', function() {
				var data = window.app.data.getReportWithId(_this.getParentView().getParentView().data().id);
				
				if(!$(this).is('.active'))
					return;

				var callBack = function(button) {
					if (button==1) {
						data.keep_recording = false;
						_this.getParentView().getParentView().saveAndSubmitReport();
					}
				};
					
				if($(this).data('id') == 'delete') {
					RL.confirm("Are you sure you want to delete the recording rather than uploading it for further analysis?", callBack, "Delete Recording", "Delete,Cancel");
				}	

				if($(this).data('id') == 'upload') {
					_this.getParentView().getParentView().saveAndSubmitReport();
				}
					
			});
		},
		_destroy: function() {
			this.elem.undelegate('.buttons button', 'touchstart');
			this.elem.undelegate('.buttons button', 'touchend');
		}
		
	});
	
	RL.SurveyEndInsectDetectedView = RL.View.extend({
		type: 'surveyend-partial',
		cls: 'insect',
		template: [
			'<div class="divider">We think it could be one of these:</div>',
			'<ul class="insects">',
				'{{#possible_insects}}',
					'<li data-id="{{insect}}">',
						'{{#if name}}',
							'<span class="sonogram"><img src="img/insect-sonogram-id-{{insect}}.png" /></span>',
							'<span class="title">{{name}}</span>',
						'{{/if}}',
					'</li>',
				'{{/possible_insects}}',
			'</ul>',
			'<div class="buttons">',
				'<button class="button" data-id="delete">Delete Recording</button>',
				'<button class="button" data-id="upload">Upload Recording</button>',
			'</div>'
		],
		setupListeners: function() {
			var _this = this;
			
			this.elem.delegate('ul.insects li', 'touchstart', function(event) {
				var target = $(event.target).closest('ul.insects li');
				
				if(target.data('id') == undefined)
					return;
				
				target.addClass('pressed');

				_this.elem.delegate('ul.insects li', 'touchmove', function() {
					target.removeClass('pressed');
					_this.elem.undelegate('ul.insects li', 'touchmove');
				});
			});
			
			this.elem.delegate('ul.insects li', 'touchend', function(event) {
				var target = $(event.target).closest('ul.insects li');
				
				_this.elem.undelegate('ul.insects li', 'touchmove');
				
				if(target.is('.pressed')) {
					_this.elem.find('ul.insects li').removeClass('selected').removeClass('pressed');
					target.addClass('selected');					
				}
			});
			
			this.elem.delegate('.buttons button', 'touchstart', function() {
				var target = $(this).addClass('active');
				
				_this.elem.delegate('.buttons button', 'touchmove', function() {
					target.removeClass('active');
					_this.elem.undelegate('.buttons button', 'touchmove');
				});
			});
			
			this.elem.delegate('.buttons button', 'touchend', function() {
				// Get a copy of the raw untouched data for this report
				var data = window.app.data.getReportWithId(_this.data().id),
					selectedInsectId = _this.elem.find('li.selected').data('id');
				
				if(!$(this).is('.active'))
					return;
				
				$(this).removeClass('active');
				
				if(selectedInsectId === undefined) {
					RL.alert('Please select an insect that best matches your recording.', function(){}, 'Almost Done', 'OK');
					return;
				}
				
				// Find the selected insect
				$(data.insects).each(function(i, insect) {
					if(insect.insect == selectedInsectId)
						insect.user_selected = true;
				});

				var callBack = function(button) {
					if (button==1) {
						data.keep_recording = false;
						_this.getParentView().getParentView().saveAndSubmitReport();
					}
				};
					
				if($(this).data('id') == 'delete') {
					RL.confirm("Are you sure you want to delete the recording rather than uploading it for further analysis.", callBack, "Delete Recording", "Delete,Cancel");
				}	

				if($(this).data('id') == 'upload') {
					_this.getParentView().getParentView().saveAndSubmitReport();
				}

					
			});
		},
		render: function() {
			var ret = this.supr();
			
			// If we have images then updated iScroll once they've loaded
			var _this = this,
				images = ret.find('img');
			
			if(images.length) {
				var loaded = 0;
				
				images.each(function(i, img) {
					var image = new Image();
					image.onload = function() {
						loaded++;
						
						if(loaded >= images.length) {
							_this.getParentView().refresh();
						}
					}
					
					image.src = $(img).attr('src');
				});
			}
			
			return ret;
		},
		_destroy: function() {
			this.elem.undelegate('ul.insects li', 'touchstart');
			this.elem.undelegate('ul.insects li', 'touchend');
			
			this.elem.undelegate('.buttons button', 'touchstart');
			this.elem.undelegate('.buttons button', 'touchend');
		},
		data: function() {
			var d = this.getParentView().getParentView().data();
			
			d.possible_insects = [];
			
			$(d.insects).each(function(i, insect) {
				if(true || insect.insect != RL.INSECTS.kCICADA) {
					d.possible_insects.push(insect);
				}
			});
			
			if(d.possible_insects.length < 4) {
				while(d.possible_insects.length < 4) {
					//d.possible_insects.push(d.insects[d.insects.length-1]);
					d.possible_insects.push({});
				}
			}
			
			// Limit the array to 4
			d.possible_insects.length = 4;
			
			return d;
		},
		didAppear: function() {
			this.supr();
			
			var _this = this;
			
			setTimeout(function() {
				_this.getParentView().refresh();
			}, 50);
		}
	});
});