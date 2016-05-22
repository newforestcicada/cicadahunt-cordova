define(['listview', 'reportview'], function() {
	RL.ReportsView = RL.View.extend({
		cls: 'prev-reports',
		title: 'Reports',
		initialize: function(params) {
			params = params || {};
			
			params.subViews = [
				new RL.ReportsListSummaryView({ title: 'Reports' }),
				new RL.ScrollView({ subViews: [ new RL.ReportsListView({ title: 'Reports' }) ]})
			];
	
			this.supr(params);
		},
		setupListeners: function() {
			var _this = this;

			_this.uploading = false;

			this._apiSentHander = function() {
				console.log('api:sent - lets update the view');
				_this.didAppear();
			};

			this._apiStartUploadHander = function() {
				_this.uploading = true;
				_this.render();
			};

			this._apiStopUploadHander = function() {
				_this.uploading = false;
				_this.render();
			};

			$(window).on('api:sent', _this._apiSentHander);
			$(window).on('api:startUpload', _this._apiStartUploadHander);
			$(window).on('api:stopUpload', _this._apiStopUploadHander);
		},
		_destroy: function() {
			$(window).off('api:sent', this._apiSentHander);
			$(window).off('api:startUpload', this._apiStartUploadHander);
			$(window).off('api:stopUpload', this._apiStopUploadHander);
		},
		getNumberOfReports: function() {
			return window.app.data.getReports().length;
		},
		getNumberOfUploadedReports: function() {
			var reports = window.app.data.getReports(),
				uploaded = 0;
			$(reports).each(function(i, d) {
				if((d.status === RL.REPORTSTATUS.kDATASENT && !d.filepath) || d.status === RL.REPORTSTATUS.kDATAANDPAYLOADSENT) {
					uploaded++;
				}
			});
			return uploaded;			
		},
	});
	
	RL.ReportsListSummaryView = RL.View.extend({
		cls: 'prev-reports-summary',
		title: 'Reports',
		template: [
			'<div>{{text}}</div>'
		],
		data: function() {

			var numberOfReports = this.getParentView().getNumberOfReports();
			var numberOfUploadedReport = this.getParentView().getNumberOfUploadedReports();

			if( this.getParentView().uploading ) {

				var reportsLeftToUpload = numberOfReports-numberOfUploadedReport;

				if ( reportsLeftToUpload == 1 ) {

					return {
						text: 'UPLOADING REPORT'
					};


				} else {

					return {
						text: 'UPLOADING REPORTS - ' + reportsLeftToUpload + ' TO UPLOAD'
					};

				}

			} else {

				return {
					text: numberOfUploadedReport + ' UPLOADED / ' + numberOfReports + ' REPORTS'
				};

			}

		}
	});
	
	RL.ReportsListView = RL.ListView.extend({
		cls: 'reports',
		title: 'Reports',
		stretchY: true,
		template: [
			'<div class="list-cell">',
				'<div class="date">{{dateString}}</div>',
				'<div class="insects">{{insectsString}}</div>',
			'</div>'
		],
		render: function() {
			var ret = this.supr();
			
			if(this.getRowCountForGroup(1) == 0)
				ret.addClass('empty');
			else
				ret.removeClass('empty');
			
			return ret;
		},
		rowSelected: function(index) {
			var _this = this, v;
			
			var	r = this.getDataForRowAndGroup(index),
				loaded = function() {
					// We may need to load the sonogram image asynchronously
					_this.getParentView().getParentView().navView.pushView(v);
				};
				
			v = new RL.ReportView({
				data: r,
				loaded: loaded
			});
		},
		didAppear: function() {
			console.log('ReportsListView.didAppear()');
			this.supr();
			
			this._data = window.app.data.getReports();
			
			this._data.sort(function(a, b) {
				return a.timestamp < b.timestamp ? 1 : -1;
			});
			
			this.render();
			
			var _this = this;
			
			setTimeout(function() {
				var p = _this.getParentView();
				
				if(p.type != 'scroll')
					p = null;
				
				if(_this.elem.hasClass('empty')) {
					_this.elem.height(_this.elem.closest('.content').height());
					
					if(p)
						p.disableScroll();
				}
				else {
					_this.elem.height('auto');
					
					if(p)
						p.enableScroll();
				}
			}, 50);
			
		},
		getRowCountForGroup: function(group) {
			return this._data.length;
		},
		getDataForRowAndGroup: function(index, group) {

			var d = $.extend({}, this._data[index]);

			switch(d.message) {
				case 0:
					d.insectsString = 'No Cicada Detected';
					break;
				case 1:
					d.insectsString = 'Sounds Interesting';
					break;
				case 2:
					d.insectsString = 'Possible Cicada Detected';
					break;
			}

			d.dateString = moment.unix(d.timestamp).format('DD/MM/YY @ h:mmA');
			
			return d;
		},
		rowBuilt: function(cell, index, group) {
			cell.addClass('right-arrow');
			
			var d = this.getDataForRowAndGroup(index, group);
			
			// Check if the data has been sent to the server or not
			if( (d.status === RL.REPORTSTATUS.kDATASENT && d.filepath) || (d.status === RL.REPORTSTATUS.kNOTSENT || d.status === undefined) )
				cell.addClass('not-sent-to-server');
		}
	});
});