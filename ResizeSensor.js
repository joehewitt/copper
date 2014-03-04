var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

// *************************************************************************************************
// Derived from:
// http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/

exports.ResizeSensor = html.div('.resize-sensor', [
    html.div('.overflow-sensor', {onoverflowchanged: '$onOverflowChanged'}, [html.div()]),
    html.div('.underflow-sensor', {onoverflowchanged: '$onOverflowChanged'}, [html.div()]),
], {
    resized: $.event,

    // ---------------------------------------------------------------------------------------------
    // ore.Tag
    
    construct: function() {
        this.overflower = this.query('.overflow-sensor').first();
        this.underflower = this.query('.underflow-sensor').first();
        setTimeout(_.bind(this.testOverflow, this));
    },

    // ---------------------------------------------------------------------------------------------

    testOverflow: function(shouldDispatch) {
        var resized = false;
        var width = this.width() || 2;
        var height = this.height() || 2;

        if (width !== this.layoutWidth) {
            this.overflower.css('width', width-1);
            this.underflower.css('width', width+1);
            this.layoutWidth = width;
            resized = true;
        }
        if (height !== this.layoutHeight) {
            this.overflower.css('height', height-1);
            this.underflower.css('height', height+1);
            this.layoutHeight = height;
            resized = true;
        }

        if (resized && shouldDispatch) {
            this.resized({target: this});            
        }
    },

    // ---------------------------------------------------------------------------------------------
    
    onOverflowChanged: function(event) {
        this.testOverflow(true);
    },
});
