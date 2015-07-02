'use strict';

var SlidePreview = Backbone.View.extend({
	model: SlideModel,
	template: _.template('<iframe class="content" width="160" height="120" frameBorder="0"></iframe>\
		<div class="click-intercept"></div>\
		<div class="meta">\
			<div class="index"><%= index %></div>\
			<div class="title"><%= title %></div>\
		</div>'),

	initialize: function (options) {
		this.index = options.index;
		this.render();
	},

	events: {
		'click .click-intercept': 'selectMe'
	},

	render: function () {
		this.$el.empty().append(this.template({
			index: this.index + 1,
			title: this.model.get('title')
		}))

		// Render the contents inside a SlideView, and then put the resulting
		// HTML in an iframe so that the viewport units become relative to the
		// iframe instead of the presenter window.
		var slide = new SlideView({
			model: this.model,
			animate: false
		})

		// The background view doesn't need any viewport size magic, so just add
		// it directly.
		var backgroundModel = global.assets.getBackground(this.model.get('background'));
		if (backgroundModel.get('type') !== 'video') {
			var background = new BackgroundView({
				model: backgroundModel,
				animate: false
			})
			background.$el.prependTo(this.$el);
		}

		this.$('.content').attr('srcdoc', slide.el.shadowRoot.innerHTML);
	},

	selectMe: function () {
		this.trigger('select', this.index);
	},

	highlight: function () {
		this.$el.addClass('highlighted');
	},

	unhighlight: function () {
		this.$el.removeClass('highlighted');
	}
})
