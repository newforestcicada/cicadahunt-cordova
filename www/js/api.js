define(['data'], function() {
	RL.API = klass({
		url: 'http://api.newforestcicada.info',
		initialize: function() {
			this.setupListeners();
		},
		setupListeners: function() {
			var _this = this;

			document.addEventListener("resume", function() {
				_this.sendToServer();
			}, false);
			
			document.addEventListener("online", function() {
				_this.sendToServer();
			}, false);
		},
		sendToServer: function() {
			var _this = this;
			
			setTimeout(function() {
				if(_this.sendingInProgress) {
					console.log('sendToServer Cancelled - sendingInProgress = true;');
					return;
				}
			
				_this.sendingInProgress = true;

				$(window).trigger('api:startUpload');
			
				var queue = window.app.data.getUnsentReports();
				
				_this.allQueueItemsSuccessful = true;
			
				_this.processQueue(queue, function(success) {
					if(success) {
						console.log('All items in queue were sent.');
					} else {
						console.log('One or more of the items in the queue failed to send.');
					}	
					$(window).trigger('api:stopUpload');			
					_this.sendingInProgress = false;				
				});
			}, 300);
		},
		processQueue: function(q, complete) {
			complete = complete || function() {};
			
			if(q.length == 0) {
				complete(this.allQueueItemsSuccessful);
				return;
			}
				
			var report = q.shift(),
				_this = this;
			
			this.processReport(report, function(success) {
				
				_this.allQueueItemsSuccessful &= success;

				_this.processQueue(q, complete);
			});
		},
		processReport: function(r, complete) {

			complete = complete || function() {};
			
			var _this = this;
			
			if(r.status === RL.REPORTSTATUS.kDATASENT && r.filepath) {

				console.log('Sending report audio file');
				
				if (r.keep_recording == false) {

					r.status = RL.REPORTSTATUS.kDATAANDPAYLOADSENT;

					window.app.data.writeToDisk();
					$(window).trigger('api:sent');

					window.app.data.removeAudioFileForReport(r);

					complete(true);

				} else if(window.FileTransfer && window.FileUploadOptions) {

					var win = function(data) {
						r.status = RL.REPORTSTATUS.kDATAANDPAYLOADSENT;

						window.app.data.writeToDisk();
						$(window).trigger('api:sent');
						
						window.app.data.removeAudioFileForReport(r);
						
						complete(true);
					};
					
					var fail = function(error) {
						console.log('Report audio failed to send to the server (report id: '+r.id+')');
						complete(false);
					};

					var options = new FileUploadOptions()
					
					options.fileKey = 'audio_file';
					options.fileName = r.filepath.substr(r.filepath.lastIndexOf('/')+1)
					options.mimeType = 'audio/wav';
					
					options.params = {
						observation: r.guid
					};
					
					options.headers = {};
					options.headers['Accept'] = 'application/json';
					
					var ft = new FileTransfer();
					ft.upload(r.filepath, encodeURI(_this.url+'/upload/'), win, fail, options);
				
				} else {
					console.log('Something bad happened in api.js - this should never happen.');
					complete(false);
				}

			} else if(r.status === RL.REPORTSTATUS.kNOTSENT || r.status === undefined) {
				
				var win = function(data) {
					r.status = RL.REPORTSTATUS.kDATASENT;
					
					r.guid = data.guid;
					r.serialised_sonogram = '';

					console.log(r);

					window.app.data.writeToDisk();
					$(window).trigger('api:sent');

					_this.processReport(r, complete);
				};
				
				var fail = function(xhr, errorType, error) {
					console.log('Report JSON failed to send to the server (report id: '+r.id+')');
					console.log(xhr);
					console.log(errorType);
					console.log(error);
					complete(false);
				};
				
				var data = {
					id: r.id,
					recording_timestamp: moment.unix(r.timestamp).format(), // ISO 8601
					device: window.device ? window.device : {},
					device_uuid: window.device ? window.device.uuid : null,
					insect_detected: r.insects,
				};
				this.getBase64Image(r, function() {
					data.serialised_sonogram = r.serialised_sonogram;
					var params = { 'lat': 'latitude', 'lng': 'longitude', 'gpsAccuracy': 'loc_accuracy'};
				
					for(var key in params) {
						if(r[key])
							data[params[key]] = r[key];
					}

					$.ajax({
						url: _this.url+'/observations/',
						type: 'POST',
						data: JSON.stringify(data),
						processData: false, // don't serialize the data as we've done that ourselves
						contentType: 'application/json',
						dataType: 'json',
						success: win,
						error: fail
					});	
				});
				
			} else {
				complete(true);
			}
		},
		sendReport: function (data, win, fail) {
			$.ajax({
				url: _this.url+'/observations/',
				type: 'POST',
				data: JSON.stringify(data),
				processData: false, // don't serialize the data as we've done that ourselves
				contentType: 'application/json',
				dataType: 'json',
				success: win,
				error: fail
			});

		},
		getBase64Image: function (r, callback) {
			var img = new Image();
			img.src = r.sonogram;

			img.onload = function() {
				// Create an empty canvas element
				var canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
			    
				// Copy the image contents to the canvas
				var ctx = canvas.getContext("2d");
				ctx.drawImage(img, 0, 0);
			    
				r.serialised_sonogram = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "");
				callback();
			}
		},
	});
});