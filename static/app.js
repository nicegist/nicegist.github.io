(window => {
    var GithubApi = {
        xhr: null,
        apiBaseUrl: 'https://api.github.com',
        githubStatusApiUrl: 'https://kctbh9vrtdwd.statuspage.io/api/v2/summary.json',
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

            var self = this.xhr;

            this.xhr.open('GET', requestUrl, true);
            this.xhr.setRequestHeader('Accept', 'application/json');
            this.xhr.timeout = 1000; // time in milliseconds

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
            var endpoint = '/gists/' + gistId;
            this.get(this.apiBaseUrl + endpoint, success, failure);
        },
        getGistComments: function(gistId, success, failure) {
            var endpoint = '/gists/' + gistId + '/comments';
            this.get(this.apiBaseUrl + endpoint, success, failure);
        },
        getGithubApiStatus: function(success, failure) {
            this.get(this.githubStatusApiUrl, success, failure);
        }
    };

    window.GithubApi = GithubApi;
})(window);

var $ = selector => {
    return document.querySelector(selector);
};

var hideLoadingIndicator = _ => {
    $('#loadingIndicator').style.display = 'none';
};

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

var scrollToElem = elemSelector => {
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

// Since we can not access the iframe to get its scroll height (cross origin),
// we calculate the height by counting the lines in the embedded gist.
// Ugly, but works (mostly) reliable.
var getIframeHeight = filename => {
    for (var i in files.others) {
        if (files.others[i].filename === filename) {
            var matches = files.others[i].content.match(/\n/g);
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

var getCommentHTML = (comment, renderedMarkdown) => {
    var username = comment.user === null ? 'ghost' : comment.user.login; // when a gist user was deleted, github uses a "ghost" label
    var avatar = comment.user === null ? 'https://avatars3.githubusercontent.com/u/10137' : comment.user.avatar_url;
    var commentUsername = comment.user === null ? `<span class="username">${username}</span>` : `<a href="${comment.user.html_url}" class="username">${username}</a>`;
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

var handleLinks = _ => {
    for (var c = document.getElementsByTagName("a"), i = 0; i < c.length; i++) {
        var a = c[i];
        if (a.getAttribute("href") && a.hash && a.hash.length && a.hash[0] === '#' && a.hostname === location.hostname) {
            // attach smooth scrooling to internal anchor links
            a.addEventListener('click', function(e) {
                e.preventDefault();
                var elem = e.target.nodeName === 'A' ? e.target : e.target.parentNode;
                if (elem.hash) {
                    scrollToElem(elem.hash);
                    history.pushState(null, null, elem.hash);
                }
            });
        } else if (a.getAttribute("href") && a.hostname !== location.hostname) {
            a.target = "_blank"; // open external links in new tab
        }
    }
};

var init = gistId => {
    if (typeof gistId === 'undefined' || gistId === '') {
        isHomepage = true;
    }
    loadGist(!isHomepage ? gistId : '7442b083383908d7c925981ff082fea7');
    $('#' + (!isHomepage ? 'footerPost' : 'footerIntro')).style.display = 'block';
};

var finish = _ => {
    // add syntax highlighting to code blocks
    var codeBlocks = document.querySelectorAll('pre');
    for (var c in codeBlocks) {
        try {
            hljs.highlightBlock(codeBlocks[c]);
        } catch(e) {}
    }

    // open external links in new tab and
    // attach smooth scrolling to internal anchor links
    setTimeout(handleLinks, 500);

    if (location.hash.length) {
        // smooth-scroll to anchor
        setTimeout(_ => {scrollToElem(location.hash)}, 500);
    }
};

var loadGist = gistId => {
    GithubApi.getGist(gistId, gist => {
        if (gist) {
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
                        files.markdown.push(gist.files[n]);
                    } else {
                        files.others.push(gist.files[n]);
                    }
                }

                // parse markdown files
                if (files.markdown.length) {
                    var html = '';
                    var md = window.markdownit({linkify: true});
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

                    files.markdown.map(file => {
                        html += md.render(file.content);
                    });

                    // do we need to embed other gists?
                    var matches = html.match(/&lt;gist&gt;(.*?)&lt;\/gist&gt;/gi);
                    if (matches && matches.length) {
                        matches.map(match => {
                            var filename = match.replace('&lt;gist&gt;', '').replace('&lt;/gist&gt;', '');
                            var height = getIframeHeight(filename);
                            if (height !== false) {
                                html = html.replace(match, '<iframe class="embedded-gist" style="height:' + height + 'px" src="https://gist.github.com/' + gistId + '.pibb?file=' + filename + '" scrolling="no"></iframe>');
                            }
                        });
                    }

                    // write gist content
                    $contentHolder.innerHTML = html;

                    // add author details
                    if (!isHomepage) {
                        $('#gistAuthor').innerHTML = `<a href="${gist.owner.html_url}">@${gist.owner.login}</a>`;
                        $('#gistPubDate').innerHTML = `<a href="${gist.html_url}">${gist.created_at}</a>`;
                        $('#authorHolder').style.display = 'block';
                    }

                    // add gist comments, if we have
                    if (!isHomepage && gist.comments > 0) {
                        var commentsHTML = `
                                <h2>
                                    <a class="header-anchor" href="#gist-comments" aria-hidden="true">¶</a>
                                    ${gist.comments} ${gist.comments > 1 ? 'Comments' : 'Comment'}
                                </h2>
                                <p>
                                    <a target="_blank" href="${gist.html_url}#partial-timeline-marker">
                                        Add comment on Gist
                                    </a>
                                </p>`;
                        GithubApi.getGistComments(gistId, comments => {
                            if (comments && comments.length) {
                                // create a new instance, since we don't want to create anchor links within comments
                                md = window.markdownit({linkify: true});
                                comments.map(comment => {
                                    commentsHTML += getCommentHTML(comment, md.render(comment.body));
                                });
                                $('#gist-comments').style.display = 'block';
                                $('#gist-comments').innerHTML = commentsHTML;
                                finish();
                            }
                        }, error => {
                            console.warn(error);
                            finish();
                        });
                    } else {
                        finish();
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
};

var $titleHolder = $('#titleHolder'),
    $contentHolder = $('#gistContent'),
    isIE = /Trident|MSIE/.test(navigator.userAgent),
    isHomepage = false,
    gistId = '',
    files = {
        markdown: [],
        others: []
    };

(_ => {
    var redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;

    if (redirect && redirect !== location.href) {
        history.replaceState(null, null, redirect);
        gistId = redirect.split('/').pop().split('?', 1)[0].split('#', 1)[0]; // redirected via 404 page hack
    } else {
        gistId = parseQueryString['id']; // direct entry
    }

    init(gistId);
})();

window.onhashchange = function() {
    scrollToElem(location.hash);
};
