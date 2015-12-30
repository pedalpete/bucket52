var b52 = {};
b52.weeks = Math.pow(2, 53).toString(2).split('').map((i,j) => {
	return {'week': j+1};
});

if (Meteor.isClient) {
  // counter starts at 0
  Template.calendar.helpers({
	  weeks: b52.weeks
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
