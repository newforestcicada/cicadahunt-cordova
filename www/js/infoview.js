define(['listview', 'htmlview'], function() {
	RL.InfoView = RL.ListView.extend({
		cls: 'info',
		template: [
			'<div class="list-cell">',
				'<span class="title">{{title}}</span>',
				'<span class="sub">{{sub}}</span>',
			'</div>'
		],
		_data: [
			// Group
			{
				title: "The Context",
				rows: [
					{ 
						title: 'The New Forest Cicada', 
						sub: '', 
						filename: device.platform+'_the-nfc' // name of the html file (without the extension)
					},
					{ 
						title: 'The New Forest', 
						sub: '', 
						filename: device.platform+'_the-nf' // name of the html file (without the extension)
					}
				]
			},
			// Group
			{
				title: "The Project and the App",
				rows: [
					{ 
						title: 'Project and Technology', 
						sub: '', 
						filename: device.platform+'_the-app' // name of the html file (without the extension)
					},
					{ 
						title: 'How to Use the App', 
						sub: '', 
						filename: device.platform+'_how-to' // name of the html file (without the extension)
					},
					{ 
						title: 'Quick Tips', 
						sub: '', 
						filename: device.platform+'_quick-tips' // name of the html file (without the extension)
					}
				]
			},
			// Group
			{
				title: "Your Device",
				rows: [
					{
					        title: 'Device ID',
					        sub: device.uuid
				        },
					{
						title: 'Version',
						sub: device.platform == "Android" ? "2.0a1" : "1.1"
					}
				]
			}
		],
		grouped: true,
		getGroupHeader: function(group) {
			return this._data[group].title;
		},
		getGroupCount: function() {
			return this._data.length;
		},
		getRowCountForGroup: function(group) {
			return this._data[group].rows.length;
		},
		getDataForRowAndGroup: function(index, group) {
			return this._data[group].rows[index];
		},
		rowSelected: function(index, group) {
			var d = this.getDataForRowAndGroup(index, group);
			
			if (d.filename){
			        var v = new RL.HTMLView({
				        title: d.title,
				        filename: d.filename,
				        template: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
			        });
			
			        var _this = this;
			
			        v.loaded(function(success) {
				        if(success)
					        _this._parentView.navView.pushView(v);
				        else {
					        RL.alert("Sorry, there was an error loading the content for this item.", null, "Oops");
					        console.error('Failed to load HTML for "'+d.filename+'"');
				        }
			        });
			}
		},
		rowBuilt: function(cell, index, group) {
			var d = this.getDataForRowAndGroup(index, group);
			if (d.filename) {
			    cell.addClass('right-arrow');
		        }
		}
	});
});
