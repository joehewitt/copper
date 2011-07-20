
"style copper/Page.css"

var $ = require('ore'),
    html = require('ore/html'),
    routes = require('ore/routes'),
    StackBar = require('./StackBar').StackBar;

exports.PageStack = html.div('.PageStack', [
    StackBar(),
    html.div('.container')
],
{
    topPage: function() {
        return this.stack ? this.stack[this.stack.length-1] : null;
    },
    
    pushPage: function(creator) {
        var page = creator();
        if (!this.stack) {
            this.stack = [page];
            this.query('.container').append(page);
            this.query('.StackBar').pushTitle(page.title);
            document.title = page.title;
        } else {
            var oldPage = this.topPage();
            this.stack[this.stack.length] = page;  

            oldPage.addClass('slidingOut');
            page.addClass('slidingIn');
            this.query('.container').append(page);
            this.query('.StackBar').pushTitle(page.title);
            document.title = page.title;
            
            document.addEventListener('webkitAnimationEnd', endTransition, false);
            function endTransition(event) {
                if (event.animationName == 'pageSlideLeft') {
                    oldPage.removeClass('slidingOut').addClass('invisible');
                    page.removeClass('slidingIn');
                    document.removeEventListener('webkitAnimationEnd', endTransition, false);
                }
            }
        }
    },

    popPage: function(creator) {
        if (this.stack && this.stack.length) {
            var oldPage = this.topPage();
            oldPage.addClass('slidingBackOut');

            if (page) {
                // XXXjoe Go back through stack until finding, popping all in between
            }
            this.stack.pop();
            
            var page = this.topPage();
            if (page) {
                page.removeClass('invisible');
            } else {
                page = creator();
                this.query('.container').append(page);
                this.stack[0] = page;
            }
            page.addClass('slidingBack');
            this.query('.StackBar').popTitle();
            document.title = page.title;

            document.addEventListener('webkitAnimationEnd', endTransition, false);
            function endTransition(event) {
                if (event.animationName == 'pageSlideRight') {
                    oldPage.removeClass('slidingBackOut');
                    oldPage.remove();
                    page.removeClass('slidingBack');
                    document.removeEventListener('webkitAnimationEnd', endTransition, false);
                }
            }
        }
    },
});
