Router.configure({
	layoutTemplate: 'layout'
});

Router.route('/', function () {
	this.render('calendar');
});

Router.route('/addMemory/:_id', function () {
	this.render('addMemory',{data: function() {
		return {week: this.params._id};
	}});
});

Router.route('/error', function(){
	this.render('error');
});