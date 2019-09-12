(window => {
    "use strict";

    /**
     * GitHub API wrapper
     */
    const GithubApi = {
        xhr: null,
        apiBaseUrl: 'https://api.github.com',
        githubStatusApiUrl: 'https://kctbh9vrtdwd.statuspage.io/api/v2/summary.json', // https://www.githubstatus.com/api
        getXMLHttpRequest: function() {
            if (!!window.XMLHttpRequest) {
                this.xhr = new window.XMLHttpRequest;
            } else {
                try {
                    this.xhr = new ActiveXObject('MSXML2.XMLHTTP.3.0');
                } catch (e) {
                    this.xhr = null;
                }
            }
        },
        get: function(requestUrl, success, failure) {
            this.getXMLHttpRequest();

            if (!this.xhr) {
                window.console.log('AJAX (XMLHTTP) not supported by your client.');
                failure({
                    status: 'error',
                    msg: 'AJAX (XMLHTTP) not supported by your client but required for Nicegist to work, sorry.'
                });
                return;
            }

            const self = this.xhr;

            this.xhr.open('GET', requestUrl, true);
            this.xhr.setRequestHeader('Accept', 'application/json');
            this.xhr.timeout = 1500; // time in milliseconds

            self.onload = _ => {
                if (self.status >= 200 && self.status < 300) {
                    window.console.log(`Successfully called ${requestUrl}.`);
                    try {
                        var json = JSON.parse(self.responseText);
                    } catch (e) {
                        window.console.log('Error parsing response as JSON. Returning raw response data.');
                    }

                    success((!json ? self.responseText : json));
                }
                else {
                    window.console.log(`Error requesting ${requestUrl}. Response Status-Code is ${self.status}.`);
                    let msg = self.status === 404
                        ? 'Invalid id? Gist API said "not found".'
                        : `Error when fetching Gist. Gist API returned a ${self.status} response code.`
                    failure({
                        status: 'error',
                        msg: msg
                    });
                }
            }
            self.onerror = _ => {
                window.console.log(`There was an error (of some sort) connecting to ${requestUrl}.`);
                failure({
                    status: 'error',
                    msg: 'Error when fetching Gist. Please try to reload.'
                });
            };
            self.ontimeout = _ => {
                window.console.log(`Connection to ${requestUrl} timed out.`);
                if (requestUrl !== this.githubStatusApiUrl) {
                    this.getGithubApiStatus(response => {
                        if (response && response.components) {
                            for (let i in response.components) {
                                // brv1bkgrwx7q = id for "GitHub APIs" component
                                if (response.components[i].id === 'brv1bkgrwx7q' && response.components[i].status !== 'operational') {
                                    failure({
                                        status: 'error',
                                        msg: 'The GitHub API is currently not fully operational. Sorry, but nothing we can do right now. Please check back later.'
                                    });
                                }
                            }
                            failure({
                                status: 'error',
                                msg: 'API timeout error when fetching Gist. Please try to reload.'
                            });
                        } else {
                            failure({
                                status: 'error',
                                msg: 'API timeout error when fetching Gist. Please try to reload.'
                            });
                        }
                    }, error => {
                        failure({
                            status: 'error',
                            msg: 'API timeout error when fetching Gist. Please try to reload.'
                        });
                    });
                } else {
                    failure({
                        status: 'error',
                        msg: 'API timeout error when fetching Gist AND when fetching the GitHub API status. Please try to reload or check back later.'
                    });
                }
            };

            this.xhr.send();
        },
        getGist: function(gistId, success, failure) {
            this.get(`${this.apiBaseUrl}/gists/${gistId}`, success, failure);
        },
        getGistComments: function(gistId, success, failure) {
            this.get(`${this.apiBaseUrl}/gists/${gistId}/comments`, success, failure);
        },
        getGithubApiStatus: function(success, failure) {
            this.get(this.githubStatusApiUrl, success, failure);
        }
    };

    window.GithubApi = GithubApi;
})(window);

