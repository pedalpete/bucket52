Memories = new Mongo.Collection("memories");

var b52 = {
	buildMemories: function() {
		this.memories = Memories.find({});
				this.memories.forEach(function(mem){
				if (b52.weeks[mem.week-1].memories.length > 0) {
					b52.weeks[mem.week-1].memories = [];
				}
				b52.weeks[mem.week-1].memories.push(mem);
			});
		return b52.weeks;
	},
	checkValidWeek: function(week) {
		return week === this.currentWeek;
	},
	init: function() {
		this.currentWeek = moment("12-25-1995", "MM-DD-YYYY").week();
		this.weeks = Math.pow(2, 53).toString(2).split('').map((i,j) => {
			return {
				'week': j+1,
				'memories': []
			};
		});
		this.weeks[this.currentWeek].currentWeek = true;
		
	},
	memories: [],
	slideout: {
		state: 'closed'
	}
}; 


if (Meteor.isClient) {
	Template.layout.onRendered(function () {
		var template = this;
		b52.slideout.model = new Slideout({
			'menu': template.$('.slideout-menu').get(0),
			'panel': $('.content').get(0),
			'padding': 256,
			'tolerance': 70
		});
	});
	
	Tracker.autorun(function() {
		if (!Meteor.userId()) {
			//make sure the menu is closed
			b52.slideout.state = 'closed';
			if(!b52.slideout.model) return;
			b52.slideout.model.close();
		}
	});
	b52.init();
	Meteor.subscribe("memories");
	Template.calendar.helpers({
		weeks: function() {
			return b52.buildMemories();
		}
	});
	
	Template.addMemory.events({
		"submit .add-memory": function(evt) {
			var formObj = {
				text: evt.target.text[0].value,
				week: evt.target.text[1].value
			};
			evt.preventDefault();
			//if(!b52.checkValidWeek(formObj.week)) return Router.go('error');
			Meteor.call('addMemory', formObj);
			history.back();
		}
	});
	Template.header.events({
		'click .menu-button': function(evt) {
			if(b52.slideout.state === 'closed'){
				b52.slideout.state = 'open';	
			 	return b52.slideout.model.open();
			}
			b52.slideout.state = 'closed';
			b52.slideout.model.close();
		}
	});
	
	Template.memory.events({
		'click .delete': function(evt) {
			var id = evt.target.attributes.getNamedItem('data-id').value;
			var week = evt.target.attributes.getNamedItem('data-week').value;
			Meteor.call('deleteMemory', id);
			b52.weeks[week-1].memories = b52.weeks[week-1].memories.filter(function(mem){
				return mem.id === id;
			});
			history.back();
		}
	})
}

Meteor.methods({
	addMemory: function(formObj) {
		Memories.insert({
			text: formObj.text,
			createdAt: new Date(),
			week: formObj.week
		});
	},
	deleteMemory: function(id) {
		Memories.remove(id);
	}
});

if (Meteor.isServer) {
  Meteor.startup(function () {
	Meteor.publish("memories", function () {
		return Memories.find({});
	});
  });
}