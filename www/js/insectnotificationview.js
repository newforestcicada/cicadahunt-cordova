define(['view'], function() {
	// Local constant - will not leak into global scope
	var kNOTIFICATION_UPDATE_DELAY = 3000;
	
	RL.InsectNotificationView = RL.View.extend({
		cls: 'notifications',
		notificationTemplate: [
			'<div class="notification">Found: {{title}}</div>'
		],
		initialize: function(params) {
			this.supr(params);
			
			this.compiledNotificationTemplate = Handlebars.compile(this.processTemplate(this.notificationTemplate));
			
			this.currentMessage = false;
			this.nextMessage = false;
		},
		renderNotificationTemplate: function(title) {
			title = title || "";
			return this.compiledNotificationTemplate({title: title});
		},
		enqueueInsect: function(name) {
			this.nextMessage = name;
		},
		didAppear: function() {
			this.supr();
			this.startLoop();
		},
		didDisappear: function() {
			this.supr();
			this.stopLoop();
		},
		startLoop: function() {
			if(this.running)
				return;
			
			this.lastUpdate = +new Date;	
			this.running = true;
			this.tick();
		},
		stopLoop: function() {
			this.running = false;
		},
		tick: function() {
			if(this.running) {				
				var _this = this,
					now = +new Date;
				
				// Check if the correct ammount of time has passed to do an update
				if(now - this.lastUpdate > kNOTIFICATION_UPDATE_DELAY) {
					//console.log('Update Notifications');
					
					if(this.nextMessage != this.currentMessage) {
						var currentNotification = this.surface().find('.notification');
						
						// Change in some way
						if(this.nextMessage) {
							
							// Show new message
							var newNotification = $(this.renderNotificationTemplate(this.nextMessage));
							
							newNotification.addClass('before');
							
							this.surface().append(newNotification);
							
							// Animate
							var transitionEnd = function(event) {
								currentNotification.unbind('webkitTransitionEnd').remove();
							};

							currentNotification.bind('webkitTransitionEnd', transitionEnd);
							
							setTimeout(function() {
								setTimeout(function() {
									newNotification.removeClass('before');
								}, 200);
								
								currentNotification.addClass('after');
							}, 30);
							
							this.currentMessage = this.nextMessage;
							this.nextMessage = false;
						}
						else {
							// Hide notification
							var transitionEnd = function(event) {
								currentNotification.unbind('webkitTransitionEnd').remove();
							};

							currentNotification.bind('webkitTransitionEnd', transitionEnd);
							currentNotification.addClass('after');
							
							this.currentMessage = this.nextMessage = false;
						}
					}
					
					this.lastUpdate = now;
				}
				
				// Queue up the next frame
				window.requestAnimationFrame(function() {
					_this.tick();
				});
			}
		}
	});
});