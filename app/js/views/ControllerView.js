'use strict';

var ControllerView = Backbone.View.extend({
	el: 'main',

	initialize: function () {
		$(document).keydown(this.handleKey.bind(this));
		$('#filedialog').attr('nwworkingdir', process.cwd() + '/presentations');
		this.render();
	},

	render: function () {
		this.slideList = new SlideListView();
		this.listenTo(this.slideList, 'select', this.goSlide);
	},

	events: {
		'click #blank': 'goBlank',
		'click #prev': 'goPrevious',
		'click #next': 'goNext',
		'click #open': 'showFileDialog',
		'click #reload': 'reloadCurrentFile',
		'click #exit': 'exit',
		'click #play': 'playVideo',
		'click #pause': 'pauseVideo',
		'click #restart': 'restartVideo',
		'change #filedialog': 'chooseFile',
		'click #debug-controller': 'showMyDevTools',
		'click #debug-presentation': 'showPresentationDevTools'
	},

	openFile: function (filename) {
		var file = EpicFileReader.load(filename);

		global.assets = new AssetStore(filename, file.themes, file.backgrounds);

		this.useSlides(file.slides);
		this.slideIndex = 0;
		this.currentSlide = global.slides[0];
		this.backgroundIndex = -1;
		this.blanked = false;

		global.events.trigger('file:open');
	},

	useSlides: function (slides) {
		var models = [];
		var songs = [];

		slides.forEach(function (slide, i) {
			if (slide.type === EpicFileReader.type.SONG) {
				songs.push({
					slide: models.length,
					title: slide.title,
					notes: slide.notes
				});
				slide.content.forEach(function (songSlide) {
					models.push(SlideModel.fromSongSlide(slide, songSlide));
				})
			} else {
				models.push(new SlideModel(slide));
			}
		})

		global.slides = models;
		global.songs = songs;
	},

	goBlank: function () {
		if (this.blanked)
			global.events.trigger('slide:unblank');
		else
			global.events.trigger('slide:blank');
		this.blanked = !this.blanked;
	},

	goPrevious: function () {
		if (this.slideIndex === 0)
			return;

		this.goSlide(this.slideIndex - 1);
	},

	goNext: function () {
		if (this.slideIndex === global.slides.length - 1)
			return;

		this.goSlide(this.slideIndex + 1);
	},

	goSlide: function (index) {
		if (!global.slides || index < 0 || index >= global.slides.length)
			return;

		this.slideList.unhighlight(this.slideIndex);
		this.slideIndex = index;
		this.slideList.highlight(index);

		this.currentSlide = global.slides[index];

		this.blanked = false;

		global.events.trigger('slide:load', this.currentSlide);

		this.loadBackground(this.currentSlide);
	},

	loadBackground: function (slide) {
		var newBackground = slide.get('background');
		if (newBackground !== this.backgroundIndex) {
			global.events.trigger('background:load',
				global.assets.getBackground(newBackground));
			this.backgroundIndex = newBackground;
		}
	},

	showFileDialog: function () {
		this.$('#filedialog').click();
	},

	chooseFile: function (e) {
		this.currentFile = this.$('#filedialog').val();
		this.openFile(this.currentFile);
		this.goSlide(0);
	},

	reloadCurrentFile: function () {
		if (this.currentFile)
			this.openFile(this.currentFile);
	},

	showMyDevTools: function () {
		gui.Window.get().showDevTools();
	},

	showPresentationDevTools: function () {
		presentation.showDevTools();
	},

	// Global keyboard shortcuts:
	// up/left/p: previous slide
	// down/right/n: next slide
	// b: blank
	handleKey: function (e) {
		switch (e.keyCode) {
			case 37:
			case 38:
			case 80:
			this.goPrevious();
			break;

			case 39:
			case 40:
			case 78:
			this.goNext();
			break;

			case 66:
			this.goBlank();
			break;
		}
	},

	exit: function () {
		process.exit();
	}
})
