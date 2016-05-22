define(['view'], function() {
	var TWO_PI = 2*Math.PI,
	
		CIRCLE_RADIUS = 40,
		PROGRESS_WIDTH = 6,
		MAX_RADIUS = 40,
		MAX_RINGS = 7,
		AVAILABLE_RING_SPACE = 0,
		RING_SEPERATION = 0;
		
	RL.ReportHeaderView = RL.View.extend({
		template: [
			'<div class="header{{#if cicadaFound}} found{{/if}}{{#if smallscreen}} smallscreen{{else}} bigscreen{{/if}}">',
				'{{#if modal}}',
					//'<button class="dismiss-modal"></button>',
					'<span></span>',
				'{{else}}',
					'<button class="back"></button>',
				'{{/if}}',
				'{{#if cicadaFound}}',
					'<div class="canvas"></div>',
					'<div class="insect icon"></div>',
				'{{/if}}',
					'<h1>{{message.h1}}</h1>',
					'<h2>{{message.h2}}</h2>',
			'</div>'
		],
		initialize: function(params) {
			params = params || {};
			
			this.supr(params);
			this.modal = !!params.modal;
			this.show_h2 = !!params.show_h2;
			console.log("HEIGHT: " + window.innerHeight);
			console.log("Do I have a small screen? " + (window.innerHeight <= 450));
		},
		data: function() {
			var data = this.getParentView().data(),
				message = data.message !== undefined && data.message < RL.ReportTypes.length ? RL.ReportTypes[data.message] : RL.ReportTypes[0];
			
			if (this.show_h2 == false) {
				message.h2 = '';
			}
			
			return $.extend({}, data, {
				message: message,
				modal: this.modal,
				smallscreen: (window.innerHeight <= 450)
			})

		},
		initializeCanvas: function() {
			if(!this.data().cicadaFound)
				return;
			
			this.width = this.elem.width();
			this.height = this.elem.height();
		
			this.centerX = this.width * 0.5;
			this.centerY = (parseInt(this.elem.find('.header').css('padding-top'), 10) - (2*CIRCLE_RADIUS))/2 + CIRCLE_RADIUS;//this.height * 0.5;
		
			this.canvas = $('<canvas/>').attr('width', this.width).attr('height', this.height);
			this.ctx = this.canvas.get(0).getContext('2d');
		
			this.circleCanvas = $('<canvas/>').attr('width', this.width).attr('height', this.height);
			this.circleCtx = this.circleCanvas.get(0).getContext('2d');
		
			this.offset = 0;
		
			// Work out how large each ring of the visualisation can be
			MAX_RADIUS = Math.max(this.width * 0.5, this.height-this.centerY);
		
			AVAILABLE_RING_SPACE = MAX_RADIUS - CIRCLE_RADIUS - PROGRESS_WIDTH;
			RING_SEPERATION = AVAILABLE_RING_SPACE / MAX_RINGS;
		
			var scaleFactor = window.devicePixelRatio;
			
			// iPhone4 can't handle drawing at retina scale
			if(scaleFactor && !(RL.device.is.iPhone4() || RL.device.is.iPod4G())) {				
				this.canvas.attr('width', this.width*scaleFactor).attr('height', this.height*scaleFactor).css({ width: this.width+'px', height: this.height+'px' });
				this.ctx.scale(scaleFactor, scaleFactor);
			
				this.circleCanvas.attr('width', this.width*scaleFactor).attr('height', this.height*scaleFactor).css({ width: this.width+'px', height: this.height+'px' });
				this.circleCtx.scale(scaleFactor, scaleFactor);
			}
		
			this.drawCircle();

			// Put the canvas onto the dom
			this.elem.find('.canvas').html(this.canvas).append(this.circleCanvas);
		},
		drawCircle: function() {
			this.circleCtx.clearRect(0, 0, this.width, this.height);
		
			// Setup the cicada indicator gradient - Alex added this
			var radgrad = this.circleCtx.createRadialGradient(this.centerX,this.centerY,0,this.centerX,this.centerY,CIRCLE_RADIUS*1.5);
			radgrad.addColorStop(0, '#E9B262');
			radgrad.addColorStop(0.6, '#943B41');
			radgrad.addColorStop(1, 'rgba(148, 59, 65, 0)');
			this.circleCtx.fillStyle = radgrad;

			// Draw the center circle
			this.circleCtx.beginPath();
			this.circleCtx.arc(this.centerX, this.centerY, CIRCLE_RADIUS, 0, TWO_PI);
			this.circleCtx.fill();

			// Position/size the icon
			var insect = this.surface().find('.insect.icon');
		
			insect.css({
				margin: (this.centerY-CIRCLE_RADIUS)+'px auto 0',
				width: (CIRCLE_RADIUS*2)+'px',
				height: (CIRCLE_RADIUS*2)+'px',
				position: 'absolute',
				left: 0,
				right: 0,
				top: 0,
				'z-index': 1
			});
		
			// Draw the border round the circle
			this.circleCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
			this.circleCtx.beginPath();
			this.circleCtx.lineWidth = 5;
			this.circleCtx.arc(this.centerX, this.centerY, CIRCLE_RADIUS+(PROGRESS_WIDTH*0.5), 0, TWO_PI);
			this.circleCtx.stroke();
		},
		didAppear: function() {
			this.supr();
		
			this.initializeCanvas();
			
			this.startDrawing();
		},
		didDisappear: function() {
			this.stopDrawing();
		},
		startDrawing: function() {
			if(this.drawing || !this.data().cicadaFound)
				return;

			if(this.rAF)
				window.cancelAnimationFrame(this.rAF);
			
			this.drawing = true;
			this.lastPulse = this.lastPulse || 0;
			//this.reset();
			this.tick();
		},
		stopDrawing: function() {
			this.drawing = false;
		
			if(this.rAF)
				window.cancelAnimationFrame(this.rAF);
		},
		drawRings: function() {
			this.ctx.clearRect(0, 0, this.width, this.height);
		
			this.ctx.lineWidth = 2;
		
			var radius = ratio = null;
		
			for(var i=0; i < MAX_RINGS; i++) {
				radius = ((i * RING_SEPERATION) + this.offset) %  AVAILABLE_RING_SPACE;
				radius += CIRCLE_RADIUS + PROGRESS_WIDTH;
				ratio = 1 - (radius / MAX_RADIUS);
			
				this.ctx.strokeStyle = 'rgba(0, 0, 0, '+(0.15*ratio)+')';
				this.ctx.beginPath();
				this.ctx.arc(this.centerX, this.centerY, radius, 0, TWO_PI);
				this.ctx.stroke();
			}
		},
		tick: function() {
			if(this.drawing) {				
				var _this = this,
					now = +new Date;
			
				this.offset += 0.1;

				this.drawRings();

				// Queue up the next frame
				this.rAF = window.requestAnimationFrame(function() {
					_this.tick();
				});
			}
		}
	});
});