'use strict';

var EpicFileReader = (function (EpicFileReader, undefined) {

	EpicFileReader.type = {
		SONG: 0,
		SLIDE: 1
	}

	EpicFileReader.layout = {
		TEXT: 0,
		IMAGE: 1,
		VIDEO: 2,
		CUSTOM: 3
	}

	// Load from file
	EpicFileReader.load = function (filename) {
		var file = fs.readFileSync(filename, {encoding: 'utf8'});
		return EpicFileReader.parse(file, filename);
	}

	// Load from string
	EpicFileReader.parse = function (input, filename) {
		var lines = input.split('\n');

		var dir = path.dirname(filename);

		// The output file contains backgrounds, songs, and slides
		var file = {
			backgrounds: [ Const.INITIAL_BACKGROUND ],
			themes: [ ArgumentParser.getNormalizedPath(dir, Const.INITIAL_THEME) ],
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
			// SONG (0) or SLIDE (1).
			mode: Const.INITIAL_MODE,
			// the directory we're in
			dir: dir,
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
	 *     notes: string, only in song mode
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

			case 'include':
			parseIncludeDirective(args, file, parseState);
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
		args = ArgumentParser.getNormalizedPath(parseState.dir, args);
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
		args = ArgumentParser.parse(args);
		if (args[0] !== 'color')
			args[1] = ArgumentParser.getNormalizedPath(parseState.dir, args[1]);
		var backgroundIndex = getBackgroundIndex(file, args);
		if (backgroundIndex === -1) {
			file.backgrounds.push(args);
			if (slide) slide.background = file.backgrounds.length - 1;
			else parseState.backgroundInUse = file.backgrounds.length - 1;
		} else {
			if (slide) slide.background = backgroundIndex;
			else parseState.backgroundInUse = backgroundIndex;
		}
	}

	function parseLayoutDirective (args, file, parseState, slide) {
		args = ArgumentParser.parse(args);
		args[1] = ArgumentParser.getNormalizedPath(parseState.dir, args[1]);
		switch (args[0]) {
			case 'image':
			slide.layout = EpicFileReader.layout.IMAGE;
			slide.media = args[1];
			break;

			case 'video':
			slide.layout = EpicFileReader.layout.VIDEO;
			slide.media = args[1];
			break;

			case 'custom':
			slide.layout = EpicFileReader.layout.CUSTOM;
			slide.media = args[1];
			break;
		}
	}

	function parseIncludeDirective (args, file, parseState) {
		// Read in file
		var inFilename = ArgumentParser.getNormalizedPath(parseState.dir, args);
		var parsedFile = EpicFileReader.load(inFilename);

		// Merge theme arrays
		var themeMapping = {}; // Replace each slide in the child file that uses
		                       // the theme at index `key` to use the theme at
		                       // index `value`, representing the position of
		                       // the same theme in the merged theme array.
		parsedFile.themes.forEach(function (theme, i) {
			// If the theme in the child file is not in the theme array of the
			// parent file, add it
			var idx = file.themes.indexOf(theme);
			if (idx === -1) {
				idx = file.themes.length;
				file.themes[idx] = theme;
			}

			// Update references later...
			themeMapping[i] = idx;
		})

		// Do the same for background arrays
		var backgroundMapping = {};
		parsedFile.backgrounds.forEach(function (bg, i) {
			var idx = getBackgroundIndex(file, bg);
			if (idx === -1) {
				idx = file.backgrounds.length;
				file.backgrounds[idx] = bg;
			}

			backgroundMapping[i] = idx;
		})

		// Update theme and background references and push slides to parent
		// slide array
		parsedFile.slides.forEach(function (slide) {
			slide.theme = themeMapping[slide.theme];
			slide.background = backgroundMapping[slide.background];
			file.slides.push(slide);
		})
	}

	function parseSongContent (lines, slide, parseState) {
		var nextLine;
		slide.content = [];
		slide.notes = [];

		for (;;) {
			if (parseState.nextLineIndex >= lines.length)
				return;

			nextLine = lines[parseState.nextLineIndex++];

			if (nextLine[0] === '#' || nextLine[0] === '%') {
				parseState.nextLineIndex--;
				break;
			} else {
				slide.notes.push(nextLine);
			}
		}

		slide.notes = slide.notes.join('\n').trim();

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

	function getBackgroundIndex(file, background) {
		loop: for (var i = 0; i < file.backgrounds.length; i++) {
			var bg = file.backgrounds[i];
			if (bg.length !== background.length) continue;
			for (var j = 0; j < bg.length; j++)
				if (bg[i] !== background[j]) continue loop;
			return i;
		}

		return -1;
	}

	function skipBlankLines (lines, parseState) {
		for (; parseState.nextLineIndex < lines.length && lines[parseState.nextLineIndex].trim() === ''; parseState.nextLineIndex++);
	}

	return EpicFileReader;

})(EpicFileReader || {});
 