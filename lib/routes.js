var slideout;
Router.configure({
	layoutTemplate: 'layout'
});

Router.onStop(function () {
	if (slideout) {
		slideout.close();
	}
});
  
Router.route('/', function () {
	this.render('calendar');
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

Router.route('/error', function(){
	this.render('error');
});