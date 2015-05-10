'use strict';

var AssetStore = (function () {

	function AssetStore (filename, themeUrls, backgrounds) {
		this.themes = [];
		this.backgrounds = [];
		this.dir = path.dirname(filename);

		themeUrls.forEach(readTheme, this);
		backgrounds.forEach(readBackground, this);
	}

	AssetStore.prototype.getTheme = function (index) {
		return this.themes[index];
	}

	AssetStore.prototype.getBackground = function (index) {
		return this.backgrounds[index];
	}

	function readTheme (url, index) {
		var file = fs.readFileSync(url, { encoding: 'utf-8' });
		this.themes[index] = file;
	}

	function readBackground (args, index) {
		switch (args[0]) {
			case 'color':
			this.backgrounds[index] = new BackgroundModel({
				type: 'color',
				color: args[1] });
			break;

			case 'image':
			this.backgrounds[index] = new BackgroundModel({
				type: 'image',
				url: args[1],
				args: args.slice(2) });
			break;

			case 'video':
			this.backgrounds[index] = new BackgroundModel({
				type: 'video',
				url: args[1],
				args: args.slice(2) });
			break;

			default:
			throw new Error('Unrecognized background type: ' + args[0]);
		}
	}

	return AssetStore;

})();
