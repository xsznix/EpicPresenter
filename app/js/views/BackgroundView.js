'use strict';

/*
 * A BackgroundView displays a color, image, or video behind a slide. If a video
 * is playing, it will loop continuously, with no breaks in between slides.
 */
var BackgroundView = Backbone.View.extend({
	className: 'slide background',

	initialize: function (options) {
		this.animate = options.animate;
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
		this.$el.css('backgroundImage', 'url("' + escapedUrl + '")');

		var args = this.model.get('args');
		if (args.indexOf('contain') !== -1)
			this.$el.css('backgroundSize', 'contain');
		else
			this.$el.css('backgroundSize', 'cover');
	},

	renderVideo: function () {
		if (!this.animate) return;
		// TODO
		var video = document.createElement('video');

		if (this.animate) {
			video.setAttribute('autoplay', '');
			video.setAttribute('loop', '');
		}

		video.setAttribute('src', this.model.get('url'));
		video.setAttribute('muted', '');

		this.video = video;
		this.boundResizeVideo = this.resizeVideo.bind(this);

		video.addEventListener('loadedmetadata', this.boundResizeVideo);

		// Video can only resize if animations are on, since animations are only
		// on in the full screen presentation.
		if (this.animate)
			window.addEventListener('resize', this.boundResizeVideo);

		this.$el.append(video);
	},

	fadeIn: function () {
		var $el = this.$el;

		var fade = function () {
			$el.stop().fadeIn({
				duration: Const.FADE_TIME,
				easing: Const.FADE_IN_EASE
			});
		};

		if (this.animate) {
			if (this.video && this.video.readyState !== 4)
				this.video.addEventListener('canplay', fade);
			else
				fade();
		} else
			this.$el.show();
	},

	escapeImageUrl: function (url) {
		return url.replace('"', '\\"');
	},

	remove: function () {
		if (this.video) {
			this.video.removeEventListener('loadedmetadata', this.boundResizeVideo);
			window.removeEventListener('resize', this.boundResizeVideo);
		}
		Backbone.View.prototype.remove.call(this)
	},

	resizeVideo: function () {
		var h = this.$el.height(), w = this.$el.width();
		var clientAspectRatio = h / w;
		var videoAspectRatio = this.video.videoHeight / this.video.videoWidth;

		if (videoAspectRatio < clientAspectRatio) {
			this.video.setAttribute('height', h);
			this.video.removeAttribute('width');
		} else {
			this.video.setAttribute('width', w);
			this.video.removeAttribute('height');
		}
	}
})
