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
		content.innerHTML = this.model.get('content');

		if (this.model.get('type') === EpicFileReader.type.SONG)
			content.classList.add('song');

		this.$shadow.empty().append(style, header, content);

		if (!this.animate)
			this.$el.show();
	},

	fadeIn: function () {
		if (this.animate)
			this.$el.stop().fadeIn(Const.FADE_TIME);
		else
			this.$el.show();
	},

	fadeOut: function () {
		if (this.animate)
			this.$el.stop().fadeOut(Const.FADE_TIME);
		else
			this.$el.hide();
	},

	fadeOutAndRemove: function () {
		if (this.animate)
			this.$el.stop().fadeOut(Const.FADE_TIME, function () {
				this.remove();
			});
		else
			this.remove();
	}
})
