Memories = new Mongo.Collection("memories");
var b52 = {
	calCount: 0,
	buildMemories: function(updateCount) {
		this.memories = Memories.find({owner: Meteor.userId()});
				this.memories.forEach(function(mem){
					var memWeek = mem.week-1;
					if (b52.weeks[memWeek].memories.length === 0 ||
						updateCount > b52.weeks[memWeek].updateCount ) {
						b52.weeks[memWeek].memories = [];
						b52.weeks[memWeek].updateCount = updateCount;
						
					}
					b52.weeks[memWeek].memories.push(mem);
			});
		this.calCount++;
		return b52.weeks;
	},
	checkValidWeek: function(week) {
		return week <= b52.currentWeek;
	},
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
		this.weeks[this.currentWeek -1].message = 'this week i'
		
		if (this.currentWeek > 1) {
			this.weeks[this.currentWeek - 2].message = 'last week i'
		}
	},
	setCurrentWeek: function(){
		this.currentWeek =  new Date().getWeek();
		return this.currentWeek;
	},
	slideout: { 
		state: 'closed',
		close: function() {
			var slideout = document.body;
			slideout.className = slideout.className.replace(' show-sidebar', '');
			b52.slideout.state = 'closed';
		},
		open: function() {
			var slideout = document.body;
			slideout.className = slideout.className += ' show-sidebar';
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
			owner: Meteor.userId(),
			share: formObj.share
		});
	},
	editMemory: function(formObj) {
		var mem = Memories.findOne(formObj._id);
		if(mem.owner !== Meteor.userId()){
			throw new Meteor.Error('not authorized');
		}	
		Memories.update(formObj._id, {
			$set: {
				text: formObj.text, 
				share: formObj.share,
				updatedAt: new Date()
				}
		});
	},
	deleteMemory: function(id) {
		var mem = Memories.findOne(id);
		if(mem.owner !== Meteor.userId()){
			throw new Meteor.Error('not authorized');
		}	
		Memories.remove(id);
	},
	contactUs: function(text, from) {

	//	check(text, String);
	//	check(from, String);
		
		this.unblock();

		Email.send({
			to: 'pete@bucket52.com',
			from: 'hi@bucket52.com',
			subject: 'From Contact Form',
			text: text + '\n from: ' + from
		});
	}
});

