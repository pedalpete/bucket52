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
		this.currentWeek =  new Date().getWeek();
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
			b52.init(); //need to rebuild the weeks
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
	
	Template.logins.helpers({
		loginError: null
	});
	
	Template.logins.events({
		"click #login-buttons-facebook": function() {
			Meteor.loginWithFacebook();
		},
		'click #login-signin' : function(e, t){
			e.preventDefault();
			
			var email = t.find('#login-email').value;
			if (t.find('#login-email').checkValidity() === false) {
				return t.find('.error').innerHTML = 'Invalid Email';
			}
			var password = t.find('#login-password').value;
			
			Meteor.loginWithPassword(email, password, function(err){
				t.find('.error').innerHTML =  err.reason;
				return;
			}); 
			return false;
		},
		'click #login-signup': function(e, t) {
			e.preventDefault();
			var email = t.find('#login-email').value
			var password = t.find('#login-password').value;
			if (t.find('#login-email').checkValidity() === false) {
				return t.find('.error').innerHTML = 'Invalid Email';
			}
			if(password.length < 5) {
				return t.find('.error').innerHTML = 'Password must be atleast 5 characters';
			}
			Accounts.createUser({email: email, password : password}, function(err){
				t.find('.error').innerHTML =  err.reason;
				return;
			});

			return false;
		},
		'keyup input': function(e, t) {
			var buttons = t.find('.buttons');
			var email = t.find('#login-email');
			var pass = t.find('#login-password');
			var isButtonVisible = b52.hasClass('show', buttons);
			var hideSocials = b52.hasClass('hide-social', t.find('#login'));
			var logins = t.find('#login');
			var error = t.find('.error');
			if(error.innerHTML.length > 0 ) error.innerHTML = ''; 
			if(!hideSocials && email.value.length > 0 || !hideSocials && pass.value.length > 0) {
				logins.className = 'hide-social';
			}
			if(hideSocials && email.value.length === 0 && pass.value.length === 0) {
				logins.className = '';
			}
			if(email.value.length > 0 && pass.value.length > 0 && !isButtonVisible) {
				buttons.className += ' show'
			}
		}
	});
	
	Template.passwordReset.helpers({
		resetPassword : function(t) {
			return Session.get('resetPassword');
		}
	});
	
	Template.passwordReset.events({
		'submit form#reset-email' : function(e, t) {
			e.preventDefault()
			var email = t.find('#login-email');
			console.log('email', email);
			
			if (email.checkValidity()) {
				Session.set('loading', true);
				Accounts.forgotPassword({email: email.value}, function(err){
				if (err)
					console.log('password resset error', err);
				else {
					console.log('email sent');
					history.back();
				}
				Session.set('loading', false);
				});
			}
			return false; 
		},

		'submit form#reset-password' : function(e, t) {
			e.preventDefault();
			var pw = t.find('#password').value;
			if (pw.length > 4) {
				Session.set('loading', true);
				Accounts.resetPassword(Session.get('resetPassword'), pw, function(err){
				if (err)
					console.log('error resetting password', err);
				else {
					Session.set('resetPassword', null);
					console.log('password reset');
					Router.go('/');
				}
				Session.set('loading', false);
				});
			}
			return false; 
		}
	});

}
if (Meteor.isServer) {
  Meteor.startup(function () {
	Meteor.publish("memories", function () {
		return Memories.find({owner: this.userId});
	});
  });
  
	Accounts.emailTemplates.siteName = "Bucket52";
	Accounts.emailTemplates.from = "Hi <hi@bucket52.com>";
}