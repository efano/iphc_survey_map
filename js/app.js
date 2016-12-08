(function () {
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // instantiate the map
    var map = L.map('map', {
        center: [56, -165]
        , zoom: 6
        , minZoom: 1
        , maxZoom: 9
        , dragging: true
        , zoomControl: false
    });
    var tiles = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    tiles.addTo(map);
    var tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
        , subdomains: 'abcd'
        , maxZoom: 19
    });
    tiles.addTo(map);
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
    var boundaries;
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // load data
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
    $.getJSON('data/boundaries.json', function (data) {
        boundaries = L.geoJson(data, {
            style: function (feature) {
                return {
                    color: '#f5f5f5'
                    , opacity: .8
                    , weight: .5
                };
            }
        }).addTo(map);
    });
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // search box
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
                    color: '#FF9628'
                    , opacity: 1
                    , weight: 1
                    , fillOpacity: .6
                    , fillColor: filterColor(feature.properties['pct_bin_' + currentYear])
                    , radius: calcRadius(feature.properties.lbs_t_2015)
                });
            }
            , onEachFeature: function (feature, layer) {
                layer.on('mouseover', function (e) {
                    layer.setStyle({
                        weight: 1
                        , color: '#f5f5f5'
                        , fillColor: '#f5f5f5'
                        , fillOpacity: .6
                    });
                    var targetIphcArea = layer.feature.properties.iphc_area;
                    regions.eachLayer(function (regionLayer) {
                        if (targetIphcArea == regionLayer.feature.properties.REG_AREA) {
                            infoWindow(regionLayer.feature.properties);
                            regionLayer.setStyle({
                                fillOpacity: .2
                            })
                            $('#info').show();
                        }
                    });
                });
                layer.on('mouseout', function (e) {
                    layer.setStyle({
                        color: '#FF9628'
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
                    weight: 2
                    , color: '#f5f5f5'
                    , opacity: 1
                    , dashArray: '3,4'
                    , lineJoin: 'round'
                };
            }
        }).addTo(map).bringToFront();
        //
        sequenceUI();
        updateSymbols();
        infoWindow();
    }
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // resizes symbols
    function updateSymbols() {
        stations.eachLayer(function (layer) {
            var circles = layer.setRadius(calcRadius(layer.feature.properties['lbs_t_' + currentYear]));
            layer.setStyle({
                    fillColor: filterColor(layer.feature.properties['pct_bin_' + currentYear])
                })
                //tooltip
            layer.bindTooltip("<b>" + "Station ID: " + layer.feature.properties['station'] + "</b><br><hr>" + "Year: " + currentYear + "<br>" + "Number of halibut: " + layer.feature.properties['cnt_t_' + currentYear].toLocaleString() + "<br>" + "Total pounds: " + layer.feature.properties['lbs_t_' + currentYear].toLocaleString() + "<br>" + "Percent halibut over 32in: " + layer.feature.properties['pct_t_o32_' + currentYear] + "%" + "<br>" + "Pounds over 32in: " + layer.feature.properties['lbs_o32in_' + currentYear].toLocaleString(), {
                sticky: true
                , className: 'mTooltip'
            });
        });
    }
    //
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // color cirlces
    function filterColor(val) {
        if (val <= 1) {
            return '#e34a33'
        }
        else if (val <= 3) {
            return '#fdbb84'
        }
        else if (val <= 5) {
            return '#fee8c8';
        }
    }
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
                fillOpacity: .2
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