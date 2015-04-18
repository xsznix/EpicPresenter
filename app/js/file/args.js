'use strict';

var ArgumentParser = (function (ArgumentParser) {

	/*
	 * Takes a string and splits it into its arguments, which are space-
	 * separated and may contain multi-word quoted arguments, such as:
	 * arg1 arg2 "arg3 is long" 'arg4 has \'escaped quotes\''
	 */
	ArgumentParser.parse = function (string) {
		var i = 0, len = string.length;
		var quote = null;
		var args = [], current;

		while (i < len) {
		current = '';

			// parse quoted argument
			if (string[i] === '"' || string[i] === "'") {
				quote = string[i++];

				for (;; i++) {
					if (string[i] === '\\' && string[i + 1] === quote) {
						current += quote;
						i += 2;
					} else if (i >= len || string[i] === quote) {
						args.push(current);
						i++;
						if (string[i] !== ' ')
							throw new Error(
								'Quoted argument must be followed by a space');
						break;
					}
					current += string[i];
				}
			}

			// parse non-quoted argument
			else {
				for (;; i++) {
					if (i >= len || string[i] === ' ') {
						args.push(current);
						break;
					}
					current += string[i];
				}
			}

			i++;
		}

		return args;
	}

	/*
	 * There are three types of paths that are resolved in this method:
	 * - paths relative to the root directory of the EpicPresenter program,
	 *   which are prefixed with "$"
	 * - paths relative to the directory of the current file, as defined by
	 *   `path.isAbsolute`
	 * - absolute paths
	 * Each must be resolved properly relative to both the location of the
	 * presenter program and the presentation file.
	 */
	ArgumentParser.getNormalizedPath = function (dir, filename) {
		if (filename[0] === '$')
			return path.resolve(process.cwd(), filename.substring(1));
		else if (path.isAbsolute(filename))
			return filename;
		else
			return path.resolve(dir, filename);
	}

	return ArgumentParser;

})(ArgumentParser || {});
