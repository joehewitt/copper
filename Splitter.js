
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

exports.Splitter = html.div('.Splitter', {_delta: 0, onmousedown: '$onMouseDown'}, [
], {
    delta: 0,

    resized: $.event,

    construct: function() {
        setTimeout(_.bind(function() {
            this.autoOrient();
        }, this));
    },

    setDelta: function(delta) {
        if (!this.orientation) this.autoOrient();

        var isHorizontal = this.orientation == 'horizontal';
        var target = this.target.indexOf('inner-') == 0 ? 'parent' : 'siblings';

        var previous = this.getPreviousBox();
        var next = this.getNextBox();

        var startDelta = this.delta;
        var startPos, startPrevSize, startNextSize, startNextPos;
        if (isHorizontal) {
            startPos = this.position().top;

            if (target == 'parent') {
                startNextSize = next.height();
                startNextPos = next.position().top;            
            } else {
                startPrevSize = previous.height();
                startNextSize = next.height();
                startNextPos = next.position().top;            
            }
        } else {
            startPos = this.position().left;
            if (target == 'parent') {
                startNextSize = next.width();
                startNextPos = next.position().left;
            } else {
                startPrevSize = previous.width();
                startNextSize = next.width();
                startNextPos = next.position().left;
            }
        }

        var splitterPos = startPos + delta;
        var prevSize = startPrevSize + delta;
        var nextSize = startNextSize - delta;
        var nextPos = startNextPos + delta;

        if (isHorizontal) {
            this.css('top', splitterPos);
            if (target == 'parent') {
                next.css('height', nextSize);
                next.css('top', nextPos);
            } else {
                previous.css('height', prevSize);
                next.css('height', nextSize);
                next.css('top', nextPos);
            }
        } else {
            this.css('left', splitterPos);
            if (target == 'parent') {
                next.css('width', nextSize);
                next.css('left', nextPos);
            } else {
                previous.css('width', prevSize);
                next.css('width', nextSize);
                next.css('left', nextPos);
            }
        }

        this.delta = startDelta + delta;
    },

    getPreviousBox: function() {
        if (this.target == 'inner-top') {
            return null;
        } else {
            return this.previous();
        }
    },

    getNextBox: function() {
        if (this.target == 'inner-top') {
            return this.parent();
        } else {
            return this.next();
        }
    },

    detectOrientation: function(previous, next) {
        if (this.target == 'inner-top') {
            return 'horizontal';
        } else if (previous && previous.length && next && next.length) {
            var dy = Math.abs(previous.position().top - next.position().top);
            var dx = Math.abs(previous.position().left - next.position().left);
            if (dy > dx) {
                return 'horizontal';
            } else {
                return 'vertical';
            }
        }
    },

    autoOrient: function() {
        if (this.orientation) return;

        var previous = this.getPreviousBox();
        var next = this.getNextBox();
        var orient = this.detectOrientation(previous, next);
        this.orientation = orient;

        if (this.orientation == 'vertical') {
            this.addClass('vertical');
        } else if (this.orientation == 'horizontal') {
            this.addClass('horizontal');
        }
        this.layout();
    },

    layout: function() {
        if (this.target == 'inner-top') {
            var inner = this.parent();

            this.css('top', -this.height()/2);
            this.css('left', 0);
            this.css('width', inner.width());
        } else if (this.orientation == 'vertical') {
            var previous = this.getPreviousBox();
            var next = this.getNextBox();
            if (previous && previous.length) {
                this.css('left', previous.position().left + previous.width() - this.width()/2);
                this.css('top', previous.position().top);
                this.css('height', previous.height());
             } else if (next && next.length) {
                this.css('left', next.position().left - this.width()/2);
                this.css('top', next.position().top);
                this.css('height', next.height());
             }
        } else if (this.orientation == 'horizontal') {
            var previous = this.getPreviousBox();
            var next = this.getNextBox();
            if (previous && previous.length) {
                this.css('top', previous.position().top + previous.height() - this.height()/2);
                this.css('left', previous.position().left);
                this.css('width', previous.width());
            } else if (next && next.length) {
                this.css('top', next.position().top - this.height()/2);
                this.css('left', next.position().left);
                this.css('width', next.width());                
            }
        }
    },

    onMouseDown: function(event) {
        event.preventDefault();

        this.dragging = true;

        var isHorizontal = this.orientation == 'horizontal';
        var target = this.target.indexOf('inner-') == 0 ? 'parent' : 'siblings';

        var previous = this.getPreviousBox();
        var next = this.getNextBox();

        var startDelta = this.delta;
        var startPos, startPrevSize, startNextSize, startNextPos;
        if (isHorizontal) {
            startPos = this.position().top;

            if (target == 'parent') {
                startNextSize = next.height();
                startNextPos = next.position().top;            
            } else {
                startPrevSize = previous.height();
                startNextSize = next.height();
                startNextPos = next.position().top;            
            }
        } else {
            startPos = this.position().left;
            if (target == 'parent') {
                startNextSize = next.width();
                startNextPos = next.position().left;
            } else {
                startPrevSize = previous.width();
                startNextSize = next.width();
                startNextPos = next.position().left;
            }
        }

        var startMouse = isHorizontal ? event.clientY : event.clientX;

        // XXXjoe Calculate me!
        var minPos = 0;
        var maxPos = 1000000;

        var onMouseMove = _.bind(function(event) {
            var mousePos = isHorizontal ? event.clientY : event.clientX;
            var delta = mousePos - startMouse;

            var splitterPos = startPos + delta;
            var prevSize = startPrevSize + delta;
            var nextSize = startNextSize - delta;
            var nextPos = startNextPos + delta;

            var deltaChange = 0;
            // if (splitterPos < minPos) {
            //     deltaChange = minPos - splitterPos;
            //     splitterPos = minPos;
            // } else if (splitterPos > maxPos) {
            //     deltaChange = maxPos - splitterPos;
            //     splitterPos = maxPos;
            // }
            delta -= deltaChange;
            nextSize -= deltaChange;
            prevSize -= deltaChange;

            if (isHorizontal) {
                this.css('top', splitterPos);
                if (target == 'parent') {
                    next.css('height', nextSize);
                    next.css('top', nextPos);
                } else {
                    previous.css('height', prevSize);
                    next.css('height', nextSize);
                    next.css('top', nextPos);
                }
            } else {
                this.css('left', splitterPos);
                if (target == 'parent') {
                    next.css('width', nextSize);
                    next.css('left', nextPos);
                } else {
                    previous.css('width', prevSize);
                    next.css('width', nextSize);
                    next.css('left', nextPos);
                }
            }

            this.delta = startDelta + delta;
            this.resized({target: this, delta: this.delta});
        }, this);

        var onMouseEnd = _.bind(function(event) {
            $(window).unlisten('mousemove', onMouseMove);
            $(window).unlisten('mouseup', onMouseEnd);
            this.dragging = false;
        }, this);

        $(window).listen('mousemove', onMouseMove);
        $(window).listen('mouseup', onMouseEnd);

    }
});    
