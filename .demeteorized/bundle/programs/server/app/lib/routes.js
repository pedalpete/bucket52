(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// lib/routes.js                                                       //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var slideout;                                                          // 1
Router.configure({                                                     // 2
	layoutTemplate: 'layout'                                              // 3
});                                                                    //
                                                                       //
Router.onStop(function () {                                            // 6
	if (slideout) {                                                       // 7
		slideout.close();                                                    // 8
	}                                                                     //
});                                                                    //
                                                                       //
Router.route('/', function () {                                        // 12
	this.render('calendar', { data: function () {                         // 13
			return { hideFooter: true };                                        // 14
		} });                                                                //
});                                                                    //
                                                                       //
Router.route('/addMemory/:_id', function () {                          // 18
	this.render('addMemory', { data: function () {                        // 19
			return { week: this.params._id };                                   // 20
		} });                                                                //
});                                                                    //
                                                                       //
Router.route('/memory/:_id', function () {                             // 24
	this.render('memory', { data: function () {                           // 25
			return Memories.findOne({ _id: this.params._id });                  // 26
		} });                                                                //
});                                                                    //
                                                                       //
Router.route('/terms', function () {                                   // 30
	this.render('terms');                                                 // 31
});                                                                    //
                                                                       //
Router.route('/about', function () {                                   // 34
	this.render('about');                                                 // 35
});                                                                    //
                                                                       //
Router.route('/contact', function () {                                 // 38
	this.render('contact');                                               // 39
});                                                                    //
                                                                       //
Router.route('/error', function () {                                   // 42
	this.render('error');                                                 // 43
});                                                                    //
/////////////////////////////////////////////////////////////////////////

}).call(this);

//# sourceMappingURL=routes.js.map
