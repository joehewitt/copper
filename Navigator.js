
var $ = require('ore'),
    html = require('ore/html');

var Button = require('./Button').Button;

// *************************************************************************************************

exports.Navigator = html.div('.navigator', {}, [
    html.div('.navigator-header-box', {onclick: '$onClickHeader'}),
    html.div('.navigator-page-box', {onpopped: '$onPopped'}, [
        html.HERE
    ]),
], {
    navigating: $.event,
    navigated: $.event,

    // ---------------------------------------------------------------------------------------------

    get currentHeader() {
        return this.stack ? this.stack[this.stack.length-1].header : null;
    },

    get currentPage() {
        return this.stack ? this.stack[this.stack.length-1].page : null;
    },

    // ---------------------------------------------------------------------------------------------
    // ore.Tag

    construct: function() {
        var startPage = this.query('.navigator-page', true);
        if (startPage.length) {
            var header;
            var title = startPage.attr('title');
            if (title) {
                header = new NavigationBar();
                header.addClass('navigator-header');
                header.html(title);
                this.query('.navigator-header-box').append(header);
            }

            this.stack = [{page: startPage, header: header}];
        }
    },

    // ---------------------------------------------------------------------------------------------

    replacePage: function(page, header) {
        var newItem = {page: page, header: header};
        if (!this.stack) {
            this.stack = [newItem];
        } else {
            this.stack[this.stack.length-1] = newItem;
        }

        header.addClass('navigator-header');
        page.addClass('navigator-page');

        this.query('.navigator-header-box').append(header);
        this.query('.navigator-page-box').append(page);
    },

    pushPage: function(page, header, notAnimated) {
        if (typeof(header) == 'string') {
            var bar = new NavigationBar();
            bar.html(header);
            header = bar;
        }

        var oldItem = this.stack ? this.stack[this.stack.length-1] : null
        if (!this.stack) {
            this.stack = [];
        }

        var event = {target: this, page: page, header: header};
        this.navigating(event);
        if (event.prevent) {
            return;
        }

        this.stack.push({page: page, header: header});

        header.addClass('navigator-header');
        page.addClass('navigator-page');

        // Save the page position before we append the new page (which might change it)
        var pos = oldItem ? oldItem.page.position() : null;

        this.query('.navigator-header-box').append(header);
        this.query('.navigator-page-box').append(page);
        if (page.layout) {
            page.layout();
        }

        if (oldItem) {
            // Affix the position of the page so it doesn't jump just before the animation
            var headerOffset = oldItem.header ? 0 : (header ? header.height() : 0);
            oldItem.page.css('width', pos.width)
                        .css('height', pos.height)
                        .css('top', pos.top - headerOffset);

            if (oldItem.header) {
                oldItem.header.addClass('fading-out');
            }
            oldItem.page.addClass('sliding-out');
            header.addClass('fading-in');
            page.addClass('sliding-in');

            document.addEventListener('webkitAnimationEnd', endTransition, false);
        }

        var self = this;
        function endTransition(event) {
            if (event.animationName == 'navigator-slide-in') {
                if (oldItem.header) {
                    oldItem.header.removeClass('fading-out').addClass('hidden');
                }
                oldItem.page.removeClass('sliding-out').addClass('hidden');
                page.removeClass('sliding-in');
                header.removeClass('fading-in');

                // Let the page resume its natural position now
                oldItem.page.css('width', null).css('height', null).css('top', null);

                document.removeEventListener('webkitAnimationEnd', endTransition, false);

                self.navigated({target: self});
            }
        }
    },

    popPage: function(returnToBeginning, notAnimated) {
        if (this.stack.length < 2) {
            return;
        }

        var deadItem = this.stack[this.stack.length-1];
        var returningItem = returnToBeginning ? this.stack[0] : this.stack[this.stack.length-2];
        var page = returningItem.page;
        var header = returningItem.header;

        var event = {target: this, page: page, header: header, back: true};
        this.navigating(event);
        if (event.prevent) {
            return;
        }

        if (returnToBeginning) {
            for (var i = this.stack.length-2; i > 0; --i) {
                var item = this.stack[i];
                item.header.remove();
                item.page.remove();
            }
            this.stack = this.stack.slice(0, 1);
        } else {
            this.stack.pop();
        }

        // Save the page position before we show the returning page (which might change it)
        var pos = deadItem.page.position();

        if (header) {
            header.removeClass('hidden');
        }
        page.removeClass('hidden');

        if (!notAnimated) {
            var headerOffset = header ? 0 : (deadItem.header ? deadItem.header.height() : 0);
            deadItem.page.css('width', pos.width)
                         .css('height', pos.height)
                         .css('top', pos.top + headerOffset);

            deadItem.header.addClass('fading-out');
            deadItem.page.addClass('sliding-back-out');
            if (header) {
                header.addClass('fading-in');
            }
            page.addClass('sliding-back-in');
        } else {
            deadItem.header.remove();
            deadItem.page.remove();
        }

        if (notAnimated) {
            this.navigated({target: this, poppedPage: deadItem.page, back: true});
        } else {
            document.addEventListener('webkitAnimationEnd', endTransition, false);
        }

        var self = this;
        function endTransition(event) {
            if (event.animationName == 'navigator-slide-back-in') {
                if (header) {
                    header.removeClass('fading-in');
                }
                page.removeClass('sliding-back-in');

                deadItem.page.css('width', null).css('height', null).css('top', null);

                deadItem.header.remove();
                deadItem.page.remove();

                document.removeEventListener('webkitAnimationEnd', endTransition, false);

                self.navigated({target: self, poppedPage: deadItem.page, back: true});
            }
        }
    },

    // ---------------------------------------------------------------------------------------------

    onClickHeader: function(event) {
        if ($(event.target).contained('back-button')) {
            this.popPage();
        }
    },

    onPushed: function(event) {
        // XXXjoe Someday provide a standard way to automate this so others don't have
        // to implement their own push handler

        // var command = event.detail.item.cmd();
        // if (command && command.hasChildren) {
        //     var page = this.createNewPage(command.children);
        //     this.pushPage(page, command.title);
        // }
    },

    onPopped: function(event) {
        this.popPage();
    },
});

// *************************************************************************************************

var NavigationBar =
exports.NavigationBar = html.div('.navigation-bar', {}, [
    Button('.navigation-back-button.back-button'),
    html.div('.navigation-bar-title', {}, [html.HERE]),
]);
