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

1. Create a gist on Github with one or more Markdown-syntax files.
2. Note the gist ID. (It's usually a longish alpha-numeric string like `dab5cf7977008e504213`.)
3. View your writing presented nicely at `nicegist.github.io/YOUR_GIST_ID`

**Bookmarklet:**

Be lazy and drag the [Nicegist bookmarklet](https://gist.githubusercontent.com/eyecatchup/7442b083383908d7c925981ff082fea7/raw/84f70d3cef6c5442b8898824fd69dc545352191f/nicegist-bookmarklet.js) to your bookmarks bar.  
Click it when you’re on a gist page, and it will take you to the corresponding Nicegist page.

```js
javascript:(function(){if(location.hostname==="gist.github.com"){var gistId=location.pathname.split("/").pop();if(location.pathname.split("/").length>2&&gistId.length)location.href="https://nicegist.github.io/"+gistId}})();
```

**Examples:**

- Code blocks: [Nicegist](https://nicegist.github.io/2f35faad4d4fa55810422283f7bc3b78), [Source](https://gist.github.com/eyecatchup/2f35faad4d4fa55810422283f7bc3b78)
- Tables: [Nicegist](https://nicegist.github.io/79b95b862ca276c0748c9bab90a758e0), [Source](https://gist.github.com/eyecatchup/79b95b862ca276c0748c9bab90a758e0)
- 💥 Embedded gists: [Nicegist](https://nicegist.github.io/3382937), [Source](https://gist.github.com/surma/3382937)
- Text formatting, images & more: [Nicegist](https://nicegist.github.io/96e67c2dd38419b200f9efcd56c2e8e3), [Source](https://gist.github.com/eyecatchup/96e67c2dd38419b200f9efcd56c2e8e3)
- Example writeup: [Nicegist](https://nicegist.github.io/dab5cf7977008e504213), [Source](https://gist.github.com/eyecatchup/dab5cf7977008e504213)

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
