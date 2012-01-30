/*jslint vars: false, browser: true */
/*global OpenLayers, DV */

if (!DV) {
    var DV = {};
}

DV.map = function (fields, viewport_id, data_container, options) {
    "use strict";

    var headers,
        results,
        container = document.createElement('div'),
        map,
        osm = new OpenLayers.Layer.OSM("Open Street Map"),
        markers = new OpenLayers.Layer.Markers("Markers"),
        size = new OpenLayers.Size(21, 25),
        icon = new OpenLayers.Icon(
            "/openlayers/img/marker.png",
            size,
            new OpenLayers.Pixel(-(size.w / 2), -size.h) // offset
        ),
        feature,
        marker,
        markerClick,
        aux,
        iconAux,
        lonlat,
        latIdx,
        longIdx,
        descriptionIdx,
        i;

    container.id = "ol_viewport";
    container.style.width = options.width + 'px';
    container.style.height = options.height + 'px';
    document.getElementById(viewport_id).appendChild(container);

    map = new OpenLayers.Map("ol_viewport", {
        controls: [
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.PanZoomBar(),
            new OpenLayers.Control.LayerSwitcher()
        ]
    });
    map.addLayer(osm);
    map.addLayer(markers);

    aux = DV.extractData(data_container, options);
    headers = aux.headers;
    results = aux.results;

    // Get the indexes of the fields
    for (i = 0; i < headers.length; i += 1) {
        aux = headers[i];
        if (aux === fields.lat) {
            latIdx = i;
        } else if (aux === fields.lon) {
            longIdx = i;
        } else if (aux === fields.description) {
            descriptionIdx = i;
        }
    }

    if (latIdx === undefined || longIdx === undefined) {
        // abort
        return;
    }

    markerClick = function (evt) {
        if (this.popup === null || this.popup === undefined) {
            this.popup = this.createPopup(this.closeBox);
            map.addPopup(this.popup);
            this.popup.show();
        } else {
            this.popup.toggle();
        }
        OpenLayers.Event.stop(evt);
    };

    for (i = 0; i < results.length; i += 1) {
        aux = results[i];
        lonlat = new OpenLayers.LonLat(parseFloat(aux[longIdx]), parseFloat(aux[latIdx]));
        lonlat.transform(
            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
            map.getProjectionObject() // to Spherical Mercator Projection
        );
        iconAux = icon.clone();
        marker = new OpenLayers.Marker(lonlat, iconAux);
        markers.addMarker(marker);

        if (descriptionIdx !== undefined) {
            // Add bubbles
            feature = new OpenLayers.Feature(markers, lonlat);
            feature.closeBox = true;
            feature.popupClass = OpenLayers.Class(OpenLayers.Popup.Anchored, { 'autoSize': true });
            feature.data.popupContentHTML = "<span class='description bubble'>" + aux[descriptionIdx] + "</span>";
            feature.data.overflow = "auto";
            marker.events.register("mousedown", feature, markerClick);
        }
    }

    // Initialize map
    map.zoomToExtent(markers.getDataExtent());
};
