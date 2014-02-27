
var $ = require('ore'),
    html = require('ore/html');

// *************************************************************************************************

exports.Navigator = html.div('.Navigator', {}, [
    html.div('.navigator-header-box', {onclick: '$onClickHeader'}),
    html.div('.navigator-content-box'),
],
{
    topPage: function() {
        return this.stack ? this.stack[this.stack.length-1] : null;
    },
    
    pushPage: function(content, header) {
        if (!this.stack) {
            this.stack = [];
        }

        var oldPage = this.topPage();
        this.stack.push({content: content, header: header});

        header.addClass('navigator-header');
        content.addClass('navigator-content');

        if (oldPage) {
            oldPage.header.addClass('fading-out');
            oldPage.content.addClass('sliding-out');

            header.addClass('fading-in');
            content.addClass('sliding-in');

            document.addEventListener('webkitAnimationEnd', endTransition, false);
        }

        this.query('.navigator-header-box').append(header);
        this.query('.navigator-content-box').append(content);

        function endTransition(event) {
            if (event.animationName == 'pageSlideLeft') {
                oldPage.content.removeClass('sliding-out').addClass('invisible');
                content.removeClass('sliding-in');

                oldPage.header.removeClass('fading-out').addClass('invisible');
                header.removeClass('fading-in');

                document.removeEventListener('webkitAnimationEnd', endTransition, false);
            }
        }
    },

    popPage: function(creator) {
        var deadPage = this.stack.pop();
        var returningPage = this.topPage();

        deadPage.header.addClass('fading-out');
        deadPage.content.addClass('sliding-back-out');

        returningPage.header.addClass('fading-in').removeClass('invisible');
        returningPage.content.addClass('sliding-back-in').removeClass('invisible');

        document.addEventListener('webkitAnimationEnd', endTransition, false);

        function endTransition(event) {
            if (event.animationName == 'pageSlideRight') {
                returningPage.header.removeClass('fading-in');
                returningPage.content.removeClass('sliding-back-in');

                deadPage.header.remove();
                deadPage.content.remove();

                document.removeEventListener('webkitAnimationEnd', endTransition, false);
            }
        }
    },

    // *********************************************************************************************

    onClickHeader: function(event) {
        if ($(event.target).closest('.back-button').length) {
            this.popPage();
        }
    }
});
