
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

exports.TabBar = html.div('.TabBar', {onclick: '$onClick'}, [],
{
    defaultTab: null,

    tabselected: $.event,
    tabclosed: $.event,
    
    // *************************************************************************************************

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

    get value() {
        return this._value;
    },

    set value(value) {
        this._value = value;

        this.query('.Tab.selected').removeClass('selected');
        
        var selectedTab = this.query('.Tab[value="' + value + '"]');
        if (selectedTab.length) {
            selectedTab.addClass('selected');

            this.parent().query('.tab-page.selected').removeClass('selected');
            this.parent().query('.tab-page[value="' + value + '"]').addClass('selected');
        }
        
        this.tabselected(selectedTab);
    },

    closeTab: function(tab) {
        var previous = $(tab).previous();
        $(tab).remove();

        if ($(tab).cssClass('selected')) {
            if (previous.length) {
                this.value = previous.attr('value');
            } else {
                var first = this.first();
                if (first.length) {
                    this.value = this.first().attr('value');
                }
            }
        }
        this.tabclosed(tab);
    },

    // *************************************************************************************************

    onClick: function(event) {
        var tab = $(event.target).closest('.Tab');
        if (tab.length) {
            this.value = tab.attr('value');
        }
    },
});

exports.Tab = html.a('.Tab', {type: 'replace'}, [],
{
    get selected() {
        return this.cssClass('selected');
    },
    
    select: function() {
        this.parent().value = this.attr('value');
    }
});
