(function () {
    // instantiate the map
    var map = L.map('map', {
        center: [59.5, -151],
        zoom: 7,
        minZoom: 4,
        maxZoom: 9,
        dragging: true,
        zoomControl: false
    });
    var tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    tiles.addTo(map);
    var tiles2 = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });
    tiles2.addTo(map);

    map.addControl(L.control.zoom({
        position: 'topright'
    }));

    // global variables
    var currentYear = 2015,
        regions, stations, boundaries;

    // load data
    omnivore.csv('data/iphc_stations.csv').on('ready', function (e) {
        $.getJSON('data/iphc_regions.json', function (data) {
            // load  outlines
            $.getJSON('data/boundaries.json', function (boundaries) {
                drawMap(e.target.toGeoJSON(), data, boundaries)
            });
        });
    }).on('error', function (e) {
        console.log(e.error[0].message);
    });

    // draw symbols for stations and regions
    function drawMap(sta, areas, bounds) {
        regions = L.geoJson(areas, {
            style: function (feature) {
                return {
                    color: '#f5f5f5',
                    weight: .5,
                    fillOpacity: 0,
                    lineJoin: 'round',
                    fillColor: '#f5f5f5',
                    dashArray: '3,4'
                };
            }
        }).addTo(map).bringToBack();

        stations = L.geoJson(sta, {
            pointToLayer: function (feature, layer) {
                return L.circleMarker(layer, {
                    color: filterColor(feature.properties['pct_bin_' + currentYear]),
                    opacity: 1,
                    weight: 2,
                    fillColor: filterColor(feature.properties['pct_bin_' + currentYear]),
                    fillOpacity: .1,
                    radius: calcRadius(feature.properties.lbs_t_2015)
                });
            },
            onEachFeature: function (feature, layer) {
                layer.on('mouseover', function (e) {
                    layer.setStyle({
                        weight: 1,
                        color: filterColor(feature.properties['pct_bin_' + currentYear]),
                        fillColor: filterColor(feature.properties['pct_bin_' + currentYear]),
                        fillOpacity: .5,
                        weight: 4
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
                        color: filterColor(feature.properties['pct_bin_' + currentYear]),
                        opacity: 1,
                        weight: 2,
                        fillColor: filterColor(feature.properties['pct_bin_' + currentYear]),
                        fillOpacity: .1
                    });
                    regions.setStyle({
                        fillOpacity: 0
                    })
                    $('#info').hide();
                });
            }
        }).addTo(map);

        boundaries = L.geoJson(bounds, {
            style: function (feature) {
                return {
                    color: '#f5f5f5',
                    opacity: .8,
                    weight: .5
                };
            }
        }).addTo(map).bringToFront();

        sequenceUI();
        updateSymbols();
        infoWindow();
    }

    // resizes symbols
    function updateSymbols() {
        $(".year span").text(currentYear);
        stations.eachLayer(function (layer) {
            var circles = layer.setRadius(calcRadius(layer.feature.properties['lbs_t_' + currentYear]));
            layer.setStyle({
                color: filterColor(layer.feature.properties['pct_bin_' + currentYear]),
                fillColor: filterColor(layer.feature.properties['pct_bin_' + currentYear])
            });

            layer.bindTooltip("<b>" + "Station ID:&nbsp; " + layer.feature.properties['station'] + "</b><br><hr>" + "Year:&nbsp; " + currentYear + "<br>" + "Number of halibut:&nbsp; " + layer.feature.properties['cnt_t_' + currentYear].toLocaleString() + "<br>" + "Total pounds:&nbsp; " + layer.feature.properties['lbs_t_' + currentYear].toLocaleString() + "<br>" + "Percent halibut over 32in:&nbsp; " + layer.feature.properties['pct_t_o32_' + currentYear] + "%" + "<br>" + "Pounds over 32in:&nbsp; " + layer.feature.properties['lbs_o32in_' + currentYear].toLocaleString(), {
                sticky: true,
                className: 'mTooltip'
            });
        });
    }

    // color cirlces
    function filterColor(val) {
        if (val == 1) {
            return '#C0C1BF'
        } else if (val == 2) {
            return '#cb181d'
        } else if (val == 3) {
            return '#fc9272'
        } else if (val == 4) {
            return '#15B6FF'
        } else if (val == 5) {
            return '#0057FF'
        }
    };

    // radius formula
    function calcRadius(val) {
        var radius = Math.sqrt(val / Math.PI);
        return radius * .5;
    }


    // hide stations feature when zooming out
    map.on('zoomend', onZoomend);

    function onZoomend() {
        if (map.getZoom() <= 5) {
            map.removeLayer(stations);
        };
        if (map.getZoom() > 5) {
            map.addLayer(stations);
        };
    };

    // jquery slider action
    function sequenceUI() {
        $('.slider').on('input change', function () {
            currentYear = $(this).val();
            updateSymbols();
        });
    }

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
            $(".stats").html(props);

            var tlbs = [props['TLBS_1998'], props['TLBS_1999'], props['TLBS_2000'], props['TLBS_2001'], props['TLBS_2002'], props['TLBS_2003'], props['TLBS_2004'], props['TLBS_2005'], props['TLBS_2006'], props['TLBS_2007'], props['TLBS_2008'], props['TLBS_2009'], props['TLBS_2010'], props['TLBS_2011'], props['TLBS_2012'], props['TLBS_2013'], props['TLBS_2014'], props['TLBS_2015']];

            $('.TLBSspark').sparkline(tlbs, {
                type: 'bar',
                barWidth: 9,
                height: '30',
                barColor: '#cb181d',
                nullColor: '#888 '
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