// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
(function (BMAExt, InteractiveDataDisplay, $, undefined) {

    BMAExt.SVGPlot = function (jqDiv, master) {
        this.base = InteractiveDataDisplay.Plot;
        this.base(jqDiv, master);
        var that = this;

        var _svgCnt = undefined;
        var _svg = undefined;

        var _isAutomaticSizeUpdate = true;

        Object.defineProperty(this, "svg", {
            get: function () {
                return _svg;
            },
        });

        Object.defineProperty(this, "IsAutomaticSizeUpdate", {
            get: function () {
                return _isAutomaticSizeUpdate;
            },
            set: function (value) {
                _isAutomaticSizeUpdate = value;
                that.master.requestUpdateLayout();
            }
        });

        this.computeLocalBounds = function () {
            var _bbox = undefined;
            if (_svg === undefined)
                return undefined;
            else {
                //return _svg._svg.getBBox();
                return _bbox;
            }
        };

        var svgLoaded = function (svg) {
            _svg = svg;

            svg.configure({
                width: _svgCnt.width(),
                height: _svgCnt.height(),
                viewBox: "0 0 1 1",
                preserveAspectRatio: "none"
            }, true);

            that.host.trigger("svgLoaded");
        };

        var plotToSvg = function (y, plotRect) {
            return (y - (plotRect.y + plotRect.height / 2)) * (-1) + plotRect.y + plotRect.height / 2;
        }

        this.setSVGScreenSize = function (sizeToSet) {
            _svgCnt.width(finalRect.width).height(finalRect.height);
            _svg.configure({
                width: _svgCnt.width(),
                height: _svgCnt.height()
            }, false);
        }

        this.arrange = function (finalRect) {
            InteractiveDataDisplay.CanvasPlot.prototype.arrange.call(this, finalRect);

            if (_svgCnt === undefined) {
                _svgCnt = $("<div></div>").css("overflow", "hidden").appendTo(that.host);
                _svgCnt.width(finalRect.width).height(finalRect.height);
                _svgCnt.svg({ onLoad: svgLoaded });
            }

            var sizeChanged = false;
            if (_isAutomaticSizeUpdate) {
                sizeChanged = _svgCnt.width() !== finalRect.width || _svgCnt.height() !== finalRect.height;
                if (sizeChanged) {
                    _svgCnt.width(finalRect.width).height(finalRect.height);
                }
            }

            if (_svg !== undefined) {
                var plotRect = that.visibleRect;
                if (_isAutomaticSizeUpdate && sizeChanged) {
                    _svg.configure({
                        width: _svgCnt.width(),
                        height: _svgCnt.height()
                    }, false);
                }

                if (!isNaN(plotRect.y) && !isNaN(plotRect.height)) {
                    _svg.configure({
                        viewBox: plotRect.x + " " + (-plotRect.y - plotRect.height) + " " + plotRect.width + " " + plotRect.height,
                    }, false);
                }
            }
        };

        // Gets the transform functions from data to screen coordinates.
        // Returns { dataToScreenX, dataToScreenY }
        this.getTransform = function () {
            var ct = this.coordinateTransform;
            var plotToScreenX = ct.plotToScreenX;
            var plotToScreenY = ct.plotToScreenY;
            var dataToPlotX = this.xDataTransform && this.xDataTransform.dataToPlot;
            var dataToPlotY = this.yDataTransform && this.yDataTransform.dataToPlot;
            var dataToScreenX = dataToPlotX ? function (x) { return plotToScreenX(dataToPlotX(x)); } : plotToScreenX;
            var dataToScreenY = dataToPlotY ? function (y) { return plotToScreenY(dataToPlotY(y)); } : plotToScreenY;

            return { dataToScreenX: dataToScreenX, dataToScreenY: dataToScreenY };
        };

        // Gets the transform functions from screen to data coordinates.
        // Returns { screenToDataX, screenToDataY }
        this.getScreenToDataTransform = function () {
            var ct = this.coordinateTransform;
            var screenToPlotX = ct.screenToPlotX;
            var screenToPlotY = ct.screenToPlotY;
            var plotToDataX = this.xDataTransform && this.xDataTransform.plotToData;
            var plotToDataY = this.yDataTransform && this.yDataTransform.plotToData;
            var screenToDataX = plotToDataX ? function (x) { return plotToDataX(screenToPlotX(x)); } : screenToPlotX;
            var screenToDataY = plotToDataY ? function (y) { return plotToDataY(screenToPlotY(y)); } : screenToPlotY;

            return { screenToDataX: screenToDataX, screenToDataY: screenToDataY };
        };
    };
    BMAExt.SVGPlot.prototype = new InteractiveDataDisplay.Plot;
    InteractiveDataDisplay.register('svgPlot', function (jqDiv, master) { return new BMAExt.SVGPlot(jqDiv, master); });

    BMAExt.Kmeans = function (data, k) {
        this.k = k;
        this.data = data;

        // Keeps track of which cluster centroid index each data point belongs to.
        this.assignments = [];

        this.dataDimensionExtents = function () {
            data = data || this.data;
            var extents = [];

            for (var i = 0; i < data.length; i++) {
                var point = data[i];

                for (var j = 0; j < point.length; j++) {
                    if (!extents[j]) {
                        extents[j] = { min: 1000, max: 0 };
                    }

                    if (point[j] < extents[j].min) {
                        extents[j].min = point[j];
                    }

                    if (point[j] > extents[j].max) {
                        extents[j].max = point[j];
                    }
                }
            }

            return extents;
        }

        this.dataExtentRanges = function () {
            var ranges = [];

            for (var i = 0; i < this.extents.length; i++) {
                ranges[i] = this.extents[i].max - this.extents[i].min;
            }

            return ranges;
        };

        this.seeds = function () {
            var means = [];
            while (this.k--) {
                var mean = [];

                for (var i = 0; i < this.extents.length; i++) {
                    mean[i] = this.extents[i].min + (Math.random() * this.ranges[i]);
                }

                means.push(mean);
            }

            return means;
        };

        this.assignClusterToDataPoints = function () {
            var assignments = [];

            for (var i = 0; i < this.data.length; i++) {
                var point = this.data[i];
                var distances = [];

                for (var j = 0; j < this.means.length; j++) {
                    var mean = this.means[j];
                    var sum = 0;

                    //Calc distance
                    for (var dim = 0; dim < point.length; dim++) {
                        var difference = point[dim] - mean[dim];
                        difference = Math.pow(difference, 2);
                        sum += difference;
                    }

                    distances[j] = Math.sqrt(sum);
                }

                // After calculating all the distances from the data point to each cluster centroid,
                // we pick the closest (smallest) distances.
                assignments[i] = distances.indexOf(Math.min.apply(null, distances));
            }

            return assignments;
        };

        function fillArray(length, val) {
            return Array.apply(null, Array(length)).map(function () { return val; });
        }

        this.moveMeans = function () {
            var sums = fillArray(this.means.length, 0);
            var counts = fillArray(this.means.length, 0);
            var moved = false;
            var i;
            var meanIndex;
            var dim;

            // Clear location sums for each dimension.
            for (i = 0; i < this.means.length; i++) {
                sums[i] = fillArray(this.means[i].length, 0);
            }

            // For each cluster, get sum of point coordinates in every dimension.
            for (var pointIndex = 0; pointIndex < this.assignments.length; pointIndex++) {
                meanIndex = this.assignments[pointIndex];
                var point = this.data[pointIndex];
                var mean = this.means[meanIndex];

                counts[meanIndex]++;

                for (dim = 0; dim < mean.length; dim++) {
                    sums[meanIndex][dim] += point[dim];
                }
            }

            /* If cluster centroid (mean) is not longer assigned to any points,
             * move it somewhere else randomly within range of points.
             */
            for (meanIndex = 0; meanIndex < sums.length; meanIndex++) {
                if (0 === counts[meanIndex]) {
                    sums[meanIndex] = this.means[meanIndex];

                    for (dim = 0; dim < this.extents.length; dim++) {
                        sums[meanIndex][dim] = this.extents[dim].min + (Math.random() * this.ranges[dim]);
                    }
                    continue;
                }

                for (dim = 0; dim < sums[meanIndex].length; dim++) {
                    sums[meanIndex][dim] /= counts[meanIndex];
                    sums[meanIndex][dim] = Math.round(100 * sums[meanIndex][dim]) / 100;
                }
            }

            /* If current means does not equal to new means, then
             * move cluster centroid closer to average point.
             */
            if (this.means.toString() !== sums.toString()) {
                var diff;
                moved = true;

                // Nudge means 1/nth of the way toward average point.
                for (meanIndex = 0; meanIndex < sums.length; meanIndex++) {
                    for (dim = 0; dim < sums[meanIndex].length; dim++) {
                        diff = (sums[meanIndex][dim] - this.means[meanIndex][dim]);
                        if (Math.abs(diff) > 0.1) {
                            var stepsPerIteration = 10;
                            this.means[meanIndex][dim] += diff / stepsPerIteration;
                            this.means[meanIndex][dim] = Math.round(100 * this.means[meanIndex][dim]) / 100;
                        } else {
                            this.means[meanIndex][dim] = sums[meanIndex][dim];
                        }
                    }
                }
            }

            return moved;
        };

        this.run = function () {
            ++this.iterations;

            // Reassign points to nearest cluster centroids.
            this.assignments = this.assignClusterToDataPoints();

            // Returns true if the cluster centroids have moved location since the last iteration.
            var meansMoved = this.moveMeans();

            while (meansMoved) {
                ++this.iterations;
                this.assignments = this.assignClusterToDataPoints();
                meansMoved = this.moveMeans();
            }

            var clusters = [];
            var minDistance = +Infinity;
            for (var i = 0; i < this.means.length; i++) {
                clusters[i] = { mean: this.means[i], count: 0 };

                if (i < this.means.length - 1) {
                    var mean = this.means[i];
                    for (var j = i + 1; j < this.means.length; j++) {
                        var mean2 = this.means[j];

                        //Calc distance
                        var sum = 0;
                        for (var dim = 0; dim < mean2.length; dim++) {
                            var difference = mean2[dim] - mean[dim];
                            difference = Math.pow(difference, 2);
                            sum += difference;
                        }

                        var d = Math.sqrt(sum);
                        if (d < minDistance)
                            minDistance = d;
                    }
                }
            }

            var max = 0;
            for (var i = 0; i < this.assignments.length; i++) {
                clusters[this.assignments[i]].count++;

                if (clusters[this.assignments[i]].count > max) {
                    max = clusters[this.assignments[i]].count;
                }
            }

            return { clusters: clusters, minDistance: minDistance, maxCount: max };
        };

        // Get the extents (min,max) for the dimensions.
        this.extents = this.dataDimensionExtents();

        // Get the range of the dimensions.
        this.ranges = this.dataExtentRanges();

        // Generate random cluster centroid points.
        this.means = this.seeds();
    }

    BMAExt.ModelCanvasPlot = function (jqDiv, master) {
        this.base = InteractiveDataDisplay.CanvasPlot;
        this.base(jqDiv, master);
        var that = this;

        var _canvas = undefined;
        var _localBB = undefined;
        var _baseGrid = undefined;

        var circles = [];

        this.draw = function (data) {
            _canvas = data.canvas;
            _localBB = data.bbox;
            _baseGrid = data.grid;

            circles = [];
            if (data.variableVectors !== undefined && data.variableVectors.length > 0) {
                var clusterNumber = 1 + Math.floor(Math.sqrt(0.5 * data.variableVectors.length));
                var km = new BMAExt.Kmeans(data.variableVectors, clusterNumber);
                var clustersInfo = km.run();
                var clusters = clustersInfo.clusters;

                var norm = Math.max(_localBB.modelWidth, _localBB.modelHeight);
                var minDistance = clustersInfo.minDistance * norm;
                for (var i = 0; i < clusters.length; i++) {
                    var cnt = clusters[i];
                    var c = {
                        x: cnt.mean[0] * norm + _localBB.x,
                        y: cnt.mean[1] * norm + _localBB.y,
                        rad: 0.5 * minDistance * cnt.count / clustersInfo.maxCount,
                        rad2: 0.5 * minDistance
                    };
                    circles.push(c);
                }
            }

            this.invalidateLocalBounds();
            this.requestNextFrameOrUpdate();
            this.fireAppearanceChanged();
        }

        // Returns 4 margins in the screen coordinate system
        this.getLocalPadding = function () {
            return { left: 0, right: 0, top: 0, bottom: 0 };
        };

        this.renderCore = function (plotRect, screenSize) {
            InteractiveDataDisplay.Polyline.prototype.renderCore.call(this, plotRect, screenSize);

            if (_canvas === undefined || _localBB === undefined || _baseGrid === undefined)
                return;

            var context = this.getContext(true);

            var t = this.getTransform();
            var dataToScreenX = t.dataToScreenX;
            var dataToScreenY = t.dataToScreenY;

            // size of the canvas
            var w_s = screenSize.width;
            var h_s = screenSize.height;

            //scales
            var scaleX = (dataToScreenX(_baseGrid.xStep) - dataToScreenX(0)) / _baseGrid.xStep;
            var scaleY = (dataToScreenY(0) - dataToScreenY(_baseGrid.yStep)) / _baseGrid.yStep;

            var transparencyLevel = plotRect.width / (15 * _baseGrid.xStep) - 0.5;
            if (transparencyLevel > 1) transparencyLevel = 1;
            if (transparencyLevel < 0) transparencyLevel = 0;

            var op = context.globalAlpha;

            context.globalAlpha = 1 - transparencyLevel;
            var realBBox = { x: dataToScreenX(_localBB.x), y: dataToScreenY(-_localBB.y), width: _localBB.width * scaleX, height: _localBB.height * scaleY };
            context.drawImage(_canvas, realBBox.x, realBBox.y, realBBox.width, realBBox.height);

            context.globalAlpha = transparencyLevel;
            for (var i = 0; i < circles.length; i++) {
                var c = circles[i];

                var x = dataToScreenX(c.x);
                var y = dataToScreenY(-c.y);
                var rad = dataToScreenX(c.rad) - dataToScreenX(0);
                var rad2 = dataToScreenX(c.rad2) - dataToScreenX(0);

                context.fillStyle = "blue";
                context.beginPath();
                context.arc(x, y, rad2, 0, 2 * Math.PI, false);
                context.fill();
                context.fillStyle = "cyan";
                context.beginPath();
                context.arc(x, y, rad, 0, 2 * Math.PI, false);
                context.fill();
            }

            context.globalAlpha = op;

            //render debug red rect to ensure canvas occupies correct place
            //context.strokeStyle = "red";
            //context.strokeRect(realBBox.x, realBBox.y, realBBox.width, realBBox.height);
            //console.log("x: " + realBBox.x + ", y:" + realBBox.y + ", width:" + realBBox.width + ", height:" + realBBox.height);
        }

        this.computeLocalBounds = function () {
            return undefined;
        };

        // Gets the transform functions from data to screen coordinates.
        // Returns { dataToScreenX, dataToScreenY }
        this.getTransform = function () {
            var ct = this.coordinateTransform;
            var plotToScreenX = ct.plotToScreenX;
            var plotToScreenY = ct.plotToScreenY;
            var dataToPlotX = this.xDataTransform && this.xDataTransform.dataToPlot;
            var dataToPlotY = this.yDataTransform && this.yDataTransform.dataToPlot;
            var dataToScreenX = dataToPlotX ? function (x) { return plotToScreenX(dataToPlotX(x)); } : plotToScreenX;
            var dataToScreenY = dataToPlotY ? function (y) { return plotToScreenY(dataToPlotY(y)); } : plotToScreenY;

            return { dataToScreenX: dataToScreenX, dataToScreenY: dataToScreenY };
        };

        // Gets the transform functions from screen to data coordinates.
        // Returns { screenToDataX, screenToDataY }
        this.getScreenToDataTransform = function () {
            var ct = this.coordinateTransform;
            var screenToPlotX = ct.screenToPlotX;
            var screenToPlotY = ct.screenToPlotY;
            var plotToDataX = this.xDataTransform && this.xDataTransform.plotToData;
            var plotToDataY = this.yDataTransform && this.yDataTransform.plotToData;
            var screenToDataX = plotToDataX ? function (x) { return plotToDataX(screenToPlotX(x)); } : screenToPlotX;
            var screenToDataY = plotToDataY ? function (y) { return plotToDataY(screenToPlotY(y)); } : screenToPlotY;

            return { screenToDataX: screenToDataX, screenToDataY: screenToDataY };
        };
    };
    BMAExt.ModelCanvasPlot.prototype = new InteractiveDataDisplay.CanvasPlot;
    InteractiveDataDisplay.register('modelCanvasPlot', function (jqDiv, master) { return new BMAExt.ModelCanvasPlot(jqDiv, master); });

    BMAExt.RectsPlot = function (div, master) {

        this.base = InteractiveDataDisplay.CanvasPlot;
        this.base(div, master);

        var _rects;

        this.draw = function (data) {
            _rects = data.rects;
            if (!_rects) _rects = [];

            this.invalidateLocalBounds();

            this.requestNextFrameOrUpdate();
            this.fireAppearanceChanged();
        };

        // Returns a rectangle in the plot plane.
        this.computeLocalBounds = function (step, computedBounds) {
            var dataToPlotX = this.xDataTransform && this.xDataTransform.dataToPlot;
            var dataToPlotY = this.yDataTransform && this.yDataTransform.dataToPlot;

            if (_rects === undefined || _rects.length < 1)
                return undefined;

            var bbox = { x: _rects[0].x, y: _rects[0].y, width: _rects[0].width, height: _rects[0].height };
            for (var i = 1; i < _rects.length; i++) {
                bbox = InteractiveDataDisplay.Utils.unionRects(bbox, { x: _rects[i].x, y: _rects[i].y, width: _rects[i].width, height: _rects[i].height })
            }

            return bbox;
        };

        // Returns 4 margins in the screen coordinate system
        this.getLocalPadding = function () {
            return { left: 0, right: 0, top: 0, bottom: 0 };
        };

        this.renderCore = function (plotRect, screenSize) {
            InteractiveDataDisplay.Polyline.prototype.renderCore.call(this, plotRect, screenSize);

            if (_rects === undefined || _rects.length < 1)
                return;

            var t = this.getTransform();
            var dataToScreenX = t.dataToScreenX;
            var dataToScreenY = t.dataToScreenY;

            // size of the canvas
            var w_s = screenSize.width;
            var h_s = screenSize.height;
            var xmin = 0, xmax = w_s;
            var ymin = 0, ymax = h_s;

            var context = this.getContext(true);

            var circleSize = Number.POSITIVE_INFINITY;
            for (var i = 0; i < _rects.length; i++) {
                var rect = _rects[i];
                context.fillStyle = rect.fill;

                var x = dataToScreenX(rect.x);
                var y = dataToScreenY(rect.y + rect.height);
                var width = dataToScreenX(rect.x + rect.width) - dataToScreenX(rect.x);
                var height = dataToScreenY(rect.y) - dataToScreenY(rect.y + rect.height);

                if (rect.labels !== undefined && rect.labels.length > 0) {
                    var availableWidth = Math.min(height * 0.8, width * 0.8);
                    var size = availableWidth / rect.labels.length;
                    circleSize = Math.min(circleSize, size);
                }
            }

            for (var i = 0; i < _rects.length; i++) {
                var rect = _rects[i];

                var x = dataToScreenX(rect.x);
                var y = dataToScreenY(rect.y + rect.height);
                var width = dataToScreenX(rect.x + rect.width) - dataToScreenX(rect.x);
                var height = dataToScreenY(rect.y) - dataToScreenY(rect.y + rect.height);

                var alpha = context.globalAlpha;
                if (rect.opacity !== undefined) {
                    context.globalAlpha = rect.opacity;
                }
                if (rect.fill !== undefined) {
                    context.fillStyle = rect.fill;
                    context.fillRect(x, y, width, height);
                }
                if (rect.stroke !== undefined) {
                    context.strokeStyle = rect.stroke;
                    var lineWidth = context.lineWidth;
                    if (rect.lineWidth !== undefined) {
                        context.lineWidth = rect.lineWidth;
                    }
                    context.strokeRect(x, y, width, height);
                    context.lineWidth = lineWidth;
                }
                context.globalAlpha = alpha;

                if (rect.labels !== undefined && rect.labels.length > 0) {
                    var x = 0.1 * width + (0.8 * width - rect.labels.length * circleSize) / 2;
                    for (var j = 0; j < rect.labels.length; j++) {
                        context.beginPath();
                        context.arc(dataToScreenX(rect.x) + x + circleSize / 2, dataToScreenY(rect.y + rect.height / 2), 0.95 * circleSize / 2, 0, 2 * Math.PI, true);
                        context.closePath();

                        context.strokeStyle = "rgb(96,96,96)";
                        context.fillStyle = "rgb(238,238,238)";
                        context.stroke();
                        context.fill();

                        context.fillStyle = "rgb(96,96,96)";
                        context.textBaseline = "middle";
                        context.font = circleSize / 2 + "px OpenSans";
                        var w = context.measureText(rect.labels[j]).width;
                        context.fillText(rect.labels[j], dataToScreenX(rect.x) + x + circleSize / 2 - w / 2, dataToScreenY(rect.y + rect.height / 2));

                        x += circleSize;
                    }
                }
            }
        };

        // Others
        this.onDataTransformChanged = function (arg) {
            this.invalidateLocalBounds();
            InteractiveDataDisplay.RectsPlot.prototype.onDataTransformChanged.call(this, arg);
        };

    }

    BMAExt.RectsPlot.prototype = new InteractiveDataDisplay.CanvasPlot;
    InteractiveDataDisplay.register('rectsPlot', function (jqDiv, master) { return new BMAExt.RectsPlot(jqDiv, master); });

    BMAExt.ZoomPlot = function (div, master) {
        if (!div) return;

        var _minZoomWidth = 0.001;
        var _minZoomHeight = 0.001;
        var _maxZoomWidth = 0.004;
        var _maxZoomHeight = 0.004;

        this.base = InteractiveDataDisplay.Plot;
        this.base(div, master);
        var that = this;

        Object.defineProperty(this, "minZoomWidth",
            {
                get: function () { return _minZoomWidth; },
                set: function (value) {
                    if (_minZoomWidth === value) return;
                    _minZoomWidth = value;
                },
            }
        );
        Object.defineProperty(this, "maxZoomWidth",
            {
                get: function () { return _maxZoomWidth; },
                set: function (value) {
                    if (_maxZoomWidth === value) return;
                    _maxZoomWidth = value;
                },
            }
        );
        Object.defineProperty(this, "minZoomHeight",
            {
                get: function () { return _minZoomHeight; },
                set: function (value) {
                    if (_minZoomHeight === value) return;
                    _minZoomHeight = value;
                },
            }
        );
        Object.defineProperty(this, "maxZoomHeight",
            {
                get: function () { return _maxZoomHeight; },
                set: function (value) {
                    if (_maxZoomHeight === value) return;
                    _maxZoomHeight = value;
                },
            }
        );

        var currentMousePosition = {
            x: NaN,
            y: NaN
        }
        this.master.host.bind("mousemove", function (e) {
            var cs = that.getScreenToDataTransform();
            var x0 = cs.screenToDataX(e.pageX - that.host.offset().left);
            var y0 = cs.screenToDataY(e.pageY - that.host.offset().top);

            currentMousePosition = {
                x: x0,
                y: y0
            }
        });

        this.master.host.bind("mouseleave", function (e) {
            currentMousePosition = {
                x: NaN,
                y: NaN
            }
        });

        this.getActualMinRect = function () {
            var screenRect = { x: 0, y: 0, left: 0, top: 0, width: that.master.host.width(), height: that.master.host.height() };
            var minCS = new InteractiveDataDisplay.CoordinateTransform({ x: 0, y: 0, width: _minZoomWidth, height: _minZoomHeight }, screenRect, that.master.aspectRatio);
            return minCS.getPlotRect(screenRect);
        }

        this.getActualMaxRect = function () {
            var screenRect = { x: 0, y: 0, left: 0, top: 0, width: that.master.host.width(), height: that.master.host.height() };
            var maxCS = new InteractiveDataDisplay.CoordinateTransform({ x: 0, y: 0, width: _maxZoomWidth, height: _maxZoomHeight }, screenRect, that.master.aspectRatio);
            return maxCS.getPlotRect(screenRect);
        }

        this.constraint = function (plotRect, screenSize) {

            var screenRect = { x: 0, y: 0, left: 0, top: 0, width: that.master.host.width(), height: that.master.host.height() };
            var maxCS = new InteractiveDataDisplay.CoordinateTransform({ x: 0, y: 0, width: _maxZoomWidth, height: _maxZoomHeight }, screenRect, that.master.aspectRatio);
            var actualMaxRect = maxCS.getPlotRect(screenRect);
            var minCS = new InteractiveDataDisplay.CoordinateTransform({ x: 0, y: 0, width: _minZoomWidth, height: _minZoomHeight }, screenRect, that.master.aspectRatio);
            var actualMinRect = minCS.getPlotRect(screenRect);

            var resultPR = { x: 0, y: 0, width: 0, height: 0 };
            var center = {
                x: plotRect.x + plotRect.width / 2,
                y: plotRect.y + plotRect.height / 2
            }

            if (plotRect.width < actualMinRect.width) {
                if (isNaN(currentMousePosition.x)) {
                    resultPR.x = center.x - actualMinRect.width / 2;
                } else {
                    resultPR.x = currentMousePosition.x - actualMinRect.width * (currentMousePosition.x - plotRect.x) / plotRect.width;
                }
                resultPR.width = actualMinRect.width;
                that.master.navigation.stop();
            } else if (plotRect.width > actualMaxRect.width) {
                if (isNaN(currentMousePosition.x)) {
                    resultPR.x = center.x - actualMaxRect.width / 2;
                } else {
                    resultPR.x = currentMousePosition.x - actualMaxRect.width * (currentMousePosition.x - plotRect.x) / plotRect.width;
                }
                resultPR.width = actualMaxRect.width;
                that.master.navigation.stop();
            } else {
                resultPR.x = plotRect.x;
                resultPR.width = plotRect.width;
            }

            if (plotRect.height < actualMinRect.height) {
                if (isNaN(currentMousePosition.y)) {
                    resultPR.y = center.y - actualMinRect.height / 2;
                } else {
                    resultPR.y = currentMousePosition.y - actualMinRect.height * (currentMousePosition.y - plotRect.y) / plotRect.height;
                }

                resultPR.height = actualMinRect.height;
                that.master.navigation.stop();
            } else if (plotRect.height > actualMaxRect.height) {
                if (isNaN(currentMousePosition.y)) {
                    resultPR.y = center.y - actualMaxRect.height / 2;
                } else {
                    resultPR.y = currentMousePosition.y - actualMaxRect.height * (currentMousePosition.y - plotRect.y) / plotRect.height;
                }

                resultPR.height = actualMaxRect.height;
                that.master.navigation.stop();
            } else {
                resultPR.y = plotRect.y;
                resultPR.height = plotRect.height;
            }

            //if (plotRect.width < actualMinRect.width || plotRect.width > actualMaxRect.width || plotRect.height < actualMinRect.height || plotRect.height > actualMaxRect.height) {
            //    console.log('mouse: ' + currentMousePosition.x + ", " + currentMousePosition.y);
            //    console.log("source: " + plotRect.x + ", " + plotRect.y + ", " + plotRect.width + ", " + plotRect.height);
            //    console.log("result: " + resultPR.x + ", " + resultPR.y + ", " + resultPR.width + ", " + resultPR.height);
            //}

            return resultPR;
        };

        // Gets the transform functions from data to screen coordinates.
        // Returns { dataToScreenX, dataToScreenY }
        this.getTransform = function () {
            var ct = this.coordinateTransform;
            var plotToScreenX = ct.plotToScreenX;
            var plotToScreenY = ct.plotToScreenY;
            var dataToPlotX = this.xDataTransform && this.xDataTransform.dataToPlot;
            var dataToPlotY = this.yDataTransform && this.yDataTransform.dataToPlot;
            var dataToScreenX = dataToPlotX ? function (x) { return plotToScreenX(dataToPlotX(x)); } : plotToScreenX;
            var dataToScreenY = dataToPlotY ? function (y) { return plotToScreenY(dataToPlotY(y)); } : plotToScreenY;

            return { dataToScreenX: dataToScreenX, dataToScreenY: dataToScreenY };
        };

        // Gets the transform functions from screen to data coordinates.
        // Returns { screenToDataX, screenToDataY }
        this.getScreenToDataTransform = function () {
            var ct = this.coordinateTransform;
            var screenToPlotX = ct.screenToPlotX;
            var screenToPlotY = ct.screenToPlotY;
            var plotToDataX = this.xDataTransform && this.xDataTransform.plotToData;
            var plotToDataY = this.yDataTransform && this.yDataTransform.plotToData;
            var screenToDataX = plotToDataX ? function (x) { return plotToDataX(screenToPlotX(x)); } : screenToPlotX;
            var screenToDataY = plotToDataY ? function (y) { return plotToDataY(screenToPlotY(y)); } : screenToPlotY;

            return { screenToDataX: screenToDataX, screenToDataY: screenToDataY };
        };
    };
    BMAExt.ZoomPlot.prototype = new InteractiveDataDisplay.Plot;
    InteractiveDataDisplay.register('zoomPlot', function (jqDiv, master) { return new BMAExt.ZoomPlot(jqDiv, master); });

})(window.BMAExt = window.BMAExt || {}, InteractiveDataDisplay || {}, jQuery);