if (Meteor.isClient) {
	Template.layout.onRendered(function () {
		var template = this;
		window.addEventListener('onhashchange', b52.slideout.close);
	});
	
	b52.init();
	Meteor.subscribe("memories");
	
	Template.calendar.helpers({
		weeks: function() {
			return b52.buildMemories(b52.calCount+1);
		},
		invokeAfterLoad: function() {
			Meteor.defer(function(){
				var offset = document.querySelector('.current').offsetTop;
				window.scrollTo(offset, 0);
			});	
		}
	});
	
	Template.sidemenu.events({
		'click a': function(){
			b52.slideout.close();
		},
		'click a.logout': function() {
			Meteor.logout(function(){
				b52.init(); //need to rebuild the weeks
				Router.go('/');
			});

		}
	});
	
	Template.addMemory.events({
		"click .save-memory": function(evt, t) {
			evt.preventDefault();
			function shareState(button) {
				return button.getAttribute('data-share');
			}
			function validInput() {
				if (t.find('input[name="week"]') && !b52.checkValidWeek(formObj.week)) return false;
				if (!t.find('input[name="id]') || !t.find('input[name="id]').value) return false;
				return true;
			}
			var form = t.find('form.add-memory');
			var formObj = {
				text: t.find('textarea[name="memory"]').value,
				share: shareState(evt.currentTarget)
			};
			if(!validInput) return Router.go('error');
			if (t.find('input[name="week"]')) {
				formObj.week = t.find('input[name="week"]').value;
				Meteor.call('addMemory', formObj);
			} else {
				formObj._id = t.find('input[name="id"]').value;
				Meteor.call('editMemory', formObj);
			}
			history.back();
		},
		"keyup textarea": function(evt) {
			var buttons = document.querySelectorAll('.save-memory');
			var isVisible = b52.hasClass('show', buttons[0]);
			if (evt.target.value.length > 0 && !isVisible) {
				return [].forEach.call(buttons, function(but){
					but.className +=' show';
				});
			}
			if (evt.target.value.length === 0 && isVisible) {
				[].forEach.call(buttons, function(but){
					but.className = but.className.replace(' show', '');
				});
			}
		}
	});
	
	Template.addMemory.helpers({
		showButton: function() {
			return this.edit ? 'show' : '';
		}
	});
	
	Template.week.helpers({
		weekLink: function(){
			return this.week <= b52.currentWeek;
		},
		linkClass: function() {
			if(this.week === b52.currentWeek || this.week ===  b52.currentWeek -1) return 'current';
			return;
		},
		memoriesCount: function() {
			return this.memories.length > 1 ? this.memories.length : false;
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
	});
	
	Template.memory.events({
		'click .delete': function(evt) {
			console.log('evt', evt.target);
			var id = evt.target.attributes.getNamedItem('data-id').value;
			Meteor.call('deleteMemory', id);
		}
	});
	
	Template.memory.helpers({
		showEditButtons: function() {
			return this.owner === Meteor.userId();
		},
		formatText: function() {
			return this.text.replace(/\r?\n/g, '<br />');
		},
		showBack: function() {
			var path = new RegExp(/\/memory\//);
			var test =  path.test(window.location.pathname);
			return test;
		}
	});
	
	Template.back.events({
		'click': function() {
			history.back();
		}
	})
	Template.logins.helpers({
		loginError: null
	});
	
	Template.logins.events({
		"click #login-buttons-facebook": function() {
			Meteor.loginWithFacebook();
		},
		'click #login-signin': function(e, t) {
			e.preventDefault();
			
			var email = t.find('.login-email').value;
			if (t.find('.login-email').checkValidity() === false) {
				return t.find('.error').innerHTML = 'Invalid Email';
			}
			var password = t.find('.login-password').value;
			
			Meteor.loginWithPassword(email, password, function(err){
				t.find('.error').innerHTML =  err.reason;
				return;
			}); 
			return false;
		},
		'click #login-signup': function(e, t) {
			e.preventDefault();
			var email = t.find('.login-email').value
			var password = t.find('.login-password').value;
			if (t.find('.login-email').checkValidity() === false) {
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
		'keyup form input': function(e, t) {
			var buttons = t.find('.buttons');
			var email = t.find('.login-email');
			var pass = t.find('.login-password');
			var isButtonVisible = b52.hasClass('show', buttons);
			var logins = t.find('.login');
			var error = t.find('.error');
			if(error.innerHTML.length > 0 ) error.innerHTML = ''; 
			if(email.value.length === 0 && pass.value.length === 0) {
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
	
	Template.contact.events({
		'submit #contactForm': function(e, t) {
			e.preventDefault();
			var email = t.find('.email');
			var msg = t.find('.msg');
			if(msg.value.length > 5) {
				Meteor.call('contactUs', msg.value, email.value);
				history.back();
			} else {
				alert('Sorry, something went wrong sending your email');
			}
		},
		'keyup': function(e, t) {
			var button = t.find('.button');
			var email = t.find('.email');
			var msg = t.find('.msg');
			var isButtonVisible = b52.hasClass('show', button);
			if (!isButtonVisible && email.value.length > 2 && msg.value.length > 4) {
				return button.className += ' show';
			} else if(isButtonVisible && (email.value.length <= 2 || msg.value.length <= 4)) {
				return button.className = button.className.replace(' show', '');
			}
		}
	});

}
if (Meteor.isServer) {
  Meteor.startup(function () {
	Meteor.publish("memories", function () {
		return Memories.find({ $or: [
			{owner: this.userId},
			{share: {$ne: 'private'}}
		]});
	});
	
	Meteor.publish("weeklyMemories", function(week) {
		return Memories.find({owner: this.userId},{week: week});
	})
  });
  
	Accounts.emailTemplates.siteName = "Bucket52";
	Accounts.emailTemplates.from = "Hi <hi@bucket52.com>";
}