((window, document) => {
    "use strict";

    /**
     * Nicegist helper functions
     */

    // querySelector shortcut
    const $ = selector => {
        return document.querySelector(selector);
    };

    // detect support for the behavior property in ScrollOptions
    const supportsNativeSmoothScroll = 'scrollBehavior' in document.documentElement.style ? true : false;

    // native smooth scrolling for Chrome, Firefox & Opera
    // @see: https://caniuse.com/#feat=css-scroll-behavior
    const nativeSmoothScrollTo = elem => {
        window.scroll({
            behavior: 'smooth',
            left: 0,
            top: elem.getBoundingClientRect().top + window.pageYOffset
        });
    };

    // polyfilled smooth scrolling for IE, Edge & Safari
    const smoothScrollTo = (to, duration) => {
        const element = document.scrollingElement || document.documentElement,
            start = element.scrollTop,
            change = to - start,
            startDate = +new Date();

        // t = current time
        // b = start value
        // c = change in value
        // d = duration
        const easeInOutQuad = (t, b, c, d) => {
            t /= d/2;
            if (t < 1) return c/2*t*t + b;
            t--;
            return -c/2 * (t*(t-2) - 1) + b;
        };

        const animateScroll = _ => {
            const currentDate = +new Date();
            const currentTime = currentDate - startDate;
            element.scrollTop = parseInt(easeInOutQuad(currentTime, start, change, duration));
            if(currentTime < duration) {
                requestAnimationFrame(animateScroll);
            }
            else {
                element.scrollTop = to;
            }
        };
        animateScroll();
    };

    // smooth scrolling stub
    const scrollToElem = elemSelector => {
        if (!elemSelector) {
            return;
        }

        let elem = $(elemSelector);
        if (elem) {
            if (supportsNativeSmoothScroll) {
                nativeSmoothScrollTo(elem);
            } else {
                smoothScrollTo(elem.offsetTop, 600);
            }
        }
    };

    /**
     * Nicegist
     */
    const Nicegist = {
        gist: null,
        files: {
            markdown: [],
            others: []
        },
        isHomepage: false,
        init: function() {
            let gistId = '';

            // get the gist id
            const redirect = window.sessionStorage.redirect;
            delete window.sessionStorage.redirect;

            if (redirect && redirect !== window.location.href) {
                // redirected via 404 page hack
                window.history.replaceState(null, null, redirect);
                gistId = redirect.split('/').pop().split('?', 1)[0].split('#', 1)[0];
            } else {
                // direct entry
                const parsedQueryString = (pairList => {
                    const pairs = {};
                    for (let i = 0; i < pairList.length; ++i) {
                        const keyValue = pairList[i].split('=', 2);
                        if (keyValue.length == 1) {
                            pairs[keyValue[0]] = '';
                        } else {
                            pairs[keyValue[0]] = decodeURIComponent(keyValue[1].replace(/\+/g, ' '));
                        }
                    }
                    return pairs;
                })(window.location.search.substr(1).split('&'));

                gistId = parsedQueryString.id;
            }

            if (typeof gistId === 'undefined' || gistId === '') {
                this.isHomepage = true;
                gistId = '7442b083383908d7c925981ff082fea7';
            }

            // load the gist
            this.loadGist(gistId);
            $(`#footer${!this.isHomepage ? 'Post' : 'Intro'}`).style.display = 'block';
        },
        finish: function() {
            // add syntax highlighting to code blocks
            const codeBlocks = document.querySelectorAll('pre');
            for (let c in codeBlocks) {
                try {
                    hljs.highlightBlock(codeBlocks[c]);
                } catch(e) {}
            }

            // open external links in new tab and
            // attach smooth scrolling to internal anchor links
            setTimeout(_ => {
                for (let c = document.getElementsByTagName('a'), i = 0; i < c.length; i++) {
                    const a = c[i];
                    if (a.getAttribute('href') && a.hash && a.hash.length && a.hash[0] === '#' && a.hostname === window.location.hostname) {
                        a.addEventListener('click', function(e) {
                            e.preventDefault();
                            const elem = e.target.nodeName === 'A' ? e.target : e.target.parentNode;
                            if (elem.hash) {
                                scrollToElem(elem.hash);
                                window.history.pushState(null, null, elem.hash);
                            }
                        });
                    } else if (a.getAttribute('href') && a.hostname !== window.location.hostname) {
                        a.target = '_blank';
                    }
                }
            }, 500);

            // smooth-scroll to anchor, if present in request URL
            if (window.location.hash.length) {
                setTimeout(scrollToElem(window.location.hash), 500);
            }
        },
        loadGist: function(gistId) {
            const $titleHolder =  $('#titleHolder');
            const $contentHolder = $('#gistContent');

            const hideLoadingIndicator = _ => {
                $('#loadingIndicator').style.display = 'none';
            };

            // Since we can not access the iframe to get its scroll height (cross origin),
            // we calculate the height by counting the lines in the embedded gist.
            // Ugly, but works (mostly) reliable.
            const getIframeHeight = filename => {
                for (let i in this.files.others) {
                    if (this.files.others[i].filename === filename) {
                        const matches = this.files.others[i].content.match(/\n/g);
                        const lines = ((matches && matches.length) ? matches.length : 0) + 1;
                        // 22px = line height in embedded gists (with .pibb extension)
                        // 40px = embedded gists footer height
                        // 3px = cumulated border height for embedded gists
                        // 8px = body margin for embedded gists
                        return (lines * 22) + 40 + 3 + 8;
                    }
                }
                return false;
            };

            // (try to) load the given gist from the GitHub Gist API
            GithubApi.getGist(gistId, gist => {
                if (gist) {
                    this.gist = gist;
                    console.dir(gist);
                    hideLoadingIndicator();

                    if (gist.id && gist.id.length) {
                        // use gist description as a document title / headline
                        if (gist.description.length) {
                            $titleHolder.textContent = gist.description;
                            document.title = gist.description;
                        } else {
                            $titleHolder.textContent = 'Untitled document';
                        }

                        // get all markdown files to be parsed
                        for (let n in gist.files) {
                            if (gist.files[n].language === 'Markdown') {
                                this.files.markdown.push(gist.files[n]);
                            } else {
                                this.files.others.push(gist.files[n]);
                            }
                        }

                        // parse markdown files
                        if (this.files.markdown.length) {
                            let html = '';

                            try {
                                // (try to) init markdown-it parser library
                                var md = window.markdownit({linkify: true});
                            } catch(e) {}

                            if (!md) {
                                $titleHolder.textContent = 'Markdown-parser error, please try to reload.';
                                return;
                            }

                            // configure the markdown-it-anchor plugin (for this parser instance)
                            md.use(window.markdownItAnchor, {
                                level: 1,
                                permalink: true,
                                permalinkClass: 'header-anchor',
                                permalinkSymbol: '¶',
                                permalinkBefore: true,
                                slugify: str => {
                                    // use custom slugify function, which reassembles the GitHub way of creating anchors
                                    str = encodeURIComponent(String(str).trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-'));
                                    if (/[0-9]/.test(str[0])) { // ids must not start with a number
                                        str = str.substring((str.split('-', 1)[0].length + 1));
                                    }
                                    if (str.substr(-1) === '-') { // ids must not end with a dash ("-")
                                        str = str.slice(0, -1);
                                    }
                                    return str;
                                }
                            });

                            md.use(window.markdownitTaskLists, {enabled: true});

                            // render markdown
                            this.files.markdown.forEach(file => {
                                html += md.render(file.content);
                            });

                            // replace custom embed tags (Nicegist-specific feature)
                            html = html.replace(/&lt;gist&gt;(.*?)&lt;\/gist&gt;/gi, match => {
                                const filename = match.replace(/&lt;\/?gist&gt;/g, '');
                                const height = getIframeHeight(filename);
                                return !height ? match : `<iframe class='embedded-gist' style='height:${height}px' src='https://gist.github.com/${gistId}.pibb?file=${filename}' scrolling='no'></iframe>`;
                            });

                            // write content HTML
                            $contentHolder.innerHTML = html;

                            // add author details
                            if (!this.isHomepage) {
                                const username = !gist.owner ? 'ghost' : gist.owner.login; // when a gist user was deleted, github uses a "ghost" label
                                const avatar = !gist.owner ? 'https://avatars3.githubusercontent.com/u/10137' : gist.owner.avatar_url;
                                const gistAuthor = !gist.owner ? `<span class='username'>${username}</span>` : `<a href='${gist.owner.html_url}' class='username'>${username}</a>`;
                                $('#gistAuthor').innerHTML = gistAuthor;
                                $('#gistPubDate').innerHTML = `<a href='${gist.html_url}'>${gist.created_at}</a>`;
                                $('#authorAvatar').innerHTML = `<img class='avatar' height='26' width='26' alt='@${username}' src='${avatar}?s=24&amp;v=4'>`;
                                $('#authorHolder').style.display = 'block';
                            }

                            // finally, load comments, if we have some..
                            if (!this.isHomepage && gist.comments > 0) {
                                this.loadGistComments();
                            } else {
                                // ..else, finish
                                this.finish();
                            }
                        } else {
                            $contentHolder.textContent = `No markdown files attached to gist ${gistId}.`;
                        }
                    }
                }
            }, error => {
                console.warn(error);
                hideLoadingIndicator();

                // if loading the gist from GitHub API fails, display a helpful error message
                $titleHolder.textContent = error.msg;
            });
        },
        loadGistComments: function() {
            const getCommentHTML = (comment, renderedMarkdown) => {
                const username = !comment.user ? 'ghost' : comment.user.login; // when a gist user was deleted, github uses a "ghost" label
                const avatar = !comment.user ? 'https://avatars3.githubusercontent.com/u/10137' : comment.user.avatar_url;
                const commentUsername = !comment.user ? `<span class='username'>${username}</span>` : `<a href='${comment.user.html_url}' class='username'>${username}</a>`;
                return `
                    <div class='comment-block'>
                        <div class='comment' id='comment-${comment.id}'>
                            <div class='comment-block-title'>
                                <img class='avatar' height='32' width='32' alt='@${username}' src='${avatar}?s=88&amp;v=4'>
                                <div class='comment-block-meta'>
                                    ${commentUsername}<br>
                                    commented on <a href='#comment-${comment.id}'><time class='timestamp' datetime='${comment.created_at}'>${comment.created_at}</time></a>
                                </div>
                            </div>
                            <div class='comment-block-comment'>
                                <div class='comment-body'>${renderedMarkdown}</div>
                            </div>
                        </div>
                    </div>`;
            };

            // (try to) load the comments for the given gist from the GitHub Gist API
            GithubApi.getGistComments(this.gist.id, comments => {
                if (comments && comments.length) {
                    let commentsHTML = `
                        <h2>
                            <a class='header-anchor' href='#gist-comments' aria-hidden='true'>¶</a>
                            ${this.gist.comments} ${this.gist.comments > 1 ? 'Comments' : 'Comment'}
                        </h2>
                        <p>
                            <a target='_blank' href='${this.gist.html_url}#partial-timeline-marker'>
                                Add comment on Gist
                            </a>
                        </p>`;

                    // create new markdown-it instance, since
                    // we don't want to render anchor links within comments
                    const md = window.markdownit({linkify: true});

                    // render markdown
                    comments.forEach(comment => {
                        commentsHTML += getCommentHTML(comment, md.render(comment.body));
                    });

                    // write comments HTML
                    $('#gist-comments').innerHTML = commentsHTML;
                    $('#gist-comments').style.display = 'block';

                    // finish
                    this.finish();
                }
            }, error => {
                console.warn(error);
                // fail silently when loading comments and just finish
                this.finish();
            });
        }
    };

    window.onhashchange = function(e) {
        e.preventDefault();
        scrollToElem(location.hash);
    };

    window.Nicegist = Nicegist;
})(window, document);

(_ => {
    Nicegist.init();
})();
