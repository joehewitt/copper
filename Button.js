
var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html');

// *************************************************************************************************

exports.Button = html.div('.button', {}, [
], {
    value: null,

    get selected() {
        return this.hasClass('selected');
    },

    set selected(selected) {
        if (selected) {
            this.addClass('selected');
        } else {
            this.removeClass('selected');
        }
        return selected;
    },

    toggle: function() {
        this.selected = !this.selected;
    },

    showMenu: function(menu) {
        var menuSelector = this.attr('menu');
        if (menuSelector) {
            var menu = $(menuSelector);
            if (menu.length) {
                var onHidden = _.bind(function () {
                    this.removeClass('depressed');
                    menu.unlisten('hidden', onHidden);
                }, this);

                this.addClass('depressed');
                menu.listen('hidden', onHidden);
                menu.show(this);
            }
        }
    }
});    
