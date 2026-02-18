(function () {
    'use strict';

    function CombinedComments() {
        var _this = this;

        var proxies = [
            'https://cors.lampa.stream/',
            'https://my-finder.kozak-bohdan.workers.dev/?url=',
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://cors.bwa.workers.dev/'
        ];

        var clean = function (str) {
            return str ? str.toLowerCase().replace(/[^a-z0-9а-яіїєґ]/g, ' ').replace(/\s+/g, ' ').trim() : '';
        };

        var checkMatch = function (itemText, tUa, tEn) {
            var text = clean(itemText);
            var u = clean(tUa);
            var e = clean(tEn);
            return (u && text.indexOf(u) !== -1) || (e && text.indexOf(e) !== -1);
        };

        var request = function (url, onSuccess, onError, proxyIdx) {
            proxyIdx = proxyIdx || 0;
            if (proxyIdx >= proxies.length) {
                if (onError) onError();
                return;
            }

            $.ajax({
                url: proxies[proxyIdx] + encodeURIComponent(url),
                method: 'GET',
                timeout: 5000,
                success: function (res) {
                    if ((res || '').length < 200) request(url, onSuccess, onError, proxyIdx + 1);
                    else onSuccess(res);
                },
                error: function () {
                    request(url, onSuccess, onError, proxyIdx + 1);
                }
            });
        };

        var parseComments = function (html, sourceName) {
            var comments = [];
            var doc = $('<div>' + html + '</div>');
            var items = doc.find('.comment, div[id^="comment-id-"], .comm-item');
            var uniqueSignatures = [];

            items.each(function () {
                var el = $(this);
                if (el.parents('.comment, div[id^="comment-id-"], .comm-item').length > 0) return;

                var author = el.find('.comm-author, .name, .comment-author, .acc-name, b').first().text().trim();

                var textEl = el.find('.comm-text, .comment-content, .text, .comment-body, div[id^="comm-id-"]').clone();
                textEl.find('div, script, style, .comm-good-bad').remove();
                var text = textEl.text().trim();

                var dateClone = el.clone();
                dateClone.find('.comm-text, .comment-content, .text, .comment-body, div[id^="comm-id-"]').remove();
                var date = dateClone.find('.comm-date, .date, .comment-date, .comm-two').text().trim();

                if (author && text) {
                    var signature = author + '|' + date + '|' + text.substring(0, 50);
                    if (uniqueSignatures.indexOf(signature) === -1) {
                        uniqueSignatures.push(signature);
                        comments.push({
                            author: author + ' (' + sourceName + ')',
                            date: date,
                            text: text
                        });
                    }
                }
            });

            return comments;
        };

        this.init = function () {
            Lampa.Listener.follow('full', function (e) {
                if (e.type === 'complite') {
                    var render = e.object.activity.render();
                    setTimeout(function () {
                        _this.renderButton(e.data, render);
                    }, 100);
                }
            });

            this.addStyles();
        };

        this.addStyles = function () {
            if ($('#rezka-style').length) return;

            var css = `
                .comments-tree-item{list-style:none;margin:0 0 10px 0;padding:0;}
                .comment-wrap{display:flex;}
                .comment-card{
                    background:#1b1b1b;
                    padding:12px 16px;
                    border-radius:8px;
                    border:1px solid #2a2a2a;
                    width:100%;
                }
                .comment-header{
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:6px;
                }
                .comment-header .name{
                    font-weight:600;
                    color:#fff;
                }
                .comment-header .date{
                    opacity:.6;
                    font-size:12px;
                }
                .comment-text .text{
                    color:#ddd;
                    line-height:1.5;
                    white-space:pre-wrap;
                }
            `;

            $('head').append('<style id="rezka-style">' + css + '</style>');
        };

        this.renderButton = function (data, render) {
            var buttons_container = render.find('.full-start-new__buttons, .full-start__buttons');
            if (render.find('.uk-comments-btn').length || !buttons_container.length) return;

            var btn = $('<div class="full-start__button selector uk-comments-btn">' +
                '<img src="https://yarikrazor-star.github.io/lmp/coment.svg">' +
                '<span>Коментарі</span>' +
                '</div>');

            buttons_container.append(btn);

            btn.on('hover:enter click', function () {
                _this.loadComments(data.movie);
            });
        };

        this.loadComments = function (movie) {
            Lampa.Noty.show('Пошук коментарів...');

            var results = [];

            var fakeDelay = setTimeout(function(){
                _this.showModal(results, movie.title || movie.name);
            }, 500);
        };

        this.showModal = function (comments, title) {
            Lampa.Loading.stop();

            let modal = $(
                '<div>' +
                    '<div class="broadcast__text" style="text-align:left;">' +
                        '<div class="comment"></div>' +
                    '</div>' +
                '</div>'
            );

            let container = modal.find('.comment');

            if (comments.length === 0) {
                container.append('<div style="padding:20px;color:#888;">Коментарів не знайдено.</div>');
            } else {
                comments.forEach(function (c) {
                    container.append(
                        '<div class="comments-tree-item">' +
                            '<div class="comment-wrap">' +
                                '<div class="comment-card">' +
                                    '<div class="comment-header">' +
                                        '<span class="name">' + c.author + '</span>' +
                                        '<span class="date">' + (c.date || '') + '</span>' +
                                    '</div>' +
                                    '<div class="comment-text">' +
                                        '<div class="text">' + c.text + '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>'
                    );
                });
            }

            Lampa.Modal.open({
                title: title + ' (' + comments.length + ')',
                html: modal,
                size: 'large',
                mask: true,
                onBack: function () {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                }
            });
        };
    }

    if (window.Lampa) new CombinedComments().init();
})();
