
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

// *************************************************************************************************

exports.Tree = html.div('.tree', {onmousedown: '$onMouseDown'}, [
    html.div('.tree-container.vertical', [
        html.HERE
    ])
], {
    selectedItems: null,
    shouldUnselectBackground: true,

    selectitem: $.event,

    // ---------------------------------------------------------------------------------------------

    selectItem: function(item, others) {
        if (this.selectedItems) {
            this.selectedItems.removeClass('selected');
        }
        var event = {item: item, others: others};
        var items = others && others.length
            ? $([item].concat(others))
            : $(item);

        this.selectedItems = items;
        items.addClass('selected');
        this.selectitem(event);
    },

    toggleItem: function(item, shouldNotUnselect) {
        if (item.cssClass('selected')) {
            if (!shouldNotUnselect) {
                this.selectedItems = this.selectedItems.without(item);
                item.removeClass('selected');
                this.selectitem({item: item, toggle: true});
            }
        } else {
            this.selectedItems = this.selectedItems.union(item);
            item.addClass('selected');
            this.selectitem({item: item, toggle: true});
        }
    },

    toggleItemRange: function(item) {
        if (!this.selectedItems.length) {
            return this.selectItem(item);
        } else {
            var endItem = this.selectedItems.get(this.selectedItems.length-1);
            var searchDown = false, searchUp = false;
            this.query('.tree-item').find(_.bind(function(searchItem) {
                if (!searchUp && searchItem.equals(item)) {
                    searchDown = true;
                } else if (!searchDown && searchItem.equals(endItem)) {
                    searchUp = true;
                    return;
                }
                if (searchUp) {
                    this.toggleItem(searchItem);                        
                    if (searchItem.equals(item)) {
                        return true;
                    }
                } else if (searchDown) {
                    if (searchItem.equals(endItem)) {
                        return true;
                    } else {
                        this.toggleItem(searchItem);                        
                    }
                }
            }, this));
        }
    },

    // ---------------------------------------------------------------------------------------------

    onMouseDown: function(event) {
        var item = $(event.target).closest('.tree-item');
        if (event.metaKey && !event.shiftKey && !event.altKey && !event.ctrlKey) {
            this.toggleItem(item);
            event.preventDefault();
        } else if (event.shiftKey && !event.metaKey && !event.altKey && !event.ctrlKey) {
            this.toggleItemRange(item);
            event.preventDefault();
        } else if (!item.cssClass('selected')) {
            if (item.length || this.shouldUnselectBackground) {
                this.selectItem(item);
            }
        }
    },
});

// *************************************************************************************************

exports.TreeItem = html.a('.tree-item');
