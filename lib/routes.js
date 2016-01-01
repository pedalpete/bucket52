Router.configure({
	layoutTemplate: 'layout'
});
  
Router.route('/', function () {
	this.render('calendar', {data: function(){
		return {hideFooter: true};
	}});
});

Router.route('/addMemory/:_id', function () {
	this.render('addMemory',{data: function() {
		return {week: this.params._id};
	}});
});

Router.route('/memory/:_id', function() {
	this.render('memory', {data: function() {
		return Memories.findOne({_id: this.params._id});
	}})
})

Router.route('/terms', function() {
	this.render('terms');
});

Router.route('/about', function(){
	this.render('about');
});

Router.route('/contact', function(){
	this.render('contact');
});

Router.route('/error', function(){
	this.render('error');
});