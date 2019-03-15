# _Nicegist_ - a permanent gist.io alternative

> writing for hackers · zero setup · publish in seconds

**A pure JavaScript gist.io replacement, hosted on GitHub***.

_* As long as GitHub exists, it will not die. Yay!_

## About

When I recognized that [gist.io](https://github.com/idan/gistio) is dead, I stumbled upon [a comment](https://github.com/idan/gistio/issues/74#issuecomment-348884248) in gist.io's issue tracker, that suggested to build a pure JavaScript implementation to be hosted on GitHub pages.

I liked the idea. Thus, _Nicegist_ was born.

## Features

- 💥 Supports gist embedding (use `<gist>` tags, i.e. `<gist>file.sh</gist>`)
- Supports public and secret gists
- Supports CommonMark / GFM syntax
- Automatic code block syntax highlighting
- Automatic headline anchors

## Usage

1. Create a [Gist on Github](https://gist.github.com/) with one or more [Markdown-syntax](https://daringfireball.net/projects/markdown/) files.
2. Note the Gist ID at the end of the Gist URL.  
_(It's a longish alpha-numberic string like `dab5cf7977008e504213`.)_
3. View your writing presented nicely at `nicegist.github.io/YOUR_GIST_ID`

### Examples

- Code blocks: [Nicegist](https://nicegist.github.io/2f35faad4d4fa55810422283f7bc3b78), [Source](https://gist.github.com/eyecatchup/2f35faad4d4fa55810422283f7bc3b78)
- Tables: [Nicegist](https://nicegist.github.io/79b95b862ca276c0748c9bab90a758e0), [Source](https://gist.github.com/eyecatchup/79b95b862ca276c0748c9bab90a758e0)
- 💥 Embedded gists: [Nicegist](https://nicegist.github.io/3382937), [Source](https://gist.github.com/surma/3382937)
- 💥 Embedded interactive map: [Nicegist](https://nicegist.github.io/39e869f768a34ae3e8c4b81f733bfe42), [Source](https://gist.github.com/eyecatchup/39e869f768a34ae3e8c4b81f733bfe42)
- Text formatting, images & more: [Nicegist](https://nicegist.github.io/96e67c2dd38419b200f9efcd56c2e8e3), [Source](https://gist.github.com/eyecatchup/96e67c2dd38419b200f9efcd56c2e8e3)
- Example writeup: [Nicegist](https://nicegist.github.io/dab5cf7977008e504213), [Source](https://gist.github.com/eyecatchup/dab5cf7977008e504213)

### Content

The Gist's description field will be used as the title for your writing. You should structure your writing such that the highest-level heading is an H2, as the post title will be a first-level heading. 

Your Markdown file(s) can contain relative links to anchors, which _Nicegist_ will automatically create for each heading in your Markdown file(s).

You can also embed other files from your Gist in your Markdown file(s). _Nicegist_ supports custom `<gist>` tags. Let's say your Gist contains two files. A `example.md` and a `code.sh`. You could then use the custom embed tag in your `example.md` as follows: `<gist>code.sh</gist>`. _Nicegist_ will render these tags like in [this example](https://nicegist.github.io/3382937).

Check out the [examples](#examples) above for more clues on what you can and should do when writing for _Nicegist_. 

### Bookmarklet

Be lazy and drag the [_Nicegist_ bookmarklet](https://gist.githubusercontent.com/eyecatchup/7442b083383908d7c925981ff082fea7/raw/84f70d3cef6c5442b8898824fd69dc545352191f/nicegist-bookmarklet.js) to your bookmarks bar.  
Click it when you’re on a gist page, and it will take you to the corresponding Nicegist page.

```js
javascript:(function(){if(location.hostname==="gist.github.com"){var gistId=location.pathname.split("/").pop();if(location.pathname.split("/").length>2&&gistId.length)location.href="https://nicegist.github.io/"+gistId}})();
```

## Under the hood

- [GitHub Gist API](https://developer.github.com/v3/gists/#get-a-single-gist) for fetching gists
- [Chromium destilled webpage layout](https://chromium.googlesource.com/chromium/src/+/refs/heads/master/components/dom_distiller/) for optimized reading experience
- [markdown-it](https://github.com/markdown-it/markdown-it) for Markdown parsing
- [markdown-it-anchor](https://github.com/valeriangalliat/markdown-it-anchor) for automated header anchors
- [highlight.js](https://highlightjs.org/) for code block syntax highlighting
- Some regex sugar and a hidden gist feature for gist embedding
- [GitHub Pages SPA hack](http://www.backalleycoder.com/2016/05/13/sghpa-the-single-page-app-hack-for-github-pages/) for pretty URLs

## License

(c) 2019, Stephan Schmitz <eyecatchup@gmail.com>  
License: MIT, <http://eyecatchup.mit-license.org>  
URL: <https://nicegist.github.io/>  
