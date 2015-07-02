'use strict';

/*
 * A SlideView is displayed on the presentation screen within a shadow DOM.
 */
var SlideView = Backbone.View.extend({
	className: 'slide',

	initialize: function (options) {
		this.animate = options.animate;
		this.shadow = this.el.createShadowRoot();
		this.$shadow = $(this.shadow);
		this.render();
	},

	render: function () {
		var theme = global.assets.getTheme(this.model.get('theme'));
		var style = document.createElement('style');
		style.innerHTML = theme;

		var header = document.createElement('header');
		if (this.model.get('showTitle'))
			header.innerHTML = this.model.get('title');

		var content = document.createElement('section');

		switch (this.model.get('layout')) {
			case EpicFileReader.layout.TEXT:
			this.renderText(content);
			break;

			case EpicFileReader.layout.IMAGE:
			this.renderImage(content);
			break;

			case EpicFileReader.layout.VIDEO:
			this.renderVideo(content);
			break;

			case EpicFileReader.layout.CUSTOM:
			this.renderCustom(content);
		}

		if (this.model.get('type') === EpicFileReader.type.SONG)
			content.classList.add('song');

		this.$shadow.empty().append(style, header, content);

		if (!this.animate)
			this.$el.show();
	},

	renderText: function (content) {
		content.innerHTML = this.model.get('content');
	},

	renderImage: function (content) {
		var mediaElement = document.createElement('div');
		mediaElement.style.backgroundImage = 'url(' + this.model.get('media') + ')';
		mediaElement.className = 'media image';
		content.appendChild(mediaElement);
		var caption = this.model.get('content'), captionElement;
		if (caption.length) {
			captionElement = document.createElement('div');
			captionElement.className = 'caption';
			captionElement.innerHTML = caption;
			content.appendChild(captionElement);
		} else {
			mediaElement.classList.add('nocaption');
		}
	},

	renderVideo: function (content) {
		if (!this.animate) return;

		this.boundResizeVideo = this.resizeVideo.bind(this);
		var mediaElement = document.createElement('video');
		mediaElement.className = 'media';
		mediaElement.setAttribute('src', this.model.get('media'));
		mediaElement.addEventListener('loadedmetadata', this.boundResizeVideo);

		if (this.animate) {
			window.addEventListener('resize', this.boundResizeVideo);
		}

		this.video = mediaElement;

		var video = this.video;
		setTimeout(function () {
			video.play();
		}, Const.FADE_TIME);

		content.appendChild(mediaElement);
	},

	renderCustom: function (content) {
		if (!this.animate) return;

		var iframe = document.createElement('iframe');
		iframe.src = this.model.get('media');
		iframe.className = 'custom';
		iframe.setAttribute('frameborder', '0');
		content.appendChild(iframe);

		this.frame = iframe;
	},

	fadeIn: function () {
		if (this.animate) {
			this.$el.stop().fadeIn({
				duration: Const.FADE_TIME,
				easing: Const.FADE_IN_EASE,
				complete: function() {
					console.log('faded in');
					console.log(this.frame);
					if (this.frame && this.frame.contentWindow && this.frame.contentWindow.start)
						this.frame.contentWindow.start();
				}.bind(this)
			});

			if (this.paused)
				this.video.play();
		} else
			this.$el.show();
	},

	fadeOut: function () {
		if (this.animate) {
			this.$el.stop().fadeOut({
				duration: Const.FADE_TIME,
				easing: Const.FADE_OUT_EASE,
				complete: function () {
					if (this.video) {
						this.paused = true;
						this.video.pause();
					} else if (this.frame && this.frame.contentWindow && this.frame.contentWindow.pause) {
						this.frame.contentWindow.pause();
					}
				}
			});

		} else
			this.$el.hide();
	},

	fadeOutAndRemove: function () {
		if (this.animate)
			this.$el.stop().fadeOut({
				duration: Const.FADE_TIME,
				easing: Const.FADE_OUT_EASE,
				complete: function () {
					this.remove();
				}
			});
		else
			this.remove();
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

		if (videoAspectRatio > clientAspectRatio) {
			this.video.setAttribute('height', h);
			this.video.removeAttribute('width');
		} else {
			this.video.setAttribute('width', w);
			this.video.removeAttribute('height');
		}}
})
