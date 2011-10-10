
var _ = require('underscore'),
    $ = require('ore').query,
    html = require('ore/html');

exports.TabBar = html.div('.TabBar', [],
{
    defaultTab: null,
    selectedTab: null,
    
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
});
