(window => {
    "use strict";

    /**
     * GitHub API wrapper
     */
    var GithubApi = {
        xhr: null,
        apiBaseUrl: 'https://api.github.com',
        githubStatusApiUrl: 'https://kctbh9vrtdwd.statuspage.io/api/v2/summary.json', // https://www.githubstatus.com/api
        getXMLHttpRequest: function() {
            if (!!window.XMLHttpRequest) {
                this.xhr = new window.XMLHttpRequest;
            } else {
                try {
                    this.xhr = new ActiveXObject("MSXML2.XMLHTTP.3.0");
                } catch (e) {
                    this.xhr = null;
                }
            }
        },
        get: function(requestUrl, success, failure) {
            this.getXMLHttpRequest();

            if (!this.xhr) {
                window.console.log("AJAX (XMLHTTP) not supported by your client.");
                failure({
                    status: 'error',
                    msg: 'AJAX (XMLHTTP) not supported by your client but required for Nicegist to work, sorry.'
                });
                return;
            }

            var self = this.xhr;

            this.xhr.open('GET', requestUrl, true);
            this.xhr.setRequestHeader('Accept', 'application/json');
            this.xhr.timeout = 1500; // time in milliseconds

            self.onload = function() {
                if (self.status >= 200 && self.status < 400) {
                    window.console.log('Successfully called ' + requestUrl);
                    try {
                        var json = JSON.parse(self.responseText);
                    } catch (e) {
                        window.console.log('Error parsing response as JSON. Returning raw response data.');
                    }

                    var response = !json ? self.responseText : json;
                    success(response);
                }
                else {
                    window.console.log('Error requesting ' + requestUrl +
                        '. Response Status-Code is ' + self.status);
                    failure({
                        status: 'error',
                        msg: 'Error when fetching Gist. Gist API returned a ' + self.status + ' response code.'
                    });
                }
            }
            self.onerror = function() {
                window.console.log('There was an error (of some sort) connecting to ' + requestUrl);
                failure({
                    status: 'error',
                    msg: 'Error when fetching Gist.'
                });
            };
            self.ontimeout = _ => {
                window.console.log('Connecting to ' + requestUrl + ' timed out');
                if (requestUrl !== this.githubStatusApiUrl) {
                    this.getGithubApiStatus(response => {
                        if (response && response.components) {
                            for (var i in response.components) {
                                // brv1bkgrwx7q = id for "GitHub APIs" component
                                if (response.components[i].id === 'brv1bkgrwx7q' && response.components[i].status !== 'operational') {
                                    failure({
                                        status: 'error',
                                        msg: 'The GitHub API is currently not fully operational. Sorry, but nothing we can do right now.'
                                    });
                                }
                            }
                            failure({
                                status: 'error',
                                msg: 'API timeout error when fetching Gist.'
                            });
                        } else {
                            failure({
                                status: 'error',
                                msg: 'API timeout error when fetching Gist.'
                            });
                        }
                    }, error => {
                        failure({
                            status: 'error',
                            msg: 'API timeout error when fetching Gist.'
                        });
                    });
                } else {
                    failure({
                        status: 'error',
                        msg: 'API timeout error when fetching Gist AND when fetching the GitHub API status. Sorry, but nothing we can do right now.'
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
    var $ = selector => {
        return document.querySelector(selector);
    };

    // simple IE user agent detection
    var isIE = /Trident|MSIE/.test(window.navigator.userAgent);

    // smooth anchor scrolling
    var smoothScrollTo = elem => {
        window.scroll({
            behavior: 'smooth',
            left: 0,
            top: elem.getBoundingClientRect().top + window.scrollY
        });
    };

    // not-so-smooth anchor scrolling for IE
    var jankyScrollTo = (element, to, duration) => {
        if (duration <= 0) return;
        var difference = to - element.scrollTop;
        var perTick = difference / duration * 10;

        setTimeout(_ => {
            element.scrollTop = element.scrollTop + perTick;
            if (element.scrollTop === to) return;
            jankyScrollTo(element, to, duration - 10);
        }, 10);
    };

    // smooth scrolling stub
    var scrollToElem = elemSelector => {
        if (!elemSelector) {
            return;
        }

        var elem = $(elemSelector);
        if (elem) {
            if (!isIE) {
                smoothScrollTo(elem);
            } else {
                var root = document.documentElement || document.body;
                jankyScrollTo(root, elem.offsetTop, 600);
            }
        }
    };

    /**
     * Nicegist
     */
    var Nicegist = {
        gist: null,
        files: {
            markdown: [],
            others: []
        },
        isHomepage: false,
        init: function() {
            var gistId = '';

            // get the gist id
            var redirect = window.sessionStorage.redirect;
            delete window.sessionStorage.redirect;

            if (redirect && redirect !== window.location.href) {
                // redirected via 404 page hack
                window.history.replaceState(null, null, redirect);
                gistId = redirect.split('/').pop().split('?', 1)[0].split('#', 1)[0];
            } else {
                // direct entry
                var parseQueryString = (pairList => {
                    var pairs = {};
                    for (var i = 0; i < pairList.length; ++i) {
                        var keyValue = pairList[i].split('=', 2);
                        if (keyValue.length == 1) {
                            pairs[keyValue[0]] = '';
                        } else {
                            pairs[keyValue[0]] = decodeURIComponent(keyValue[1].replace(/\+/g, ' '));
                        }
                    }
                    return pairs;
                })(window.location.search.substr(1).split('&'));

                gistId = parseQueryString['id'];
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
            var codeBlocks = document.querySelectorAll('pre');
            for (var c in codeBlocks) {
                try {
                    hljs.highlightBlock(codeBlocks[c]);
                } catch(e) {}
            }

            // open external links in new tab and
            // attach smooth scrolling to internal anchor links
            setTimeout(function() {
                for (var c = document.getElementsByTagName("a"), i = 0; i < c.length; i++) {
                    var a = c[i];
                    if (a.getAttribute("href") && a.hash && a.hash.length && a.hash[0] === '#' && a.hostname === window.location.hostname) {
                        a.addEventListener('click', function(e) {
                            e.preventDefault();
                            var elem = e.target.nodeName === 'A' ? e.target : e.target.parentNode;
                            if (elem.hash) {
                                scrollToElem(elem.hash);
                                window.history.pushState(null, null, elem.hash);
                            }
                        });
                    } else if (a.getAttribute("href") && a.hostname !== window.location.hostname) {
                        a.target = "_blank";
                    }
                }
            }, 500);

            // smooth-scroll to anchor, if present in request URL
            if (window.location.hash.length) {
                setTimeout(_ => {scrollToElem(window.location.hash)}, 500);
            }
        },
        loadGist: function(gistId) {
            var $titleHolder =  $('#titleHolder'),
                $contentHolder = $('#gistContent');

            var hideLoadingIndicator = _ => {
                $('#loadingIndicator').style.display = 'none';
            };

            var getIframeHeight = filename => {
                for (var i in this.files.others) {
                    if (this.files.others[i].filename === filename) {
                        var matches = this.files.others[i].content.match(/\n/g);
                        var lines = ((matches && matches.length) ? matches.length : 0) + 1;
                        // 22px = line height in embedded gists (with .pibb extension)
                        // 40px = embedded gists footer height
                        // 3px = cumulated border height for embedded gists
                        // 8px = body margin for embedded gists
                        return (lines * 22) + 40 + 3 + 8;
                    }
                }
                return false;
            };

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
                        for (var n in gist.files) {
                            if (gist.files[n].language === 'Markdown') {
                                this.files.markdown.push(gist.files[n]);
                            } else {
                                this.files.others.push(gist.files[n]);
                            }
                        }

                        // parse markdown files
                        if (this.files.markdown.length) {
                            var html = '';

                            try {
                                var md = window.markdownit({linkify: true});
                            } catch(e) {}

                            if (!md) {
                                $titleHolder.textContent = 'Markdown-parser error, please try to reload.';
                                return;
                            }

                            md.use(window.markdownItAnchor, {
                                level: 1,
                                permalink: true,
                                permalinkClass: 'header-anchor',
                                permalinkSymbol: '¶',
                                permalinkBefore: true,
                                slugify: str => {
                                    // use custom slugify function to fix several issues with anchor generation (special chars related)
                                    str = encodeURIComponent(String(str).trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g,"-"));
                                    if (/[0-9]/.test(str[0])) { // ids must not start with a number
                                        var x = str.split('-', 1);
                                        str = str.substring((x[0].length + 1));
                                    }
                                    return str;
                                }
                            });

                            this.files.markdown.forEach(file => {
                                html += md.render(file.content);
                            });

                            // handle custom embed tags
                            html = html.replace(/&lt;gist&gt;(.*?)&lt;\/gist&gt;/gi, match => {
                                var filename = match.replace(/&lt;\/?gist&gt;/g, '');
                                var height = getIframeHeight(filename);
                                return !height ? match : `<iframe class="embedded-gist" style="height:${height}px" src="https://gist.github.com/${gistId}.pibb?file=${filename}" scrolling="no"></iframe>`;
                            });

                            // write gist content
                            $contentHolder.innerHTML = html;

                            // add author details
                            if (!this.isHomepage) {
                                var username = !gist.owner ? 'ghost' : gist.owner.login; // when a gist user was deleted, github uses a "ghost" label
                                var avatar = !gist.owner ? 'https://avatars3.githubusercontent.com/u/10137' : gist.owner.avatar_url;
                                var gistAuthor = !gist.owner ? `<span class="username">${username}</span>` : `<a href="${gist.owner.html_url}" class="username">${username}</a>`;
                                $('#gistAuthor').innerHTML = gistAuthor;
                                $('#gistPubDate').innerHTML = `<a href="${gist.html_url}">${gist.created_at}</a>`;
                                $('#authorAvatar').innerHTML = `<img class="avatar" height="26" width="26" alt="@${username}" src="${avatar}?s=24&amp;v=4">`;
                                $('#authorHolder').style.display = 'block';
                            }

                            // add gist comments, if we have
                            if (!this.isHomepage && gist.comments > 0) {
                                this.loadGistComments();
                            } else {
                                this.finish();
                            }
                        } else {
                            $contentHolder.textContent = 'No markdown files attached to gist ' + gistId;
                        }
                    }
                }
            }, error => {
                console.warn(error);
                hideLoadingIndicator();
                $titleHolder.textContent = error.msg;
            });
        },
        loadGistComments: function() {
            var getCommentHTML = (comment, renderedMarkdown) => {
                var username = !comment.user ? 'ghost' : comment.user.login; // when a gist user was deleted, github uses a "ghost" label
                var avatar = !comment.user ? 'https://avatars3.githubusercontent.com/u/10137' : comment.user.avatar_url;
                var commentUsername = !comment.user ? `<span class="username">${username}</span>` : `<a href="${comment.user.html_url}" class="username">${username}</a>`;
                return `<div class="comment-block">
                            <div class="comment" id="comment-${comment.id}">
                                <div class="comment-block-title">
                                    <img class="avatar" height="32" width="32" alt="@${username}" src="${avatar}?s=88&amp;v=4">
                                    <div class="comment-block-meta">
                                        ${commentUsername}<br>
                                        commented on <a href="#comment-${comment.id}"><time class="timestamp" datetime="${comment.created_at}">${comment.created_at}</time></a>
                                    </div>
                                </div>
                                <div class="comment-block-comment">
                                    <div class="comment-body">${renderedMarkdown}</div>
                                </div>
                            </div>
                        </div>`;
            };

            var commentsHTML = `
                    <h2>
                        <a class="header-anchor" href="#gist-comments" aria-hidden="true">¶</a>
                        ${this.gist.comments} ${this.gist.comments > 1 ? 'Comments' : 'Comment'}
                    </h2>
                    <p>
                        <a target="_blank" href="${this.gist.html_url}#partial-timeline-marker">
                            Add comment on Gist
                        </a>
                    </p>`;

            GithubApi.getGistComments(this.gist.id, comments => {
                if (comments && comments.length) {
                    // create a new instance, since we don't want to create anchor links within comments
                    var md = window.markdownit({linkify: true});
                    comments.forEach(comment => {
                        commentsHTML += getCommentHTML(comment, md.render(comment.body));
                    });
                    $('#gist-comments').style.display = 'block';
                    $('#gist-comments').innerHTML = commentsHTML;
                    this.finish();
                }
            }, error => {
                console.warn(error);
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
