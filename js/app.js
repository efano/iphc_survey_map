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
            // load  outlines
            $.getJSON('data/iphc_outline.json', function (outlineData) {
                drawMap(e.target.toGeoJSON(), data, outlineData)
            });
        });
    }).on('error', function (e) {
        console.log(e.error[0].message);
    });
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // search box
    /*var searchLayer = L.geoJson().addTo(map);
//... adding data in searchLayer ...
L.map('map', {
    searchControl: {
        layer: searchLayer
    }
});*/
    //
    // var searchControl = new L.Control.Search({
    //     layer: stations
    //     , propertyName: 'station'
    //     , circleLocation: false
    // });
    // searchControl.on('search_locationfound', function (e) {
    //     e.layer.setStyle({
    //         fillColor: 'white'
    //         , color: 'white'
    //         , fillOpacity: 0.5
    //     });
    //     //map.fitBounds(e.layer.getBounds());
    //     if (e.layer._popup) e.layer.openPopup();
    // }).on('search_collapsed', function (e) {
    //     stations.eachLayer(function (layer) {
    //         stations.resetStyle(layer);
    //     });
    // });
    // map.addControl(searchControl); //inizialize search control
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // draw symbols for stations and regions
    function drawMap(sta, areas, outlinesData) {
        //
        /*if (layer.feature.properties['pct_bin_' + currentYear] == 1) {
                layer.setStyle({
                    color: '#C6C6C5'
                    , opacity: 1
                    , weight: 1
                    , fillOpacity: 0
                });
            }
            else if (layer.feature.propertiess['pct_bin_' + currentYear] == 2) {
                layer.setStyle({
                    color: '#f03719'
                    , opacity: 1
                    , weight: 1
                    , fillOpacity: 0
                });
            }*/
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
        stations = L.geoJson(sta, {
            pointToLayer: function (feature, layer) {
                return L.circleMarker(layer, {
                    color: '#14AAC8'
                    , opacity: 1
                    , weight: 1
                    , fillOpacity: 0
                    , radius: calcRadius(feature.properties.lbs_t_2015)
                });
            }
            , onEachFeature: function (feature, layer) {
                layer.on('mouseover', function (e) {
                    layer.setStyle({
                        weight: 1
                        , color: '#f5f5f5'
                        , fillColor: '#f5f5f5'
                        , fillOpacity: .1
                    });
                    var targetIphcArea = layer.feature.properties.iphc_area;
                    regions.eachLayer(function (regionLayer) {
                        if (targetIphcArea == regionLayer.feature.properties.REG_AREA) {
                            infoWindow(regionLayer.feature.properties);
                            regionLayer.setStyle({
                                fillOpacity: .1
                            })
                            $('#info').show();
                        }
                    });
                });
                layer.on('mouseout', function (e) {
                    layer.setStyle({
                        color: '#14AAC8'
                        , opacity: 1
                        , weight: 1
                        , fillOpacity: 0
                    });
                    regions.setStyle({
                        fillOpacity: 0
                    })
                    $('#info').hide();
                });
            }
        }).addTo(map);
        //
        outlines = L.geoJson(outlinesData, {
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
        //
        sequenceUI();
        updateSymbols();
        infoWindow();
        //
        /*regions.on('mouseover', function (e) {
            var props = e.layer.feature.properties;
            regions.eachLayer(function (layer) {
                if (props.REG_AREA == layer.feature.properties.REG_AREA) {
                    layer.setStyle({
                        weight: 0
                        , color: '#f5f5f5'
                        , fillColor: '#f5f5f5'
                        , fillOpacity: .07
                    });
                }
            })
            $('#info').show();
        });
        regions.on('mouseout', function (layer) {
            regions.eachLayer(function (layer) {
                layer.setStyle({
                    color: '#f5f5f5'
                    , weight: 0
                    , fillOpacity: 0
                    , fillColor: '#f5f5f5'
                });
            })
            $('#info').hide();
        });*/
    }
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
    function infoWindow(props) {
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
                fillOpacity: .1
            });
        });
        regions.on('mouseout', function (e) {
            info.hide();
            e.layer.setStyle({
                fillOpacity: 0
            });
        });
    };
})
();