
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

exports.TabBar = html.div('.TabBar', {onclick: '$onClick'}, [],
{
    defaultTab: null,
    selectedTab: null,
    
    onClick: function(event) {
        var tab = $(event.target).closest('.Tab');
        if (tab.length) {
            this.selectTab(tab);
        }
    },

    selectTab: function(tab) {
        if (this.selectedTab) {
            this.selectedTab.removeClass('selected');
        }
        this.selectedTab = tab;
        if (tab) {
            tab.addClass('selected');
            this.tabselected(tab);
        }
    },

    closeTab: function(tab) {
        var previous = $(tab).previous();
        $(tab).remove();
        if ($(tab).hasClass('selected')) {
            if (previous.length) {
                this.selectTab(previous);
            } else {
                var first = this.first();
                if (first.length) {
                    this.selectTab(this.first());
                }
            }
        }
        this.tabclosed(tab);
    },
    
    construct: function() {
        setTimeout(_.bind(function() {
            if (this.defaultTab) {
                this.query('.Tab').each(_.bind(function(tab) {
                    if (tab.attr('href') == this.defaultTab) {
                        tab.select();
                    }
                }, this));
            } else {
                var defaultTab = this.query('.Tab.selected');
                if (defaultTab.length == 1) {
                   defaultTab.select();
                } else {
                    var defaultTab = this.query('.Tab');
                    if (defaultTab.length) {
                       defaultTab.get(0).select();
                    }
                }
            }
        }, this));
    },
    
    tabselected: $.event,
    tabclosed: $.event,
});
