define(['listview'], function() {
	
	var START_AT_TOP = 1.5*Math.PI,
		TWO_PI = 2*Math.PI,
	
		CIRCLE_RADIUS = 50,
		PROGRESS_WIDTH = 6,
		
		LAST_PROGRESS_VALUE = null,
		LAST_CICADA_VALUE = null,
		
		VIS_START_RADIUS = CIRCLE_RADIUS + (PROGRESS_WIDTH * 0.5),
		VIS_LINE_WIDTH = 20,
		VIS_HALF_LINE_WIDTH = VIS_LINE_WIDTH * 0.5,
		LAST_FREQ_INDEX = -1,
		CHORDS_IN_CIRCLE = 1,
		ANGLE_PER_CHORD = null;
	
	RL.VisualisationView = RL.View.extend({
		cls: 'visualisation',
		template: [
			'<div class="canvas"></div>',
			'<div class="insect icon"></div>'
		],
		stretchY: true, 
		count: 0,
		duration: 10, //sec
		initialize: function(params) {
			params = params || {};
			this.supr(params);
			
			CHORDS_IN_CIRCLE = Math.round(params.data.surveyDuration / params.data.updateFrequency);
			ANGLE_PER_CHORD = TWO_PI / CHORDS_IN_CIRCLE;
			
			console.log('CHORDS_IN_CIRCLE: '+ CHORDS_IN_CIRCLE);
			console.log('ANGLE_PER_CHORD: '+ ANGLE_PER_CHORD);
		},
		setupListeners: function() {
			var _this = this;
			
			this.elem.delegate('.canvas', 'touchstart', function(event) {
				//_this.canvas.reset();
				//console.log(event);
				var e = event.originalEvent,
					x = e.touches[0].clientX - _this.offsetX,
					y = e.touches[0].clientY - _this.offsetY;
								
				// Check if the input came from the center circle
				var deltaX = _this.centerX - x,
					deltaY = _this.centerY - y,
					displacement = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
				
				if(Math.abs(displacement) <= CIRCLE_RADIUS) {
					_this.getParentView().checkAndStartSurvey();
				}

			});
		},
		setParentView: function(view) {
			this.supr(view);
			this.dataSource = this.getParentView();
		},
		didAppear: function() {
			this.supr();
			this.stopDrawing();
			this.initializeCanvas();
				
			this.startDrawing();
			console.log('VisualisationView::didAppear()');
		},
		didDisappear: function() {
			this.supr();
			this.stopDrawing();
			console.log('VisualisationView::didDisappear()');
		},
		initializeCanvas: function() {
			this.width = this.elem.width();
			this.height = this.elem.height();
			
			this.centerX = this.width * 0.5;
			this.centerY = this.height * 0.5;
			
			// Work out the relative position of this view to the viewport
			var o = this.elem.offset();
			this.offsetX = o.left;
			this.offsetY = o.top;
			
			this.canvas = $('<canvas/>').attr('width', this.width).attr('height', this.height);
			this.ctx = this.canvas.get(0).getContext('2d');
			
			this.progressCanvas = $('<canvas/>').attr('width', this.width).attr('height', this.height);
			this.progressCtx = this.progressCanvas.get(0).getContext('2d');
			
			this.cicadaCanvas = $('<canvas/>').attr('width', this.width).attr('height', this.height);
			this.cicadaCtx = this.cicadaCanvas.get(0).getContext('2d');
			
			this.visCanvas = $('<canvas/>').attr('width', this.width).attr('height', this.height);
			this.visCtx = this.visCanvas.get(0).getContext('2d');
			
			// Work out how large each ring of the visualisation can be
			var halfWidth = Math.min(this.width, this.height) * 0.5,
				availableSpace = halfWidth - (CIRCLE_RADIUS+PROGRESS_WIDTH+10);
				VIS_LINE_WIDTH = availableSpace / 20;
			
			var scaleFactor = window.devicePixelRatio;
			
			// iPhone 4 can't handle drawing at retina scale
			if(scaleFactor && !(RL.device.is.iPhone4() || RL.device.is.iPod4G())) {
				this.progressCanvas.attr('width', this.width*scaleFactor).attr('height', this.height*scaleFactor).css({ width: this.width+'px', height: this.height+'px' });
				this.progressCtx.scale(scaleFactor, scaleFactor);
				
				this.visCanvas.attr('width', this.width*scaleFactor).attr('height', this.height*scaleFactor).css({ width: this.width+'px', height: this.height+'px' });
				this.visCtx.scale(scaleFactor, scaleFactor);
				
				this.canvas.attr('width', this.width*scaleFactor).attr('height', this.height*scaleFactor).css({ width: this.width+'px', height: this.height+'px' });
				this.ctx.scale(scaleFactor, scaleFactor);
				
				this.cicadaCanvas.attr('width', this.width*scaleFactor).attr('height', this.height*scaleFactor).css({ width: this.width+'px', height: this.height+'px' });
				this.cicadaCtx.scale(scaleFactor, scaleFactor);
			}
			
			// Set initial drawing states
			this.progressCtx.lineWidth = PROGRESS_WIDTH;
			this.progressCtx.strokeStyle = 'rgb(255, 255, 255)';
			
			this.visCtx.lineWidth = VIS_LINE_WIDTH;

			// Put the canvas onto the dom
			this.elem.find('.canvas').html(this.canvas).append(this.progressCanvas).append(this.visCanvas).append(this.cicadaCanvas);
		},
		startDrawing: function() {
			if(this.drawing)
				return;
			
			var _this = this;
			
			setTimeout(function() {
				if(_this.rAF)
					window.cancelAnimationFrame(_this.rAF);
					
				_this.drawing = true;
				_this.reset();
				_this.tick();
			}, 60);	
		},
		stopDrawing: function() {
			this.drawing = false;
			
			if(this.rAF)
				window.cancelAnimationFrame(this.rAF);
		},
		updateProgress: function(data) {			
			// We only need to update the image if something has changed
			if(data.surveyCompletion != LAST_PROGRESS_VALUE) {
				var areaSize = (CIRCLE_RADIUS*2)+PROGRESS_WIDTH+6;

				// Clear only the bit we care about
				this.progressCtx.clearRect((this.width-areaSize)*0.5, (this.height-areaSize)*0.5, areaSize, areaSize);

				// Draw the percentage completed arc
				this.progressCtx.beginPath();
				this.progressCtx.arc(this.centerX, this.centerY, CIRCLE_RADIUS+(PROGRESS_WIDTH*0.5), START_AT_TOP, TWO_PI*data.surveyCompletion + START_AT_TOP);
				this.progressCtx.stroke();

				LAST_PROGRESS_VALUE = data.surveyCompletion;
			}
		},
		updateVisualisation: function(data) {
			var offset = 0,
				startAngle = 0,
				endAngle = 0;
				
			if(data.surveying) {

				if (!data.labelVisible) {
					this.getParentView().elem.find('.title').css('opacity', 1);
					data.labelVisible = true;
				}

				// Draw the freq visualisation
				for(var i=LAST_FREQ_INDEX+1; i<CHORDS_IN_CIRCLE && i<data.freq.length; i++) {
					// Each chord has 20 freq values
					offset = 0;
					startAngle = i * ANGLE_PER_CHORD;
					endAngle = (i+1) * ANGLE_PER_CHORD;

					for(var j=0; j<20; j++) {
						this.visCtx.strokeStyle = 'rgba(255, 255, 255, '+(data.freq[i][j])+')';
						this.visCtx.beginPath();
						this.visCtx.arc(this.centerX, this.centerY, VIS_START_RADIUS + offset + VIS_HALF_LINE_WIDTH, START_AT_TOP + startAngle, START_AT_TOP + endAngle);
						this.visCtx.stroke();

						offset += VIS_LINE_WIDTH;
					}
				}

				LAST_FREQ_INDEX = data.freq.length-1;
			}
			else if(data.listening) {
				// Show that we're listening
				if(data.freq.length < 1)
					return;
				
				var now = +new Date();
				
				if(now - (this.lastListeningDraw || 0) > data.updateFrequency) {

					if (!data.labelVisible) {
						this.getParentView().elem.find('.title').css('opacity', 1);
						data.labelVisible = true;
					}

					this.visCtx.clearRect(0, 0, this.width, this.height);

					for(var j=0; j<20; j++) {
						this.visCtx.strokeStyle = 'rgba(255, 255, 255, '+(data.freq[0][j])+')';
						this.visCtx.beginPath();
						this.visCtx.arc(this.centerX, this.centerY, VIS_START_RADIUS + offset + VIS_HALF_LINE_WIDTH, 0, TWO_PI);
						this.visCtx.stroke();

						offset += VIS_LINE_WIDTH;
					}
					
					this.lastListeningDraw = now;
				}
			}
			
		},
		updateCicada: function(data) {
			if(data.cicada != LAST_CICADA_VALUE) {
				var areaSize = (CIRCLE_RADIUS*2)+PROGRESS_WIDTH+6;

				// Clear only the bit we care about
				this.cicadaCtx.clearRect((this.width-areaSize)*0.5, (this.height-areaSize)*0.5, areaSize, areaSize);

				this.cicadaCtx.globalAlpha = data.cicada;
				this.cicadaCtx.beginPath();
				this.cicadaCtx.arc(this.centerX, this.centerY, CIRCLE_RADIUS, 0, TWO_PI);
				this.cicadaCtx.fill();
				
				LAST_CICADA_VALUE = data.cicada;
			}
		},
		reset: function() {
			LAST_FREQ_INDEX = LAST_CICADA_VALUE = -1;
			LAST_PROGRESS_VALUE = null;
			
			this.visCtx.clearRect(0, 0, this.width, this.height);
			this.ctx.clearRect(0, 0, this.width, this.height);
			this.cicadaCtx.clearRect(0, 0, this.width, this.height);
			this.progressCtx.clearRect(0, 0, this.width, this.height);
			
			// Draw the center circle
			this.ctx.beginPath();
			this.ctx.arc(this.centerX, this.centerY, CIRCLE_RADIUS, 0, TWO_PI);
			this.ctx.fill();
			
			// Position/size the insect icon
			var insect = this.surface().find('.insect.icon');
			insect.css({
				margin: (this.centerY-CIRCLE_RADIUS)+'px auto 0',
				width: (2*CIRCLE_RADIUS)+'px',
				height: (2*CIRCLE_RADIUS)+'px'
			});
			
			// Draw the border round the circle
			this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
			this.ctx.beginPath();
			this.ctx.lineWidth = 5;
			this.ctx.arc(this.centerX, this.centerY, CIRCLE_RADIUS+(PROGRESS_WIDTH*0.5), 0, TWO_PI);
			this.ctx.stroke();
			
			// Setup the cicada indicator
			var radgrad = this.cicadaCtx.createRadialGradient(this.centerX,this.centerY,0,this.centerX,this.centerY,CIRCLE_RADIUS*1.5);
			radgrad.addColorStop(0, '#E9B262');
			radgrad.addColorStop(0.6, '#943B41');
			radgrad.addColorStop(1, 'rgba(148, 59, 65, 0)');
			this.cicadaCtx.fillStyle = radgrad;
		},
		tick: function() {
			if(this.drawing) {				
				var _this = this,
					data = this.dataSource.data();
				
				// Update the Progress Bar
				this.updateProgress(data);
				this.updateVisualisation(data);
				this.updateCicada(data);

				// Queue up the next frame
				this.rAF = window.requestAnimationFrame(function() {
					_this.tick();
				});
			}
		}
	});
});