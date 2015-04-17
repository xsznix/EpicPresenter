'use strict';

// Third party libraries
var $, jQuery, Backbone, _, Markdown;
$ = jQuery = require('jquery').jQuery;
Backbone = require('backbone');
_ = require('underscore')._;
Markdown = require('markdown');

// Node GUI APIs
var gui = require('nw.gui');

// Show inspector (debug)
gui.Window.get().showDevTools();
