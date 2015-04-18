'use strict';

var EpicFileReader = (function (EpicFileReader, undefined) {

	EpicFileReader.type = {
		SONG: 0,
		SLIDE: 1
	}

	EpicFileReader.layout = {
		TEXT: 0,
		IMAGE: 1,
		VIDEO: 2
	}

	// Load from file
	EpicFileReader.load = function (filename) {
		var file = fs.readFileSync(filename, {encoding: 'utf8'});
		return EpicFileReader.parse(file);
	}

	// Load from string
	EpicFileReader.parse = function (input) {
		var lines = input.split('\n');

		// The output file contains backgrounds, songs, and slides
		var file = {
			backgrounds: [ Const.INITIAL_BACKGROUND ],
			themes: [ Const.INITIAL_THEME ],
			slides: []
		}

		var parseState = {
			nextLineIndex: 0,
			// The index of the background to use for the next slide if a slide-
			// scoped background directive is not found in the slide definition.
			backgroundInUse: 0,
			// The index of the theme (CSS file) to use for the next slide if a
			// slide-scoped theme directive is not found in the slide
			// definition.
			themeInUse: 0,
			// The index of the current song, if the parser is in song mode.
			// If the parser is not currently parsing a song, this will be -1.
			// If the parser is expecting a song but hasn't found it yet, this
			// will be -2.
			mode: Const.INITIAL_MODE,
			errors: []
		}

		// Parse the lines until exhausted.
		while (parseState.nextLineIndex !== lines.length)
			parseNextSlide(lines, file, parseState);

		return file;
	}

	/*
	 * Read a single slide starting from `parseState.nextLineIndex` and push it
	 * onto the `file.slides` array. If in song mode, will read an entire song.
	 * Each slide or song contains the following properties:
	 *     type: enum (EpicFileReader.type)
	 *     layout: enum (EpicFileReader.layout)
	 *     title: string
	 *     showTitle: boolean
	 *     contents:
	 *         string in slides mode, parsed through Markdown
	 *         song slide array in song mode
	 *     background: number
	 *     theme: number
	 *
	 * Within a song, each song slide contains the following properties:
	 *     label: string
	 *     contents: string
	 */
	function parseNextSlide (lines, file, parseState) {
		var nextLine;
		var slide = {};

		// Section-scoped directives come before the slide title. Process all
		// section-scoped directives until we find the slide title.
		for (;;) {
			if (parseState.nextLineIndex >= lines.length)
				return;

			nextLine = lines[parseState.nextLineIndex++];

			// Slide title syntax:
			// `#` must be the first character on the line
			// `!` immediately after the `#` signifies that the title should not
			//     be displayed on the slide.
			if (parseState.mode === EpicFileReader.type.SLIDE) {
				if (nextLine[0] === '#') {
					slide.type = EpicFileReader.type.SLIDE;
					if (nextLine[1] === '!') {
						slide.title = nextLine.substring(2).trim();
						slide.showTitle = false;
					} else {
						slide.title = nextLine.substring(1).trim();
						slide.showTitle = true;
					}
					break;
				}
			}

			// Song titles are never shown on the slide, so don't look for `!`
			else if (nextLine[0] === '#') {
				slide.type = EpicFileReader.type.SONG;
				slide.title = nextLine.substring(1).trim();
				slide.showTitle = false;
				break;
			}

			// Directives begin with `%`. We parse those separately.
			if (nextLine[0] === '%') {
				parseSectionDirective(nextLine, file, parseState);
			}
		}

		// Slide-scoped directives come right after the slide title, with no
		// blank lines in between the title of the slide and the directives.
		// Process following lines as slide-scoped directives until a blank line
		// or a line that starts with a character other than `%` is reached.
		parseAllSlideDirectives(lines, file, slide, parseState);

		// Add section-scoped attributes to slide if slide-scoped attributes
		// were not applied
		if (!slide.theme) slide.theme = parseState.themeInUse;
		if (!slide.background) slide.background = parseState.backgroundInUse;
		if (!slide.layout) slide.layout = EpicFileReader.layout.TEXT;

		// For songs, parse all the sub-slides as plaintext
		if (parseState.mode === EpicFileReader.type.SONG)
			parseSongContent(lines, slide, parseState);
		else
			parseSlideContent(lines, slide, parseState);

		file.slides.push(slide);
	}

	function parseSectionDirective (line, file, parseState) {
		var splitIndex = line.indexOf(' ');
		var directive = line.substring(1, splitIndex);
		var args = line.substring(splitIndex + 1);

		switch (directive) {
			case 'mode':
			parseModeDirective(args, file, parseState);
			break;

			case 'theme':
			parseThemeDirective(args, file, parseState);
			break;

			case 'background':
			parseBackgroundDirective(args, file, parseState);
			break;
			
			default:
			parseState.errors.push([parseState.nextLineIndex,
				'Unknown section directive "' + directive + '"'])
		}
	}

	function parseAllSlideDirectives (lines, file, slide, parseState) {
		var nextLine;
		for (;;) {
			if (parseState.nextLineIndex >= lines.length)
				return;

			nextLine = lines[parseState.nextLineIndex++];

			if (nextLine[0] === '%')
				parseSlideDirective(nextLine, file, slide, parseState);
			else {
				parseState.nextLineIndex--;
				return;
			}
		}
	}

	function parseSlideDirective (line, file, slide, parseState) {
		var splitIndex = line.indexOf(' ');
		var directive = line.substring(1, splitIndex);
		var args = line.substring(splitIndex + 1);

		switch (directive) {
			case 'theme':
			parseThemeDirective(args, file, parseState, slide);
			break;

			case 'background':
			parseBackgroundDirective(args, file, parseState, slide);
			break;

			case 'layout':
			parseLayoutDirective(args, file, parseState, slide);
			break;

			default:
			parseState.errors.push([parseState.nextLineIndex,
				'Unknown slide directive "' + directive + '"'])
		}
	}

	function parseModeDirective (args, file, parseState) {
		if (args === 'song')
			parseState.mode = EpicFileReader.type.SONG;
		else if (args === 'slides')
			parseState.mode = EpicFileReader.type.SLIDE;
		else
			parseState.errors.push([parseState.nextLineIndex,
				'Unsupported mode: "' + args + '"']);
	}

	function parseThemeDirective (args, file, parseState, slide) {
		var themeIndex = file.themes.indexOf(args);
		if (themeIndex === -1) {
			file.themes.push(args);
			if (slide) slide.theme = file.themes.length - 1;
			else parseState.themeInUse = file.themes.length - 1;
		} else {
			if (slide) slide.theme = themeIndex;
			else parseState.themeInUse = themeIndex;
		}
	}

	function parseBackgroundDirective (args, file, parseState, slide) {
		var backgroundIndex = file.backgrounds.indexOf(args);
		if (backgroundIndex === -1) {
			file.backgrounds.push(args);
			if (slide) slide.background = file.backgrounds.length - 1;
			else parseState.backgroundInUse = file.backgrounds.length - 1;
		} else {
			if (slide) slide.background = backgroundIndex;
			else parseState.backgroundInUse = backgroundIndex;
		}
	}

	function parseLayoutDirective (args, file) {
		// TODO
	}

	function parseSongContent (lines, slide, parseState) {
		var nextLine;
		slide.content = [];

		for (;;) {
			var currentSlide = {};
			var contentLines = [];

			for (;;) {
				if (parseState.nextLineIndex >= lines.length)
					return;

				nextLine = lines[parseState.nextLineIndex++];

				// Search for a header matching `##`. If we find a higher level
				// `#` header instead, there are no more slides to parse in the
				// song.
				if (nextLine[0] === '#') {
					if (nextLine[1] === '#') {
						currentSlide.label = nextLine.substring(2).trim();
						break;
					} else {
						parseState.nextLineIndex--;
						return;
					}
				} else if (nextLine[0] === '%') {
					parseState.nextLineIndex--;
					return;
				}
			}

			skipBlankLines(lines, parseState);

			for (;;) {
				if (parseState.nextLineIndex >= lines.length)
					break;

				nextLine = lines[parseState.nextLineIndex++];

				// Headers and directives end slide content
				if (nextLine[0] === '#' || nextLine[0] === '%') {
					parseState.nextLineIndex--;
					break;
				}

				if (nextLine[0] === '\\')
					contentLines.push(nextLine.substring(1));
				else
					contentLines.push(nextLine);
			}

			currentSlide.content = contentLines.join('\n').trim();
			slide.content.push(currentSlide);
		}
	}

	function parseSlideContent (lines, slide, parseState) {
		slide.content = '';
		var contentLines = [], content, nextLine;

		skipBlankLines(lines, parseState);

		for (;;) {
			if (parseState.nextLineIndex >= lines.length) {
				content = contentLines.join('\n');
				slide.content = Markdown.parse(content);
				return;
			}

			nextLine = lines[parseState.nextLineIndex++];

			if (nextLine[0] === '#' || nextLine[0] === '%') {
				content = contentLines.join('\n');
				slide.content = Markdown.parse(content);
				parseState.nextLineIndex--;
				return;
			}

			if (nextLine[0] === '\\')
				contentLines.push(nextLine.substring(1));
			else
				contentLines.push(nextLine);
		}
	}

	function skipBlankLines (lines, parseState) {
		for (; parseState.nextLineIndex < lines.length && lines[parseState.nextLineIndex].trim() === ''; parseState.nextLineIndex++);
	}

	return EpicFileReader;

})(EpicFileReader || {});
