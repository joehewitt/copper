
var $ = require('ore'),
    _ = require('underscore'),
    html = require('ore/html');

exports.List = html.div('.List', {onmousedown: '$onMouseDown'}, [
    html.div('.ListContainer.vertical', [
        html.HERE
    ])
],
{
    selectedItems: null,
    
    selectitem: $.event,

    onMouseDown: function(event) {
        var item = $(event.target).closest('.ListItem');
        if (event.metaKey && !event.shiftKey && !event.altKey && !event.ctrlKey) {
            this.toggleItem(item);
            event.preventDefault();
        } else if (event.shiftKey && !event.metaKey && !event.altKey && !event.ctrlKey) {
            this.toggleItemRange(item);
            event.preventDefault();
        } else if (!item.hasClass('selected')) {
            this.selectItem(item);
        }
    },
    
    selectItem: function(item, others) {
        D&&D('select item', item);
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
        if (item.hasClass('selected')) {
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
            this.query('.ListItem').find(_.bind(function(searchItem) {
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
});
