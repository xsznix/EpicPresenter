'use strict';

// Initialize Screen API
gui.Screen.Init();

// Global events
// - slide:load (SlideModel)
// - background:load (BackgroundModel)
// - file:open (). Reset all program state.
global.events = _.clone(Backbone.Events);

// Open presentation
var presentation = gui.Window.open('presentation.html', {
	toolbar: false,
	x: 40,
	y: 40,
	height: 480,
	width: 640
});
