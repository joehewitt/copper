
var $ = require('ore'),
    html = require('ore/html');

var Button = require('./Button').Button;

// *************************************************************************************************

exports.Navigator = html.div('.navigator', {}, [
    html.div('.navigator-header-box', {onclick: '$onClickHeader'}),
    html.div('.navigator-page-box', {onpushed: '$onPushed', onpopped: '$onPopped'}, [
        html.HERE
    ]),
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

    pushPage: function(page, header) {
        var oldItem = this.stack ? this.stack[this.stack.length-1] : null

        if (!this.stack) {
            this.stack = [];
        }

        if (typeof(header) == 'string') {
            var bar = new exports.NavigationBar();
            bar.html(header);
            header = bar;
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
        this.query('.navigator-page-box').css('height', page.height());

        var self = this;
        function endTransition(event) {
            if (event.animationName == 'navigator-slide-in') {
                oldItem.page.removeClass('sliding-out').addClass('hidden');
                page.removeClass('sliding-in');
                oldItem.header.removeClass('fading-out').addClass('hidden');
                header.removeClass('fading-in');
                self.query('.navigator-page-box').css('height', null);

                document.removeEventListener('webkitAnimationEnd', endTransition, false);

                self.navigated({target: self});
            }
        }
    },

    popPage: function(returnToBeginning, notAnimated) {
        if (this.stack.length < 2) {
            return;
        }

        var deadItem = this.stack.pop();
        if (returnToBeginning) {
            for (var i = this.stack.length-1; i > 0; --i) {
                var item = this.stack[i];
                item.header.remove();
                item.page.remove();
            }
            this.stack = this.stack.slice(0, 1);
        }
        var returningItem = this.stack[this.stack.length-1];

        if (!notAnimated) {
            deadItem.header.addClass('fading-out');
            deadItem.page.addClass('sliding-back-out');
            returningItem.header.addClass('fading-in');
            returningItem.page.addClass('sliding-back-in');
        } else {
            deadItem.header.remove();
            deadItem.page.remove();            
        }

        returningItem.header.removeClass('hidden');
        returningItem.page.removeClass('hidden');

        if (notAnimated) {
            this.navigated({target: this});            
        } else {
            this.query('.navigator-page-box').css('height', returningItem.page.height());
            document.addEventListener('webkitAnimationEnd', endTransition, false);
        }

        var self = this;
        function endTransition(event) {
            if (event.animationName == 'navigator-slide-back-in') {
                returningItem.header.removeClass('fading-in');
                returningItem.page.removeClass('sliding-back-in');
                self.query('.navigator-page-box').css('height', null);

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

exports.NavigationBar = html.div('.navigation-bar', {}, [
    Button('.navigation-back-button.back-button', ['<']),
    html.div('.navigation-bar-title', {}, [html.HERE]),
]);
