'use strict';

var SlidePreview = Backbone.View.extend({
	model: SlideModel,
	template: _.template('<div>\
		<div class="background"></div>\
		<div class="foreground"></div>\
		<div class="meta">\
			<div class="index"></div>\
			<div class="title"></div>\
		</div>\
	</div>'),

	initialize: function (options) {
		this.index = options.index;
		this.render();
	},

	events: {
		'click': 'selectMe'
	},

	render: function () {
		// TODO
		this.$el.empty().append(this.template());
		this.$('.foreground').html(this.model.get('content'));
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
