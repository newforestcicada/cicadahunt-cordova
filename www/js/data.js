define(['lib/md5'], function() {
	RL.REPORTSTATUS = {
		kNOTSENT: 0,
		kDATASENT: 1,
		kDATAANDPAYLOADSENT: 2
	};
	
	RL.DataStore = klass({
		initialize: function() {
			this.readFromDisk();
			this._reportLookup = {};
			
			// Listen for when the API has sent to server to trigger a data:changed event
			$(window).on('api:sent', function() {
				$(window).trigger('data:changed');
			});
		},
		readFromDisk: function() {
			var _this = this,
				reports = localStorage.getItem('reports');
			
			this.reports = reports ? JSON.parse(reports) : [];
			
			if(!$.isArray(this.reports))
				this.reports = [];
			
			// Index the reports for quick lookup	
			this._reportLookup = {};
			
			$(this.reports).each(function(i, r) {
				_this._reportLookup[r.id] = i;
			});
		},
		getReportWithId: function(id) {
			var index = this._reportLookup[id];
			
			if(index === undefined)
				return false;
				
			return this.reports[index] || false;
		},
		writeToDisk: function() {
			localStorage.setItem('reports', JSON.stringify(this.reports));
		},
		addReport: function(report, callback) {
			console.log('DataStore::addReport()');
			callback = callback || function() {};
			
			report.timestamp = Math.round((+new Date)/1000);
			report.id = MD5(JSON.stringify(report) + (window.device ? device.uuid : ''));
			report.status = RL.REPORTSTATUS.kNOTSENT;
			
			var _this = this,
				gpsHandled = false;;
			
			//console.log(JSON.stringify(report));
			
			var complete = function(success) {
				gpsHandled = true;
				_this._reportLookup[report.id] = _this.reports.length - 1;
				callback(success, report);
				$(window).trigger('data:changed');
			};
			
			if(navigator.geolocation) {
				console.log('Attempting to add GPS coords to report.');
				
				var timedOut = false,
					timeoutHandle = null;
				
				var success = function(position) {
					if(timedOut || gpsHandled)
						return;
					
					if(timeoutHandle)
						clearTimeout(timeoutHandle);
						
					console.log('GPS Successful ' + position.coords.latitude + ',' + position.coords.longitude + ' with accuracy ' + position.coords.accuracy + ' at timestamp ' + position.timestamp);
					report.lat = position.coords.latitude;
					report.lng = position.coords.longitude;
					report.gpsAccuracy = position.coords.accuracy;
					
					_this.reports.push(report);
					_this.writeToDisk();
					complete(true);
				};

				var error = function(error) {
					if(timedOut || gpsHandled)
						return;
						
					if(timeoutHandle)
						clearTimeout(timeoutHandle);
						
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
					
					_this.reports.push(report);
					_this.writeToDisk();
					complete(false);
				};

				navigator.geolocation.getCurrentPosition(success, error, {
					enableHighAccuracy: true,
					maximumAge: 45000,
					timeout: 2000
				});
			}
			else {
				this.reports.push(report);
				this.writeToDisk();
				callback(true, report);
			}
		},
		getReports: function() {
			return this.reports.slice(0);
		},
		getUnsentReports: function() {
			var data = this.reports.slice(0),
				unsent = [];
				
			$(data).each(function(i, d) {
				if(d.status === RL.REPORTSTATUS.kDATASENT && d.filepath) {
					// JSON sent but audio hasn't
					unsent.push(d);
				}
				else if(d.status === RL.REPORTSTATUS.kNOTSENT || d.status === undefined) {
					// No data sent to server
					unsent.push(d);
				}
			});
			
			return unsent;
		},
		removeAudioFileForReport: function(r) {
			if(window.requestFileSystem) {
				var onGetFileWin = function(file) {
					file.remove();
					console.log('Removed recording for report id: '+r.id+' ('+r.filepath+')');
					
					// Should we set the filepath to null here?
			    }
			
			    var onGetFileFail = function() {
					console.error("Failed to get a handle to file: "+r.filepath);
			    }

			    var onFSWin = function(fileSystem) {
					fileSystem.root.getFile(r.filepath, {create: false, exclusive: false}, onGetFileWin, onGetFileFail);
			    }

			    var onFSFail = function(evt) {
					console.error('Failed to get handle to local file system.');
					console.error(evt.target.error.code);
			    }
				
				window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSWin, onFSFail);
			}
		}
	});
});