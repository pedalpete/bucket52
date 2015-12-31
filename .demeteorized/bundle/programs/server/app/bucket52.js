(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// bucket52.js                                                         //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
Memories = new Mongo.Collection("memories");                           // 1
                                                                       //
var b52 = {                                                            // 3
	buildMemories: function () {                                          // 4
		this.memories = Memories.find({ owner: Meteor.userId() });           // 5
		this.memories.forEach(function (mem) {                               // 6
			if (b52.weeks[mem.week - 1].memories.length > 0) {                  // 7
				b52.weeks[mem.week - 1].memories = [];                             // 8
			}                                                                   //
			b52.weeks[mem.week - 1].memories.push(mem);                         // 10
		});                                                                  //
		return b52.weeks;                                                    // 12
	},                                                                    //
	checkValidWeek: function (week) {                                     // 14
		return week === this.currentWeek;                                    // 15
	},                                                                    //
	hasClass: function (className, elem) {                                // 17
		return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
	},                                                                    //
	getWeek: function () {                                                // 20
		var date = new Date();                                               // 21
		date.setHours(0, 0, 0, 0);                                           // 22
		// Thursday in current week decides the year.                        //
		date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);          // 24
		// January 4 is always in week 1.                                    //
		var week1 = new Date(date.getFullYear(), 0, 4);                      // 26
		// Adjust to Thursday in week 1 and count number of weeks from date to week1.
		return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
	},                                                                    //
	init: function () {                                                   // 31
		this.currentWeek = this.getWeek() - 1;                               // 32
		console.log(this.currentWeek);                                       // 33
		this.weeks = Math.pow(2, 52).toString(2).split('').map(function (i, j) {
			return {                                                            // 35
				'week': j + 1,                                                     // 36
				'memories': []                                                     // 37
			};                                                                  //
		});                                                                  //
		this.weeks[this.currentWeek].currentWeek = true;                     // 40
	},                                                                    //
	memories: [],                                                         // 43
	slideout: {                                                           // 44
		state: 'closed'                                                      // 45
	}                                                                     //
};                                                                     //
                                                                       //
if (Meteor.isClient) {                                                 // 50
	Template.layout.onRendered(function () {                              // 51
		var template = this;                                                 // 52
		b52.slideout.model = new Slideout({                                  // 53
			'menu': template.$('.slideout-menu').get(0),                        // 54
			'panel': $('.content').get(0),                                      // 55
			'padding': 256,                                                     // 56
			'tolerance': 70                                                     // 57
		});                                                                  //
	});                                                                   //
                                                                       //
	Tracker.autorun(function () {                                         // 61
		if (!Meteor.userId()) {                                              // 62
			//make sure the menu is closed                                      //
			b52.slideout.state = 'closed';                                      // 64
			if (!b52.slideout.model) return;                                    // 65
			b52.slideout.model.close();                                         // 66
		}                                                                    //
	});                                                                   //
                                                                       //
	b52.init();                                                           // 70
	Meteor.subscribe("memories");                                         // 71
	Template.calendar.helpers({                                           // 72
		weeks: function () {                                                 // 73
			return b52.buildMemories();                                         // 74
		}                                                                    //
	});                                                                   //
                                                                       //
	Template.addMemory.events({                                           // 78
		"submit .add-memory": function (evt) {                               // 79
			var formObj = {                                                     // 80
				text: evt.target.text[0].value,                                    // 81
				week: evt.target.text[1].value                                     // 82
			};                                                                  //
			evt.preventDefault();                                               // 84
			if (!b52.checkValidWeek(formObj.week)) return Router.go('error');   // 85
			Meteor.call('addMemory', formObj);                                  // 86
			history.back();                                                     // 87
		},                                                                   //
		"keyup textarea": function (evt) {                                   // 89
			var button = document.querySelector('.add-memory button');          // 90
			var isVisible = b52.hasClass('show', button);                       // 91
			if (evt.target.value.length > 0 && !isVisible) {                    // 92
				return button.className = 'show';                                  // 93
			}                                                                   //
			if (evt.target.value.length === 0 && isVisible) return button.className = '';
		}                                                                    //
	});                                                                   //
	Template.header.events({                                              // 98
		'click .menu-button': function (evt) {                               // 99
			if (b52.slideout.state === 'closed') {                              // 100
				b52.slideout.state = 'open';                                       // 101
				return b52.slideout.model.open();                                  // 102
			}                                                                   //
			b52.slideout.state = 'closed';                                      // 104
			b52.slideout.model.close();                                         // 105
		}                                                                    //
	});                                                                   //
                                                                       //
	Template.memory.events({                                              // 109
		'click .delete': function (evt) {                                    // 110
			var id = evt.target.attributes.getNamedItem('data-id').value;       // 111
			var week = evt.target.attributes.getNamedItem('data-week').value;   // 112
			Meteor.call('deleteMemory', id);                                    // 113
			b52.weeks[week - 1].memories = b52.weeks[week - 1].memories.filter(function (mem) {
				return mem.id === id;                                              // 115
			});                                                                 //
			history.back();                                                     // 117
		}                                                                    //
	});                                                                   //
}                                                                      //
                                                                       //
Meteor.methods({                                                       // 122
	addMemory: function (formObj) {                                       // 123
		if (!Meteor.userId()) {                                              // 124
			throw new Meteor.Error("not-authorized");                           // 125
		}                                                                    //
		if (formObj.week < 1 || formObj.week > 53) {                         // 127
			throw new Meteor.Error("invalid-week");                             // 128
		}                                                                    //
		Memories.insert({                                                    // 130
			text: formObj.text,                                                 // 131
			createdAt: new Date(),                                              // 132
			week: formObj.week,                                                 // 133
			owner: Meteor.userId()                                              // 134
		});                                                                  //
	},                                                                    //
	deleteMemory: function (id) {                                         // 137
		var mem = Memories.findOne(id);                                      // 138
		if (mem.owner !== Meteor.userId()) {                                 // 139
			throw new Meteor.Error('not authorized');                           // 140
		}                                                                    //
		Memories.remove(id);                                                 // 142
	}                                                                     //
});                                                                    //
                                                                       //
if (Meteor.isServer) {                                                 // 146
	Meteor.startup(function () {                                          // 147
		Meteor.publish("memories", function () {                             // 148
			return Memories.find({ owner: this.userId });                       // 149
		});                                                                  //
	});                                                                   //
}                                                                      //
/////////////////////////////////////////////////////////////////////////

}).call(this);

//# sourceMappingURL=bucket52.js.map
