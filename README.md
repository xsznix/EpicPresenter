# EpicPresenter

EpicPresenter is a minimalist piece of presentation software specifically designed to display worship lyrics, message slides, and announcements for small congregations.

## Features

* Simple, text-based file format
* Use Markdown in text slides
* Display images and video both locally and directly from the web
* Fade between slides
* Seamlessly looping background videos
* Theming via CSS
* Custom HTML slides for complete control over appearance
* Import other files, so you can reuse songs or slides for announcements

## Usage

### Prerequisites

* [NodeJS](https://nodejs.org/download/)
* [nwjs](https://github.com/nwjs/nw.js)
* Optional: [Google Chrome](https://www.google.com/chrome/)

### Installing

1. Put the copy of `nwjs.app` (OS X) or the extracted contents of `nwjs-....zip` (Windows) in a directory.
2. Download (and extract) or clone this repository into the same directory.
3. In the same directory, run the command `npm install` in a shell.
4. (Optional) Enable MP4 video support using [this tutorial](https://github.com/nwjs/nw.js/wiki/Using-MP3-&-MP4-(H.264)-using-the--video--&--audio--tags.).

### Running

Double click `nwjs.app` (OS X) or `nwjs.exe` to start EpicPresenter.

## File format

### Quick Start

There is an [example presentation file](https://github.com/xsznix/EpicPresenter/blob/master/presentations/example.pres) you can copy if you want to just jump in. For a quick start, load up the example file in EpicPresenter and deduce what each part of the file does by inspection in your favourite text editor.

### Overview

Each presentation file contains a list of *songs* and *slides*. Each song contains several slides, which display different sections of the song's lyrics. Each slide (not song) can be one of several different layouts: the currently supported layouts are *text*, *image*, *video*, and *custom*. Each song or slide has a *background* and a *theme*, which can be specified for a specific slide or for a section of slides. A background can be a *color*, *image*, or *video*. A theme is a CSS file that defines certain aspects such as font, text size, text alignment, and spacing.

### Slide

Here is an example of a slide:

```
# Slide title

You can use *Markdown* here!

* Here is a bullet point
* Here is another bullet point
```

The slide has two basic components: the *title* and the *content*. A slide title is any line that begins with the pound character `#`. (The `#` symbol is omitted when the slide is displayed.) Whenever a line that begins with `#` is encountered, it and the lines after it up to the next title (or the end of the file) are interpreted as a slide. Anything after the slide title becomes the slide content.

Slide content is interpreted as Markdown. An example of Markdown syntax can be found [here](http://www.markitdown.net/markdown), and the original documentation can be found [here](https://daringfireball.net/projects/markdown/basics). Using Markdown allows you to intuitively add rich formatting to your slide contents, including bold and italics, bulleted and numbered lists, and block quotes.

If you want to include headings in your slide content, you can add a backslash `\` before the hash `#` at the beginning of your heading, which will tell EpicPresenter to pass the line (without the backslash) to Markdown instead of interpreting it as the title for the next slide.

Blank lines between slide (or song) titles and content are not displayed. If there are slide-scoped directives after the song title, blank lines between the directives and the slide content are not displayed.

### Song

Here is an example of a song:

```
# Song Title

## Verse

lyrics lyrics lyrics
lyrics lyrics lyrics
lyrics lyrics lyrics

## Chorus

more lyrics more lyrics
more lyrics more lyrics
```

A song has a title, which is specified in the same way as a slide title, but each song contains several sub-slides which are delimited with lines that start with two pounds, `##`. The song title and the label of each sub-slide in the song are not displayed in the presentation, but are displayed in the presenter's slide list to help quickly identify slides.

Song lyrics are *not* interpreted as Markdown.

### Directives

A directive is a line that begins with `%`. Directives specify mode, layout, background, and theme. They also allow the embedding of other presentations inside a single presentation. Some examples:

```
%mode song
%layout image 'images/some flowers.jpg'
%background color #888888
%theme $themes/my-theme.css
%include songs/my-song.pres
```

There can not be a space between the `%` sign and the name of the directive.

For directives that take file names or URLs as parameters, if there is a space in the parameter, it must be quoted with either single quotes `'` or double quotes `"`. If there are also quotes in the file name, the quotes can be escaped with a backslash.

For example, there are two equivalent ways to include a background image at `images/my "cool" image.jpg`:

```
%background image 'images/my "cool" image.jpg'
%background image "images/my \"cool\" image.jpg"
```

Directives can be either *section-scoped* or *slide-scoped*. Section-scoped directives affect all slides that come after it up until the end of the file or until another of the same kind of directive is found: Slide-scoped directives only affect one slide.

Some types of directives can be one but not the other. These are explained in detail in later sections.

Section-scoped directives come between some slide content and the following slide title. For example, the following `background` directive is section-scoped and affects slides 2 and 3:

```
# Slide 1

Content 1

%background color #888888

# Slide 2

Content 2

# Slide 3

Content 3
```

The following `background` directive, on the other hand, is slide-scoped and only affects slide 2:

```
# Slide 1

Content 1

# Slide 2
%background color #888888

Content 2

# Slide 3

Content 3
```

Slide-scoped directives must be on the line immediately following the title of the slide they affect. If there are any blank lines between the slide title and the directive, they will not be interpreted as directives, and any text between the directive and the following slide or song title will be discarded.

#### Mode directive

The `mode` directive is an exclusively section-scoped directive that specifies whether the following slides are to be interpreted as songs or slides. Initially, each presentations starts in `song` mode, and each line that starts with `#` creates a new song. If you set the mode to `slides`,  further `#`s will be interpreted as slides instead of songs. (See the slide and song documentation above.)

Example:

```
%mode song

# Song

## Verse

This is a song!

## Refrain

This is the same song!

# Second Song

## Chorus

This is another song!

%mode slides

# Slide

This is a slide!

# Slide

This is another slide!
```

#### Layout directive

The `layout` directive is an exclusively slide-scoped directive that specifies the nature of the content displayed in a slide. The different types are:

* `text`, the default, in which the slide content is parsed as Markdown-enabled text
* `image`, in which an additional parameter loads an image, which is scaled and centred to fill up the available space. An optional short caption can accompany the image.
* `video`, in which an additional parameter loads a video, which is scaled and centred to fill up the available space. The video plays from the beginning whenever the slide is shown and pauses whenever the "Blank" button in the presenter view is clicked while on the slide with the video.
* `custom`, in which an additional parameter loads an HTML webpage. When the slide is shown, the `start()` JS function on the custom webpage is called if it exists, and when the slide is blanked out, the `pause()` JS function is similarly called if it exists.

Here are examples of all four layout directives:

```
%layout text
%layout image flower.jpg
%layout video "An Awesome Video.ogv"
%layout custom my_custom_slide.html
```

#### Background directive

The `background` directive specifies the background colour, image, or video of either a slide or a section of slides.

Background colours can be specified in [any format recognised by CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/color#Syntax).

Images and videos are scaled so that they always fill up all of the available space, so some cropping may occur if the aspect ratio of the image does not match the aspect ratio of the presentation screen. Aspect ratios are always preserved so that there is no stretching or compression.

Background videos loop seamlessly. If the same video is used for several slides, it will not restart whenever you go to a different slide, unlike certain presentation software (*cough* PowerPoint).

Examples:

```
%background color #000000
%background color blue
%background color rgb(26, 74, 38)
%background color hsl(0, 100%, 50%)

%background image flower.jpg

%background video lines.ogv
```

#### Theme directive

The `theme` directive specifies the theme (CSS stylesheet) that is applied to a slide or section of slides. It takes one parameter, the file name of the theme. The file name of the theme should *never* be in quotes and spaces do *not* need to be escaped.

Example:

```
%theme $themes/default.css
%theme my_custom_theme.css
%theme my other theme.css
```

#### Include directive

The `include` directive reads the specified file and adds the slides and songs in the file to the current presentation. Section-scoped directives do not apply to slides and songs that are added from within an `include` directive. The file name of the included file should *never* be in quotes and spaces do *not* need to be escaped.

Example:

```
%include announcements.pres
%include my other presentation.pres
```

### Relative file paths

Any references (in directives) to external files can be absolute, relative to the presentation directory, or relative to the directory containing EpicPresenter.

Absolute file paths begin with `/` on OS X and Linux and `C:\` or similar on Windows. If you move your presentation to a different location on your computer, your file references will not change. For example, if you include the image `C:\Users\me\Pictures\flower.jpg` in your presentation and you then move your presentation file, your image will still be in the same place.

File paths relative to the EpicPresenter directory start with `$`. To reference a file that you know will be in a place relative to EpicPresenter, such as themes in the `themes` directory, use a file path relative to EpicPresenter. For example, if you add another theme called `my_theme.css` to your copy of EpicPresenter's `themes` directory, you can reference it from any presentation that is stored anywhere on your computer using `$themes/my_theme.css`. If you copy the presentation that references `my_theme.css` to another computer, however, you must make sure that you copy your theme to the other computer inside the `themes` directory of its copy of EpicPresenter.

File paths relative to the presentation directory start with anything else. If you reference an image such as `flower.jpg` from a presentation that is stored in the same directory as your presentation, you must copy or move `flower.jpg` along with your presentation if you want to view your presentation on any other computer or from any other filesystem location on your computer.

## Licence

The MIT License (MIT)

Copyright (c) 2015 Xuming Zeng

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

