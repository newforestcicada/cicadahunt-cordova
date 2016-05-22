define(['view', 'scrollview', 'reportheaderview', 'sonogram'], function() {
	
		
	Handlebars.registerHelper('if_gt', function(context, options) {
		if (context > options.hash.compare)
			return options.fn(this);
		return options.inverse(this);
	});
		
	RL.ReportView = RL.View.extend({
		type: 'reportview',
		stretchY: true,
		title: 'Survey Result',
		
		initialize: function(params) {
			params = params || {};
			
			var loaded = params.loaded || function() {};
			
			this._data = params.data;

			this.headerView = new RL.ReportHeaderView({
				modal: false,
				show_h2: false
			});
			
			this.listView = new RL.ReportListView();
			
			var scrollViewSubs = [this.listView],
				cicada = RL.util.getInsectFromData(RL.INSECTS.kCICADA, this._data.insects);
			
			if(!cicada || !cicada.found) {
				scrollViewSubs.push(new RL.View({template: '', classes: 'recording-warning'}));
			}
			
			if(this._data.sonogram)
				scrollViewSubs.unshift(new RL.SonogramView({sonogram: this._data.sonogram, loaded: loaded}));
			
			params.subViews = [
				this.headerView,
				new RL.ScrollView({subViews: scrollViewSubs})
			];
			
			this.supr(params);
			
			if(!this._data.sonogram) {
				// Must be async
				setTimeout(function() {
					loaded();
				}, 10);
			}
		},
		_destroy: function() {
			// Stop listening for api updates			
			$(window).off('api:sent', this._apiSentHander);
		},
		setupListeners: function() {
			var _this = this;
			
			this.elem.delegate('.dismiss-modal', 'touchstart', function(event) {
				event.preventDefault();
				window.app.dismissModalView();
			});
			
			this.elem.delegate('.back', 'touchend', function(event) {
				event.preventDefault();
				_this.navView.popView();
			});
			
			// Listen for when the API updates

			this._apiSentHander = function() {
				var reports = window.app.data.getReports();			
				$(reports).each(function(i, d) {
					if(d.id ===_this._data.id){
						_this._data.status = d.status;
						_this.subViews[1].render();
					}
				});			
			};
			
			$(window).on('api:sent', this._apiSentHander);
		}
	});
	
	
	
	RL.ReportListView = RL.ListView.extend({
		template: [
			'<div class="list-cell">',
				'<div class="label">{{label}}</div>',
				'<div class="value">{{value}}</div>',
			'</div>'
		],
		grouped: true,
		cls: 'report-details',
		getGroupHeader: function(group) {
			return false;
		},
		getGroupCount: function() {
			return 1;
		},
		getRowCountForGroup: function(group) {
			return this.data().length;
		},
		getDataForRowAndGroup: function(index, group) {
			return this.data()[index];
		},
		rowCanBeSelected: function(index, group) {
			return false;
		},
		data: function() {
			var d = this.getParentView().getParentView()._data;
			var out = [];
			
			var status = 'Waiting to upload';
			
			if(d.status === RL.REPORTSTATUS.kDATASENT) {
				if (d.filepath) {
 					if (d.keep_recording) {
						status = 'Awaiting recording upload';
					} else {
						status = 'Sent to server';
					}
				} else {
					status = 'Sent to server';
				}
			} else if(d.status === RL.REPORTSTATUS.kDATAANDPAYLOADSENT) {
				status = 'Sent to server';
			}
			
			// If we've not found a cicada then add a row for the user selected insect
			for(var i=0; i<d.insects.length; i++) {
				var insect = d.insects[i];
				if(insect.user_selected) {
					out.push({label: 'Insect', value: insect.name});
				}
			}
			
			out.push({label: 'Status', value: status});
			out.push({label: 'Date', value: moment.unix(d.timestamp).format('DD/MM/YY @ h:mmA')});
			out.push({label: 'Recording', value: (d.keep_recording ? 'Saved for analysis' : 'Not saved' )});
			if (d.lat && d.lng) {
				out.push({label: 'Location', value: d.lat.toFixed(4) + ", " + d.lng.toFixed(4)});
			}
			
			return out;
			
		}
	});
});