'use strict';

var SlideListView = Backbone.View.extend({
	el: '#slides',

	initialize: function () {
		this.listenTo(global.events, 'slide:load', this.highlightSlide);
		this.listenTo(global.events, 'file:open', this.render);
	},

	render: function () {
		var self = this;
		this.$el.empty();
		this.removeChildren();
		
		this.slideViews = [];
		this.sectionViews = [];

		var currentSection, nextSongSlideIndex = Infinity, nextSongIndex = 0;
		var i, len = global.slides.length, currentMode = Const.INITIAL_MODE;

		if (global.songs.length)
			nextSongSlideIndex = global.songs[nextSongIndex].slide;

		for (i = 0; i < len; i++) {
			if (i === nextSongSlideIndex) {
				currentMode = EpicFileReader.type.SONG;

				var title = global.songs[nextSongIndex++].title;

				if (nextSongIndex < global.songs.length)
					nextSongSlideIndex = global.songs[nextSongIndex].slide;
				else
					nextSongSlideIndex = Infinity;

				if (currentSection) pushCurrentSection();
				currentSection = {
					title: title,
					slides: [] };
			} else if (currentMode === EpicFileReader.type.SONG &&
				global.slides[i].get('type') === EpicFileReader.type.SLIDE) {
				currentMode = EpicFileReader.type.SLIDE;
				if (currentSection) pushCurrentSection();
				currentSection = newSection();
			}

			var slidePreview = new SlidePreview({
				index: this.slideViews.length,
				model: global.slides[i]
			})

			currentSection = currentSection || newSection();

			currentSection.slides.push(slidePreview);
			this.slideViews.push(slidePreview);
		}

		if (currentSection) pushCurrentSection();

		this.sectionViews.forEach(function (view) {
			self.$el.append(view.$el);
			this.listenTo(view, 'select', this.selectSlide);
		}, this)

		function pushCurrentSection () {
			self.sectionViews.push(new SlideListSectionView({
				model: new SlideListSection(currentSection)
			}))
		}

		function newSection () {
			return { title: '', slides: [] }
		}
	},

	selectSlide: function (index) {
		this.trigger('select', index);
	},

	highlight: function (index) {
		this.slideViews[index].highlight();
	},

	unhighlight: function (index) {
		this.slideViews[index].unhighlight();
	},

	removeChildren: function () {
		if (this.sectionViews && this.sectionViews.length)
			this.sectionViews.forEach(function (view) { view.remove() })
		if (this.slideViews && this.slideViews.length)
			this.slideViews.forEach(function (view) { view.remove() })
	}
})
