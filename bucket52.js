Memories = new Mongo.Collection("memories");

var b52 = {
	buildMemories: function() {
		this.memories = Memories.find({owner: Meteor.userId()});
				this.memories.forEach(function(mem){
				if (b52.weeks[mem.week-1].memories.length > 0) {
					b52.weeks[mem.week-1].memories = [];
				}
				b52.weeks[mem.week-1].memories.push(mem);
			});
		return b52.weeks;
	},
	checkValidWeek: function(week) {
		return week == this.currentWeek || week == this.currentWeek - 1;
	},
	calendarBack: new Array(51).join().split('').map(function(a,i){return i}),
	hasClass: function(className, elem) {
		return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
	},
	getWeeks: function() {
		var year = moment().year();
		var date = new Date(year, 0, 1);
		while (date.getDay() != 0) {
			date.setDate(date.getDate() + 1);
		}
		var days = [];
		while (date.getFullYear() == year) {
			var m = date.getMonth() + 1;
			var d = date.getDate();
			days.push({
				week: days.length + 1,
				memories: [],
				date: new Date(date)
			});
			date.setDate(date.getDate() + 7);
		}
		return days;
	},
	init: function() {
		this.weeks = this.getWeeks();
		this.setCurrentWeek();
		this.weeks[this.setCurrentWeek() -1].currentWeek = true;
		if (this.currentWeek > 1) this.weeks[this.currentWeek - 2].previousWeek = true;
	},
	memories: [],
	setCurrentWeek: function(){
		var today = moment();
		var firstDay = moment(this.weeks[0].date);
		this.currentWeek =  new Date().getWeek() + 1;
		return this.currentWeek;
	},
	slideout: { 
		state: 'closed',
		close: function() {
			var slideout = document.body;
			slideout.className = slideout.className.replace('show-sidebar', '');
			b52.slideout.state = 'closed';
		},
		open: function() {
			var slideout = document.body;
			slideout.className = slideout.className += 'show-sidebar';
			b52.slideout.state = 'open';
		}
	}
}; 


if (Meteor.isClient) {
	Template.layout.onRendered(function () {
		var template = this;
		window.addEventListener('onhashchange', b52.slideout.close);
	});
	
	b52.init();
	Meteor.subscribe("memories");
	Template.calendarBack.helpers({
		weeks: function(){
			return b52.calendarBack;
		}
	});
	
	Template.calendar.helpers({
		weeks: function() {
			return b52.buildMemories();
		}
	});
	
	Template.sidemenu.events({
		'click a': function(){
			b52.slideout.close();
		},
		'click a.logout': function() {
			Meteor.logout();
		}
	});
	
	Template.addMemory.events({
		"submit .add-memory": function(evt) {
			evt.preventDefault();
			var formObj = {
				text: evt.target.text[0].value,
				week: evt.target.text[1].value
			};
			if(!b52.checkValidWeek(formObj.week)) return Router.go('error');
			Meteor.call('addMemory', formObj);
			history.back();
		},
		"keyup textarea": function(evt) {
			var button = document.querySelector('.add-memory button');
			var isVisible = b52.hasClass('show', button);
			if (evt.target.value.length > 0 && !isVisible) {
				return button.className +=' show';
			}
			if (evt.target.value.length === 0 && isVisible) {
				button.className = button.className.replace(' show', '');
			}
		}
	});
	
	Template.week.helpers({
		weekLink: function(){
			return this.currentWeek || this.previousWeek;
		}
	})
	Template.header.events({
		'click .menu-button': function(evt) {
			if(b52.slideout.state === 'closed'){
				b52.slideout.state = 'open';	
			 	return b52.slideout.open();
			}
			b52.slideout.state = 'closed';
			b52.slideout.close();
		}
	});
	
	Template.layout.events({
		'click .sidebar-modal': function(){
			b52.slideout.close();
		}
	})
	
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
	});
}

Meteor.methods({
	addMemory: function(formObj) {
		if (! Meteor.userId()) {
      		throw new Meteor.Error("not-authorized");
    	}
		if (formObj.week < 1 || formObj.week > 53){
			throw new Meteor.Error("invalid-week");
		}
		Memories.insert({
			text: formObj.text,
			createdAt: new Date(),
			week: formObj.week,
			owner: Meteor.userId()
		});
	},
	deleteMemory: function(id) {
		var mem = Memories.findOne(id);
		if(mem.owner !== Meteor.userId()){
			throw new Meteor.Error('not authorized');
		}
		Memories.remove(id);
	}
});

if (Meteor.isServer) {
  Meteor.startup(function () {
	Meteor.publish("memories", function () {
		return Memories.find({owner: this.userId});
	});
  });
}