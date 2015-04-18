'use strict';

/*
 * A BackgroundView displays a color, image, or video behind a slide. If a video
 * is playing, it will loop continuously, with no breaks in between slides.
 */
var BackgroundView = Backbone.View.extend({
	className: 'slide background',

	initialize: function (options) {
		this.animate = options.animate;
		this.shadow = this.el.createShadowRoot();
		this.$shadow = $(this.shadow);
		this.render();
	},

	render: function () {
		switch (this.model.get('type')) {
			case 'color':
			this.renderColor();
			break;

			case 'image':
			this.renderImage();
			break;

			case 'video':
			this.renderVideo();
			break;
		}
	},

	renderColor: function () {
		this.$el.css('backgroundColor', this.model.get('color'));
	},

	renderImage: function () {
		var escapedUrl = this.escapeImageUrl(this.model.get('url'));
		this.$el.css('backgroundImage', 'url("' + escapedUrl + '") cover');

		var args = this.model.get('args');
		if (args.indexOf('contain') !== -1)
			this.$el.css('backgroundSize', 'contain');
	},

	renderVideo: function () {
		// TODO
	},

	fadeIn: function () {
		if (this.animate)
			this.$el.stop().fadeIn(Const.FADE_TIME);
		else
			this.$el.show();
	}
})