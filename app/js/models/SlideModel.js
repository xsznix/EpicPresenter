'use strict';

/* A SlideModel always has the following attributes:
 *     type: enum
 *     layout: enum
 *     title: string
 *     showTitle: boolean
 *     content: string
 *     background: number
 *     theme: number
 * See app/js/file/reader.js for additional information on slide attributes.
 *
 * Unlike a "slide" in the file, each slide represented by a SlideModel
 * corresponds with a slide that is displayed on-screen in the presentation
 * view. This means that each element in the `content` array of a song "slide"
 * must have its own SlideModel, which can be created using
 * `SlideModel.fromSongSlide`.
 */
var SlideModel = Backbone.Model.extend({ });

// Takes a song (technically, a "slide" in the object representation) and a
// slide (`slide.content[x]`) from that same song and create a new model
// representing it as a slide
SlideModel.fromSongSlide = function (song, slide) {
	return new SlideModel({
		type: song.type,
		layout: song.layout,
		title: slide.label,
		showTitle: song.showTitle,
		content: '<pre>' + slide.content + '</pre>',
		background: song.background,
		theme: song.theme
	})
}
