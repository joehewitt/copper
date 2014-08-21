
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

// *************************************************************************************************

exports.TabBar = html.div('.tab-bar', {onclick: '$onClick'}, [],
{
    defaultTab: null,

    tabselected: $.event,
    tabclosed: $.event,
    
    // ---------------------------------------------------------------------------------------------

    get value() {
        return this._value;
    },

    set value(value) {
        this._value = value;

        this.query('.tab.selected').removeClass('selected');
        
        var selectedTab = this.query('.tab[value="' + value + '"]');
        if (selectedTab.length) {
            selectedTab.addClass('selected');

            this.parent().query('.tab-page.selected').removeClass('selected');
            var newPage = this.parent().query('.tab-page[value="' + value + '"]');
            newPage.addClass('selected');

            this.tabselected({tab: selectedTab, page: newPage});
        }
    },

    // ---------------------------------------------------------------------------------------------
    // ore.Tag

    construct: function() {
        setTimeout(_.bind(function() {
            if (this.defaultTab) {
                this.query('.tab').each(_.bind(function(tab) {
                    if (tab.attr('href') == this.defaultTab) {
                        tab.select();
                    }
                }, this));
            } else {
                var defaultTab = this.query('.tab.selected');
                if (defaultTab.length == 1) {
                   defaultTab.select();
                } else {
                    var defaultTab = this.query('.tab');
                    if (defaultTab.length) {
                       defaultTab.get(0).select();
                    }
                }
            }
        }, this));
    },

    // ---------------------------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------------------------
    
    onClick: function(event) {
        var tab = $(event.target).closest('.tab');
        if (tab.length) {
            this.value = tab.attr('value');
        }
    },
});

// *************************************************************************************************

exports.Tab = html.a('.tab', {type: 'replace'}, [],
{
    get selected() {
        return this.cssClass('selected');
    },
        
    // ---------------------------------------------------------------------------------------------
    
    select: function() {
        this.parent().value = this.attr('value');
    }
});
