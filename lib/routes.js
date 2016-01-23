Router.configure({
	layoutTemplate: 'layout',
	trackPageView: true
});
  
var routerActions = {
	isLoggedIn: function() {
		if (Meteor.user()) return this.next();
		Router.go('/');
	}
}

Router.route('/', function () {
	if (Meteor.user()) return Router.go('calendar');
	this.render('welcome');
});

Router.route('/calendar', {
	onBeforeAction: routerActions.isLoggedIn,
	template: 'calendar',
	data:  {hideFooter: true},
	name: 'calendar'
});

Router.route('/weeklyMemories/:week', {
	onBeforeAction: routerActions.isLoggedIn,
	waitOn: function() {
		if (Meteor.userId()) {
			return Meteor.subscribe('weeklyMemories', this.params.week);
		} else {
			console.log('shouldn not render data');
			this.render();
		}
	},
	template: 'weeklyMemories',
	data: function() {
		if(Meteor.user()){
			var memories = Memories.find({owner: Meteor.user()._id, week: this.params.week});
			var memoriesCount = memories.count();
			return {
				week: this.params.week,
				memories: memories
			};
		} else {
			return {};
		}
	}
});

Router.route('/memory/:_id', {
	waitOn: function(){
		return Meteor.subscribe('memories', this.params._id);
	},
	template: 'memory',
	data: function() {
		return Memories.findOne({_id: this.params._id});
	}
});

Router.route('/memory/:_id/edit', {
	onBeforeAction: routerActions.isLoggedIn,
	template: 'addMemory',
	name: 'editMemory',
	data:  function() {
			return {
				edit: true,
				memory: Memories.findOne({_id: this.params._id})
			}
	}	
});

Router.route('/terms', function() {
	this.render('terms');
});

Router.route('/about', function(){
	this.render('about');
});

Router.route('/contact', function(){
	this.render('contact');
});

Router.route('/forgotPassword', function() {
	this.render('passwordReset');
});

Router.route('/error', function(){
	this.render('error');
});