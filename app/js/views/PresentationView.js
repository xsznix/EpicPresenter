'use strict';

var PresentationView = Backbone.View.extend({
	el: 'main',
	
	initialize: function () {
		this.$bg = this.$('#background');
		this.$fg = this.$('#foreground');

		this.isRoot = window === top;

		this.listenTo(global.events, 'slide:load', this.setForeground);
		this.listenTo(global.events, 'background:load', this.setBackground);
		this.listenTo(global.events, 'slide:blank', this.blank);
		this.listenTo(global.events, 'slide:unblank', this.unblank);
	},

	setBackground: function (model) {
		var oldBackground = this.currentBackground;

		this.currentBackground = new BackgroundView({
			model: model,
			animate: this.isRoot });
		this.currentBackground.$el.appendTo(this.$bg);
		this.currentBackground.fadeIn(Const.FADE_TIME);
		
		if (oldBackground)
			setTimeout(function () { oldBackground.remove() }, Const.FADE_TIME);
	},

	setForeground: function (model) {
		if (this.currentForeground)
			this.currentForeground.fadeOutAndRemove();

		this.currentForeground = new SlideView({
			model: model,
			animate: this.isRoot });
		this.currentForeground.$el.appendTo(this.$fg);
		this.currentForeground.fadeIn();
	},

	blank: function () {
		this.currentForeground.fadeOut();
	},

	unblank: function () {
		this.currentForeground.fadeIn();
	}
})
