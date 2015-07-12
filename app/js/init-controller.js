'use strict';

// Initialize Screen API
gui.Screen.Init();

// Global events
// - slide:load (SlideModel)
// - background:load (BackgroundModel)
// - file:open (). Reset all program state.
global.events = _.clone(Backbone.Events);

// Position presentation on second monitor and enter full screen if there are
// two monitors
$(function () {
	var presentationOpts = {
		toolbar: false,
		x: 40,
		y: 40,
		height: 480,
		width: 640
	};
	var fullScreen = gui.Screen.screens.length > 1;

	if (fullScreen) {
		_.extend(presentationOpts, {
			x: gui.Screen.screens[1].work_area.x,
			y: gui.Screen.screens[1].work_area.y
		});
	}

	// Open presentation
	window.presentation = gui.Window.open('presentation.html', presentationOpts);

	if (fullScreen) {
		presentation.enterFullscreen();
		gui.Window.get().enterFullscreen();
	}
});
