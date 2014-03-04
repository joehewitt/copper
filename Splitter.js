
var _ = require('underscore'),
    $ = require('ore'),
    html = require('ore/html');

// *************************************************************************************************

exports.Splitter = html.div('.splitter', {onmousedown: '$onMouseDown'}, [
    html.div('.splitter-box')
], {
    _delta: 0,

    resized: $.event,

    // ---------------------------------------------------------------------------------------------

    get orientation() {
        if (!this._orientation) {
            if (this.target == 'inner-top') {
                this._orientation = 'column';
            } else if (this.target == 'flexible-siblings' || this.target == 'panels') {
                this._orientation = this.parent().style('-webkit-flex-direction');
            } else {
                this._orientation = 'row';
            }
        }
        return this._orientation;
    },

    // ---------------------------------------------------------------------------------------------
    // ore.Tag

    construct: function() {
        setTimeout(_.bind(function() {
            this.autoOrient();
        }, this));
    },

    // ---------------------------------------------------------------------------------------------

    getPreviousBox: function() {
        if (this.target == 'inner-top') {
            return null;
        } else if (this.target == 'panels') {
            var prev = this.previous()
            while (prev.length && !(prev.cssClass('panel') && prev.width())) {
                prev = prev.previous();
            }
            return prev;
        } else {
            var prev = this.previous()
            while (prev && !prev.width()) {
                prev = prev.previous();
            }
            return prev;
        }
    },

    getNextBox: function() {
        if (this.target == 'inner-top') {
            return this.parent();
        } else if (this.target == 'panels') {
            var next = this.next()
            while (next.length && !(next.cssClass('panel') && next.width())) {
                next = next.next();
            }
            return next;
        } else {
            var next = this.next()
            while (next && !next.width()) {
                next = next.next();
            }
            return next;
        }
    },

    autoOrient: function() {
        if (this._oriented) return;

        this.addClass(this.orientation);
        
        var previous = this.getPreviousBox();
        var next = this.getNextBox();

        if (this.target != 'flexible-siblings' && this.target != 'panels') {
            if (this.orientation == 'column') {
                // Convert bottom into top+height
                if (previous) {
                    // previous.css('top', previous.position().top);
                    previous.css('height', previous.height());
                    // previous.css('bottom', 'auto');
                }
                if (next) {
                    // next.css('top', next.position().top);
                    next.css('height', next.height());
                    // next.css('bottom', 'auto');
                }
            } else if (this.orientation == 'row') {
                // Convert right into left+width
                if (previous) {
                    previous.css('left', previous.position().left);
                    previous.css('width', previous.width());
                    previous.css('right', 'auto');
                }
                if (next) {
                    next.css('left', next.position().left);
                    next.css('width', next.width());
                    next.css('right', 'auto');
                }
            }
        }

        this._oriented = true;
    },

    // ---------------------------------------------------------------------------------------------

    onMouseDown: function(event) {
        event.preventDefault();

        var previous = this.getPreviousBox();
        var next = this.getNextBox();
        if (!((previous && previous.length) || (next && next.length))) return;

        var isHorizontal = this.orientation == 'row';
        var target = this.target.indexOf('inner-') == 0 ? 'parent' : 'siblings';

        this.dragging = true;
        if (previous) {
            previous.dragging = true;
        }
        if (next) {
            next.dragging = true;
        }

        var startMouse = isHorizontal ? event.clientX : event.clientY;

        var startDelta = this.delta;
        var startPos, startPrevSize, startNextSize, startNextPos;
        if (isHorizontal) {
            startPos = this.position().left;
            if (target == 'parent') {
                startNextSize = next.width();
                startNextPos = next.position().left;
            } else {
                startPrevSize = previous.width();
                startNextSize = next.width();
                startNextPos = next.position().left;
            }
        } else {
            startPos = this.position().top;

            if (target == 'parent') {
                startNextSize = next.height();
                startNextPos = next.position().top;            
            } else {
                startPrevSize = previous.height();
                startNextSize = next.height();
                startNextPos = next.position().top;            
            }
        }

        // XXXjoe Calculate me!
        var minPos = 0;
        var maxPos = 1000000;

        if (this.target == 'flexible-siblings' || this.target == 'panels') {
            var startPrevFlex = parseFloat(previous.style('-webkit-flex'));
            var startNextFlex = parseFloat(next.style('-webkit-flex'));
            var prevFlex, nextFlex;

            var onMouseMove = _.bind(function(event) {
                var mousePos = isHorizontal ? event.clientX : event.clientY;
                var delta = mousePos - startMouse;

                var splitterPos = startPos + delta;
                var prevSize = startPrevSize + delta;
                var nextSize = startNextSize - delta;
                var nextPos = startNextPos + delta;

                var deltaChange = 0;
                if (splitterPos < minPos) {
                    deltaChange = minPos - splitterPos;
                    splitterPos = minPos;
                } else if (splitterPos > maxPos) {
                    deltaChange = maxPos - splitterPos;
                    splitterPos = maxPos;
                }
                delta -= deltaChange;
                nextSize -= deltaChange;
                prevSize -= deltaChange; 

                prevFlex = (prevSize/startPrevSize) * startPrevFlex;
                nextFlex = (nextSize/startNextSize) * startNextFlex;
                previous.css('-webkit-flex', prevFlex);
                next.css('-webkit-flex', nextFlex);

                this.resized({target: this, delta: this.delta});
            }, this);

            var onMouseEnd = _.bind(function(event) {
                $(window).unlisten('mousemove', onMouseMove);
                $(window).unlisten('mouseup', onMouseEnd);
                next.size = nextFlex;
                previous.size = prevFlex;
                this.dragging = previous.dragging = next.dragging = false;
            }, this);

            $(window).listen('mousemove', onMouseMove);
            $(window).listen('mouseup', onMouseEnd);
        } else {
            var prevSize, nextSize, splitterPos;

            var onMouseMove = _.bind(function(event) {
                var mousePos = isHorizontal ? event.clientX : event.clientY;
                var delta = mousePos - startMouse;

                splitterPos = startPos + delta;
                nextPos = startNextPos + delta;
                prevSize = startPrevSize + delta;
                nextSize = startNextSize - delta;

                // var deltaChange = 0;
                // if (splitterPos < minPos) {
                //     deltaChange = minPos - splitterPos;
                //     splitterPos = minPos;
                // } else if (splitterPos > maxPos) {
                //     deltaChange = maxPos - splitterPos;
                //     splitterPos = maxPos;
                // }
                // delta -= deltaChange;
                // nextSize -= deltaChange;
                // prevSize -= deltaChange;

                if (isHorizontal) {
                    this.css('left', splitterPos);
                    if (target == 'parent') {
                        next.css('width', nextSize);
                        next.css('left', nextPos);
                    } else {
                        previous.css('width', prevSize);
                        next.css('width', nextSize);
                        next.css('left', nextPos);
                    }
                } else {
                    // this.css('top', splitterPos);
                    if (target == 'parent') {
                        next.css('height', nextSize);
                        // next.css('top', nextPos);
                    } else {
                        previous.css('height', prevSize);
                        next.css('height', nextSize);
                        next.css('top', nextPos);
                    }
                }

                this.resized({target: this, delta: this.delta});
            }, this);

            var onMouseEnd = _.bind(function(event) {
                $(window).unlisten('mousemove', onMouseMove);
                $(window).unlisten('mouseup', onMouseEnd);
                if (next) {
                    next.size = nextSize;
                    next.dragging = true;
                }
                if (previous) {
                    previous.size = prevSize;
                    previous.dragging = true;
                }
                this.dragging = true;
            }, this);

            $(window).listen('mousemove', onMouseMove);
            $(window).listen('mouseup', onMouseEnd);
        }
    }
});    
