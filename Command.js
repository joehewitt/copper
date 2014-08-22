
// *************************************************************************************************

function Command() {
}

Command.prototype = {
    id: null,
    title: null,
    className: null,
    actions: null,
    children: null,
    isSearchable: true,

    get hasChildren() {
        return this.__lookupGetter__('children') || this.children;
    },

    get hasActions() {
        return this.__lookupGetter__('actions') || this.actions;
    },

    get hasDrag() {
        return this.drag != Command.prototype.drag;
    },

    // ---------------------------------------------------------------------------------------------

    validate: function() { 
    },

    doIt: function(args) {
    },

    highlight: function(highlighted) {
    },

    copy: function(doubleTap) {
    },

    drag: function(dataTransfer) {
    },    
};

exports.Command = Command;
