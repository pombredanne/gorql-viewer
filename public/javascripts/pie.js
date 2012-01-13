/*jslint vars: false */
/*global d3: true, exports: true, require, window: true, document: true, module, alert, DV: true */

if (!DV) {
    var DV = {};
}

DV.merge = function (source, destination) {
    "use strict";

    var key;

    for (key in source) {
        if (source.hasOwnProperty(key)) {
            if (!destination[key]) {
                destination[key] = source[key];
            }
        }
    }
};

DV.merge((function () {
    "use strict";

    var svg,
        nElems,
        sizes = {},
        positions = {},
        indexFromValue = {},
        labelFromValue = {},
        labelScale,

        getSectorColor = function (i) {
            var palette = 'A';
            if (nElems >= 25) {
                palette = 'C';
            } else if (nElems >= 12) {
                palette = 'B';
            }
            return "color" + palette + i;
        },

        highlightOut = function (d, i) {
            svg.selectAll("text.highlight")
                .remove();
            svg.selectAll("path.highlight")
                .transition()
                .duration(500)
                .attr("transform", "translate(" + positions.centerX + "," + positions.centerY + ")")
                .attr("class", function (d, i) { return "sector " + getSectorColor(indexFromValue[d.data]); });
        },

        highlightIn = function (d, i) {
            // Remove other highlights
            highlightOut(d, i);

            var label = labelFromValue[d.data],
                factor = 30, // hypotenuse
                angle = d.endAngle - d.startAngle,
                percentage,
                tx,
                ty;

            percentage = Math.round((angle * 100) / (2 * Math.PI));

            angle = d.startAngle + (angle / 2); // bisec

            if (angle < (Math.PI / 2)) {
                // North East
                tx = Math.sin(angle);
                ty = -Math.cos(angle);
            } else if (angle < Math.PI) {
                // South East
                angle = angle - (Math.PI / 2);
                tx = Math.cos(angle);
                ty = Math.sin(angle);
            } else if (angle < ((3 * Math.PI) / 2)) {
                // South West
                angle = angle - Math.PI;
                tx = -Math.sin(angle);
                ty = Math.cos(angle);
            } else {
                // North West
                angle = angle - ((3 * Math.PI) / 2);
                tx = -Math.cos(angle);
                ty = -Math.sin(angle);
            }

            tx = tx * factor;
            ty = ty * factor;
            tx = positions.centerX + tx;
            ty = positions.centerY + ty;

            svg.append("svg:text")
                .attr("class", "highlight")
                .attr("x", positions.centerX)
                .attr("y", sizes.height)
                .attr("dy", -10)
                .attr("text-anchor", "middle")
                .attr("text-path", this.getAttribute(d))
                .text(label + ": " + d.data + " [" + percentage + "%]");

            d3.select(this)
                .transition()
                .duration(500)
                .attr("transform", "translate(" + tx + "," + ty + ")");

            this.setAttribute("class", this.getAttribute("class") + " highlight");
        },

        render = function (labels, pie) {
            var radius = d3.min([positions.centerX, (positions.centerY - sizes.highlight)]),
                arc = d3.svg.arc()
                    .startAngle(function (d) { return d.startAngle; })
                    .endAngle(function (d) { return d.endAngle; })
                    .innerRadius(0)
                    .outerRadius(radius);

            // Paint the pie
            svg.selectAll("path.sector")
                .data(pie, function (d) { return d.data; })
                .enter().append("path")
                .attr("d", arc)
                .attr("class", function (d, i) { return "sector " + getSectorColor(i); })
                .attr("transform", "translate(" + positions.centerX + ", " + positions.centerY + ")")
                .on("mouseover", highlightIn)
                .on("mouseout", highlightOut);

            // Paint the labels
            svg.selectAll("rect.label")
                .data(pie, function (d) { return d.data; })
                .enter().append("svg:rect")
                .attr("class", function (d, i) { return "label " + getSectorColor(i); })
                .attr("x", positions.labels + 10)
                .attr("y", function (d, i) { return Math.floor(labelScale(i)); })
                .attr("width", 15)
                .attr("height", 15);

            svg.selectAll("text.label")
                .data(pie, function (d) { return d.data; })
                .enter().append("svg:text")
                .attr("class", "label")
                .attr("x", positions.labels + 10)
                .attr("dx", 20)
                .attr("dy", 10)
                .attr("y", function (d, i) { return Math.floor(labelScale(i)); })
                .text(function (d) { return labelFromValue[d.data]; });
        },

        compareOriginalIndexes = function (d1, d2) {
            var idx1 = indexFromValue[d1],
                idx2 = indexFromValue[d2];

            return idx1 - idx2;
        },

        init = function (container, labels, series, options) {
            var pie,
                i;

            if (series.length <= 0 || series[0].length <= 0) {
                return;
            }

            series = series[0]; // pie charts doesn't support series
            nElems = series.length;

            // Associate labels and values, it will be necessary later, while
            // painting the labels
            for (i = 0; i < series.length; i += 1) {
                indexFromValue[series[i]] = i;
                labelFromValue[series[i]] = labels[i];
                // TODO y si varios sectores tienen exactamente el mismo valor?
            }

            pie = d3.layout.pie();
            pie.sort(compareOriginalIndexes);
            pie = pie(series);

            sizes = {
                width: parseInt(options.sizeX, 10),
                height: parseInt(options.sizeY, 10),
                label: parseInt(options.sizeLabel, 10),
                highlight: parseInt(options.sizeHighlight, 10)
            };

            positions.labels = sizes.width - sizes.label;
            positions.centerX = (sizes.width - sizes.label) / 2;
            positions.centerY = (sizes.height / 2) - 20;

            labelScale = d3.scale.linear()
                .domain([0, series.length - 1])
                .range([20, sizes.height - 20]);

            // Create the svg root node
            svg = d3.select(container).append("svg:svg")
                .attr("class", "chart pie")
                .attr("width", sizes.width) // original sizes
                .attr("height", sizes.height);

            render(labels, pie);
        },

        node = function (data, options) {
            init(document.body, data.labels, data.values, options);
        },

        chart = function (container, data_container, options) {
            var data = DV.extractData(data_container, options);
            init(container, data.labels, data.series, options);
        };

    // Public functions
    return {
        pie: chart,
        node: node
    };
}()), DV);

if (typeof module !== 'undefined' && module.exports) {
    // Node
    var window,
        document,
        d3;
} else {
    // Browser
    window.exports = {};
}

exports.chart = function (data, options) {
    "use strict";

    var jsdom = require("jsdom").jsdom;
    document = jsdom("<html><head></head><body></body></html>");
    window = document.createWindow();
    d3 = require("./d3")(window, document);
    require("./d3.layout")(d3);
    DV.node(data, options);
    return document.body.innerHTML;
};
