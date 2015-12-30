Memories = new Mongo.Collection("memories");

var b52 = {
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
	memories: []
}; 

if (Meteor.isClient) {
	b52.init();

	Template.calendar.helpers({
		weeks: function() {
			b52.memories = Memories.find({});
				b52.memories.forEach(function(mem){
				if (b52.weeks[mem.week].memories.length > 0) {
					b52.weeks[mem.week].memories = [];
				}
				b52.weeks[mem.week].memories.push(mem);
			});
			return b52.weeks;
		}
	});
	
	Template.addMemory.events({
		"submit .add-memory": function(evt) {
			var formObj = {
				text: evt.target.text[0].value,
				week: evt.target.text[1].value
			};
			evt.preventDefault();
			if(!b52.checkValidWeek(formObj.week)) return Router.go('error');
			Meteor.call('addMemory', formObj);
			history.back();
		}
	});
}

Meteor.methods({
	addMemory: function(formObj) {
		Memories.insert({
			text: formObj.text,
			createdAt: new Date(),
			week: formObj.week
		});
	}
});

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

