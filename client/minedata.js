/*jslint vars: false, browser: true */
/*global Sizzle, DV */

// Copyright 2012 Yaco Sistemas S.L.
//
// Developed by Yaco Sistemas <ablanco@yaco.es>
//
// Licensed under the EUPL, Version 1.1 or – as soon they
// will be approved by the European Commission - subsequent
// versions of the EUPL (the "Licence");
// You may not use this work except in compliance with the
// Licence.
// You may obtain a copy of the Licence at:
//
// http://joinup.ec.europa.eu/software/page/eupl
//
// Unless required by applicable law or agreed to in
// writing, software distributed under the Licence is
// distributed on an "AS IS" basis,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
// express or implied.
// See the Licence for the specific language governing
// permissions and limitations under the Licence.

if (!window.DV) {
    window.DV = {};
}

DV.isNumber = function (n) {
    "use strict";
    return !isNaN(parseFloat(n)) && isFinite(n);
};

DV.extractData = function (data_container, options) {
    "use strict";
    var labels = [],
        values = [],
        headers = [],
        labelIdx,
        valuesIdx = [],
        series = options.series,
        results = {},
        sizzle = Sizzle, // jslint hack >_<
        aux = sizzle(data_container + " tr"),
        aux2,
        value,
        row,
        i,
        j;

    // Not every chart uses series
    if (series) {
        series = series.split(',');
    }

    // Get indexes
    for (i = 0; i < aux[0].cells.length; i += 1) {
        aux2 = aux[0].cells[i].id;
        headers.push(aux2);
        if (aux2 === options.labels) {
            labelIdx = i;
        } else if (series) {
            for (j = 0; j < series.length; j += 1) {
                if (aux2 === series[j]) {
                    valuesIdx.push(i);
                    values.push([]); // future serie array
                }
            }
        } else {
            valuesIdx.push(i);
        }
    }

    // Get data
    for (i = 1; i < aux.length; i += 1) {
        aux2 = aux[i].cells;
        if (options.labels) {
            labels.push(aux2[labelIdx].innerHTML);
        }
        row = [];
        for (j = 0; j < valuesIdx.length; j += 1) {
            value = aux2[valuesIdx[j]].innerHTML;
            if (series) {
                // Series values are numerical
                value = parseFloat(value);
                if (!DV.isNumber(value)) {
                    value = 0;
                    aux2[valuesIdx[j]].className += " error";
                    aux2[valuesIdx[j]].title = "The value is not a number";
                }
                values[j].push(value);
            } else {
                row.push(value);
            }
        }
        if (!series) {
            values.push(row);
        }
    }

    results.labels = labels;
    results.headers = headers;
    results.series = values;
    results.results = values;

    return results;
};
