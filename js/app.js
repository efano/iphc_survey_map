(function () {
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // instantiate the map
    L.mapbox.accessToken = 'pk.eyJ1IjoibGlzZmFubyIsImEiOiJjaXNnYzEzMTgwMXUwMnRydGt0eDR1c2JhIn0.fqNRiLiAZk9AbOSao4hAqw';
    var map = L.mapbox.map('map', 'mapbox.streets-satellite', {
        center: [57.2, -154]
        , zoom: 7
        , minZoom: 1
        , maxZoom: 9
        , dragging: true
        , zoomControl: false
    });
    //
    map.addControl(L.control.zoom({
        position: 'topright'
    }));
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // global variables
    var currentYear = 2015;
    var regions;
    var stations;
    var outlines;
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // load stations and regions
    omnivore.csv('data/iphc_stations.csv').on('ready', function (e) {
        $.getJSON('data/iphc_regions.json', function (data) {
            drawMap(e.target.toGeoJSON(), data)
        });
    }).on('error', function (e) {
        console.log(e.error[0].message);
    });
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // draw symbols for stations and regions
    function drawMap(sta, areas) {
        stations = L.geoJson(sta, {
            pointToLayer: function (feature, layer) {
                return L.circleMarker(layer, {
                    color: '#14AAC8'
                    , opacity: 1
                    , weight: 1
                    , fillOpacity: 0
                    , radius: calcRadius(feature.properties.lbs_t_1998)
                });
            }
        }).addTo(map);
        //
        regions = L.geoJson(areas, {
            style: function (feature) {
                return {
                    color: '#f5f5f5'
                    , weight: 0
                    , fillOpacity: 0
                    , fillColor: '#f5f5f5'
                };
            }
        }).addTo(map).bringToBack();
        //
        //circle marker mouseover/mouseout
        stations.on('mouseover', function (e) {
            var props = e.layer.feature.properties;
            stations.eachLayer(function (layer) {
                if (props.station == layer.feature.properties.station) {
                    layer.setStyle({
                        weight: 1
                        , color: '#f5f5f5'
                        , fillColor: '#f5f5f5'
                        , fillOpacity: .3
                    });
                }
            });
        });
        //
        stations.on('mouseout', function (layer) {
            stations.eachLayer(function (layer) {
                layer.setStyle({
                    color: '#14AAC8'
                    , opacity: 1
                    , weight: 1
                    , fillOpacity: 0
                });
            });
        });
        //
        // regions mouseover/mouseout
        regions.on('hover', function (e) {
            var props = e.layer.feature.properties;
            regions.eachLayer(function (layer) {
                if (props.REG_AREA == layer.feature.properties.REG_AREA) {
                    layer.setStyle({
                        color: '#f5f5f5'
                        , weight: 0
                        , opacity: 1
                        , fillColor: '#f5f5f5'
                    });
                }
            });
        });
        regions.on('mouseout', function (layer) {
            regions.eachLayer(function (layer) {
                layer.setStyle({
                    color: '#f5f5f5'
                    , weight: 0
                    , fillOpacity: 0
                    , fillColor: '#f5f5f5'
                });
            });
        });
        //
        sequenceUI();
        updateSymbols();
        infoWindow();
    }
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // load and draw outlines
    $.getJSON('data/iphc_outline.json', function (data) {
        regions = L.geoJson(data, {
            style: function (feature) {
                return {
                    weight: 0
                    , color: '#f5f5f5'
                    , opacity: .8
                    , weight: 2
                    , dashArray: '3,4'
                    , lineJoin: 'round'
                };
            }
        }).addTo(map).bringToFront();
    });
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // resizes symbols
    function updateSymbols() {
        stations.eachLayer(function (layer) {
            var circles = layer.setRadius(calcRadius(layer.feature.properties['lbs_t_' + currentYear]));
            //
            //tooltip
            layer.bindTooltip("<b>" + "Station ID: " + layer.feature.properties['station'] + "</b><br><hr>" + "Year: " + currentYear + "<br>" + "Number of halibut: " + layer.feature.properties['cnt_t_' + currentYear].toLocaleString() + "<br>" + "Total pounds: " + layer.feature.properties['lbs_t_' + currentYear].toLocaleString() + "<br>" + "Percent halibut over 32in: " + layer.feature.properties['pct_t_o32_' + currentYear] + "%" + "<br>" + "Pounds over 32in: " + layer.feature.properties['lbs_o32in_' + currentYear].toLocaleString(), {
                sticky: true
                , className: 'mTooltip'
            });
            //
            /*if (props['pct_bin_' + currentYear] == 1) {
                layer.setStyle({
                    color: '#C6C6C5'
                    , opacity: 1
                    , weight: 1
                    , fillOpacity: 0
                });
            }
            else if (props['pct_bin_' + currentYear] == 2) {
                layer.setStyle({
                    color: '#f03719'
                    , opacity: 1
                    , weight: 1
                    , fillOpacity: 0
                });
            }*/
        });
    }
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // radius formula
    function calcRadius(val) {
        var radius = Math.sqrt(val / Math.PI);
        return radius * .5;
    }
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // jquery slider action
    function sequenceUI() {
        $('.slider').on('input change', function () {
            currentYear = $(this).val();
            updateSymbols();
        });
    }
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // infowindow
    function infoWindow() {
        var info = $('#info');
        regions.on('mouseover', function (e) {
            info.show();
            var props = e.layer.feature.properties;
            $('#info span').text(props.REG_AREA);
            $(".info_year span").text(currentYear);
            $(".info_T_CNT span").text(props['TCNT_' + String(currentYear)].toLocaleString());
            $(".info_T_LBS span").text(props['TLBS_' + String(currentYear)].toLocaleString());
            $(".info_PCT_T span").text(props['PTO32_' + String(currentYear)].toLocaleString());
            $(".info_T_LBS_O span").text(props['LO32_' + String(currentYear)].toLocaleString());
            e.layer.setStyle({
                fillOpacity: .3
            });
        });
        regions.on('mouseout', function (e) {
            info.hide();
            e.layer.setStyle({
                fillOpacity: 0
            });
        });
    };
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // search box
    var searchControl = new L.Control.Search({
        layer: stations
        , propertyName: 'station'
        , circleLocation: false
        , moveToLocation: function (latlng, title, map) {
            //map.fitBounds( latlng.layer.getBounds() );
            var zoom = map.getBoundsZoom(latlng.layer.getBounds());
            map.setView(latlng, zoom); // access the zoom
        }
    });
    searchControl.on('search:locationfound', function (e) {
        e.layer.setStyle({
            fillColor: '#3f0'
            , color: '#0f0'
        });
        if (e.layer._popup) e.layer.openPopup();
    }).on('search:collapsed', function (e) {
        featuresLayer.eachLayer(function (layer) { //restore feature color
            featuresLayer.resetStyle(layer);
        });
    });
    map.addControl(searchControl); //inizialize search control
    //
})
();