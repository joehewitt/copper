
var $ = require('ore'),
    html = require('ore/html');

// *************************************************************************************************

exports.Navigator = html.div('.navigator', {}, [
    html.div('.navigator-header-box', {onclick: '$onClickHeader'}),
    html.div('.navigator-page-box', {onnavigateditem: '$onNavigatedItem'}),
],
{
    navigated: $.event,

    get currentHeader() {
        return this.stack ? this.stack[this.stack.length-1].header : null;
    },

    get currentPage() {
        return this.stack ? this.stack[this.stack.length-1].page : null;
    },
    
    // ---------------------------------------------------------------------------------------------

    pushPage: function(page, header) {
        var oldItem = this.stack ? this.stack[this.stack.length-1] : null

        if (!this.stack) {
            this.stack = [];
        }
        this.stack.push({page: page, header: header});

        header.addClass('navigator-header');
        page.addClass('navigator-page');

        if (oldItem) {
            oldItem.header.addClass('fading-out');
            oldItem.page.addClass('sliding-out');

            header.addClass('fading-in');
            page.addClass('sliding-in');

            document.addEventListener('webkitAnimationEnd', endTransition, false);
        }

        this.query('.navigator-header-box').append(header);
        this.query('.navigator-page-box').append(page);

        var self = this;
        function endTransition(event) {
            if (event.animationName == 'navigator-slide-in') {
                oldItem.page.removeClass('sliding-out').addClass('invisible');
                page.removeClass('sliding-in');

                oldItem.header.removeClass('fading-out').addClass('invisible');
                header.removeClass('fading-in');

                document.removeEventListener('webkitAnimationEnd', endTransition, false);

                self.navigated({target: self});
            }
        }
    },

    popPage: function() {
        var deadItem = this.stack.pop();
        var returningItem = this.stack[this.stack.length-1];

        deadItem.header.addClass('fading-out');
        deadItem.page.addClass('sliding-back-out');

        returningItem.header.addClass('fading-in').removeClass('invisible');
        returningItem.page.addClass('sliding-back-in').removeClass('invisible');

        document.addEventListener('webkitAnimationEnd', endTransition, false);

        var self = this;
        function endTransition(event) {
            if (event.animationName == 'navigator-slide-back-in') {
                returningItem.header.removeClass('fading-in');
                returningItem.page.removeClass('sliding-back-in');

                deadItem.header.remove();
                deadItem.page.remove();

                document.removeEventListener('webkitAnimationEnd', endTransition, false);

                self.navigated({target: self});
            }
        }
    },

    // ---------------------------------------------------------------------------------------------

    onClickHeader: function(event) {
        if ($(event.target).closest('.back-button').length) {
            this.popPage();
        }
    },

    onNavigatedItem: function(event) {
        if (event.detail.direction == 'back') {
            this.popPage();
        }
    },
});
