
"style copper/StackBar.css"

var $ = require('ore').query,
    html = require('ore/html'),
    routes = require('ore/routes');

exports.StackBar = html.div('.StackBar', {}, [
    html.div('.backButton.hidden', {onclick: '$onClickBack'}, ['News Feed']),
    // html.div('.backButtonMask'),
    html.div('.title', {onclick: function() {location.reload();}}, []),
],
{
    construct: function() {
        this.titles = [];
    },
    
    pushTitle: function(title) {
        if (this.titles.length) {
            var backTitle = this.titles[this.titles.length-1];
            this.query('.backButton').html(backTitle).removeClass('hidden');
        }
        
        this.titles.push(title);
        this.query('.title').html(title);
    },

    popTitle: function() {
        this.titles.pop();
        var title = this.titles[this.titles.length-1];
        this.query('.title').html(title);
        
        if (this.titles.length > 1) {
            var title = this.titles[this.titles.length-2];
            this.query('.backButton').html(title);
        } else {
            this.query('.backButton').addClass('hidden');
        }
    },
    
    onClickBack: function() {
        history.back();
    }
});
