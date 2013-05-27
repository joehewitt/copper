
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

exports.SegmentBar = html.div('.SegmentBar', [
], {
    updated: $.event,

    construct: function() {
        setTimeout(_.bind(function() {
            this.setValue(this.value);
            this.layout();
        }, this));
    },

    layout: function() {
        if (this.minSegmentWidth) {
            var segments = this.query('.Segment');
            var barWidth = this.contentWidth();
            var segmentRowCount = segments.length;
            var segmentWidth = barWidth / segmentRowCount;
            while (segmentRowCount > 0 && segmentWidth < this.minSegmentWidth) {
                segmentRowCount = Math.floor(segmentRowCount-1);
                segmentWidth = Math.floor(barWidth / segmentRowCount);
            }
            segments.each(_.bind(function(segment) {
                if (segment.css('width', segmentWidth)) {
                }
            }, this));
        }
    },

    setValue: function(value) {
        this.query('.Segment.selected').removeClass('selected');
        this.query('.Segment').each(_.bind(function(segment) {
            if (segment.value == value) {
                segment.addClass('selected');
            }
        }, this));

        this.value = value;
        this.updated({target: this, value: value});
    },
});    

// *************************************************************************************************

exports.Segment = html.div('.Segment', {onmouseup: '$onMouseUp'}, [
], {
    value: null,

    select: function() {
        var bar = this.closest('.SegmentBar');
        bar.setValue(this.value);
    },

    onMouseUp: function(event) {
        this.select();
    } 
});    
