'use strict';

var SlideListSectionView = Backbone.View.extend({
	initialize: function () {
		this.render();
	},

	render: function () {
		this.$el.empty();

		var header = document.createElement('h2');
		header.innerText = this.model.get('title');
		this.$el.append(header);

		var content = document.createElement('section');
		this.model.get('slides').forEach(function (slide) {
			content.appendChild(slide.el);
			this.listenTo(slide, 'select', this.selectSlide);
		}, this)
		this.$el.append(content);
	},

	selectSlide: function (index) {
		this.trigger('select', index);
	}
})
