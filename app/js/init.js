'use strict';

// Libraries
var fs, path, util, Markdown;
fs = require('fs');
path = require('path');
util = require('util');
Markdown = require('markdown');

// Node GUI APIs
var gui = require('nw.gui');

// Show inspector (debug)
gui.Window.get().showDevTools();
