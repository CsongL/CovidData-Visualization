let numRegex = /^[0-9\.]+$/,
    quoteRegex = /\"/g,
    lastCommaRegex = /,\s$/;
// countryChart
let countryChart;

let mapChart;

let tableChart;

let bubbleChart;
// store data categories
let categories;
// store date 
let dateArray;

let csv;
// store countries data
let countries;
// store the latest data used in map data
let data;
// store map data
let mapData;

let title = 'Total Confirmed COVID-19 cases';

let subtitle = 'The number of confirmed cases is lower than the number of actual cases; the main reason for that is limited testing';

let mapSeriesName = 'Current confirmed cases';

let chartType = 'map';


$(document).ready(function () {
    setDivSize();
    Highcharts.ajax({
        url: 'data/owid-covid-data-processed.csv',
        // url: 'https://covid.ourworldindata.org/data/owid-covid-data.json',
        dataType: 'csv',
        success: function (json) {
            console.log("sucessfully loaded data");
            console.log(json);
        },
        error: function (error) {
            $('#mian-page').hide();
            if (error.response != "") {
                mapData = getMapData(); // map data
                csv = error.response;

                csv = csv.split(/\n/);

                categories = csv[0].split(",");

                csv.forEach(function (line, index) {
                    csv[index] = line.split(",");
                })

                dateArray = getDate(csv);

                // get each country data of category
                countries = getDatabyCategory(csv, "total_cases");

                // latest data
                data = getLatestValue(countries, dateArray);

                $('.spinner-ellipsis').hide();
                $('#main-page').show();
                createMap(data, mapData, countries, dateArray);

            } else {
                console.log("read local data failed");
            }
        }
    });
})


function changeChoice(event) {
    let dataType = $('#choice').val();

    if (dataType === 'total_cases') {
        title = 'Total Confirmed COVID-19 cases';
        subtitle = 'The number of confirmed cases is lower than the number of actual cases; the main reason for that is limited testing'
        mapSeriesName = 'Current confirmed cases';
        $('#info .subheader').html(
            '<h4>Confirmed cases</h4><small><em>Shift + Click on map to compare countries</em></small>'
        );
    } else if (dataType === 'total_deaths') {
        title = 'Total Confirmed COVID-19 death cases';
        subtitle = 'Limited testing and challenges in the attribution of the cause of death means that the number of confirmed death may not be an accurate count of the true number of deaths from COVID-19';
        mapSeriesName = 'Current confirmed death cases';
        $('#info .subheader').html(
            '<h4>Confirmed death cases</h4><small><em>Shift + Click on map to compare countries</em></small>'
        );
    } else if (dataType === 'total_vaccinations') {
        title = 'People vaccinated against COVID-19 Vaccine';
        subtitle = '';
        mapSeriesName = 'Current vaccinated number';
        $('#info .subheader').html(
            '<h4>People vaccinated number</h4><small><em>Shift + Click on map to compare countries</em></small>'
        );
    }
    countries = getDatabyCategory(csv, dataType);
    data = getLatestValue(countries, dateArray);
    if (chartType === 'table') {
        changeToTable()
    } else if (chartType === 'map') {
        changeToMap();
    } else if (chartType === 'bubble') {
        changeToContinent();
    }
}

function changeToTable() {
    let dataType = $('#choice').val();
    if (chartType === 'map') {
        mapChart.destroy();
        $('#info').hide();
    } else if (chartType === 'bubble') {
        bubbleChart.destroy();
    }



    if (dataType == 'total_cases') {
        createLineChart();
    } else if (dataType == 'total_deaths') {
        createLineChart();
    } else if (dataType == 'total_vaccinations') {
        createBarChart();
    }
    $('#table').css("background-color", "#3498db");
    $('#map').css("background-color", "#848080");
    $('#continent').css("background-color", "#848080");
    chartType = 'table';
}

function changeToMap() {
    let dataType = $('#choice').val();
    if (chartType == 'table') {
        tableChart.destroy()
        $('#info').show();
    } else if (chartType == 'bubble') {
        bubbleChart.destroy();
        $('#info').show();
    }

    createMap(data, mapData, countries, dateArray);

    $('#map').css("background-color", "#3498db");
    $('#table').css("background-color", "#848080");
    $('#continent').css("background-color", "#848080");
    chartType = 'map';
}

function changeToContinent() {
    let dataType = $('#choice').val();
    if (chartType === 'map') {
        mapChart.destroy();
        $('#info').hide();
    } else if (chartType === 'table') {
        tableChart.destroy();
    }
    let measure = 0;
    let measureTitle = '';
    if (dataType == "total_vaccinations") {
        measure = 1000000;
        measureTitle = ' per million people'
    } else {
        measure = 100000;
        measureTitle = ' per one hundred thousand people'
    }
    let continentName = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania"];
    let dataObject = getContinentData(data, measure);
    createBubbleChart(dataObject, measureTitle);


    $('#map').css("background-color", "#848080");
    $('#table').css("background-color", "#848080");
    $('#continent').css("background-color", "#3498db");
    chartType = 'bubble';
}

function createBubbleChart(dataObject, measureTitle) {
    bubbleChart = Highcharts.chart('container', {
        chart: {
            type: 'packedbubble',
            height: '100%'
        },
        title: {
            text: title + measureTitle
        },
        tooltip: {
            useHTML: true,
            pointFormat: '<b>{point.name}:</b> {point.y}'
        },
        plotOptions: {
            packedbubble: {
                minSize: '30%',
                maxSize: '120%',
                zMin: 0,
                zMax: 1000,
                layoutAlgorithm: {
                    gravitationalConstant: 0.05,
                    splitSeries: true,
                    seriesInteraction: false,
                    dragBetweenSeries: true,
                    parentNodeLimit: true
                },
                dataLabels: {
                    enabled: true,
                    format: '{point.name}',
                    filter: {
                        property: 'y',
                        operator: '>',
                        value: 0.5
                    },
                    style: {
                        color: 'black',
                        textOutline: 'none',
                        fontWeight: 'normal'
                    }
                }
            }
        },
        series: [{
            name: 'Asia',
            data: dataObject['Asia'].sort((a, b) => b.value - a.value).slice(0, 5)
        }, {
            name: 'Europe',
            data: dataObject['Europe'].sort((a, b) => b.value - a.value).slice(0, 5)
        }, {
            name: 'North America',
            data: dataObject['North America'].sort((a, b) => b.value - a.value).slice(0, 5)
        }, {
            name: 'South America',
            data: dataObject['South America'].sort((a, b) => b.value - a.value).slice(0, 3)
        }, {
            name: 'Africa',
            data: dataObject['Africa'].sort((a, b) => b.value - a.value).slice(0, 3)
        }, {
            name: 'Oceania',
            data: dataObject['Oceania'].sort((a, b) => b.value - a.value).slice(0, 2)
        }]
    });
}
// create bar chart
function createBarChart() {
    let nation = ['IND', 'USA', 'AUS', 'GBR', 'CHN', 'FRA', 'JPN'];
    let fully_vaccinated = getDatabyCategory(csv, "people_fully_vaccinated");
    let vaccinated = getDatabyCategory(csv, "people_vaccinated");
    let total_population = getDatabyCategory(csv, "population")

    let latest_fully_vaccinated = getLatestValue(fully_vaccinated, dateArray);
    let latest_vaccinated = getLatestValue(vaccinated, dateArray);
    let latest_total_population = getLatestValue(total_population, dateArray);

    let barData = constructBarData(nation, latest_fully_vaccinated, latest_vaccinated, latest_total_population);
    let countryName = getCountryName(nation, latest_vaccinated);

    tableChart = Highcharts.chart('container', {
        chart: {
            type: 'bar'
        },
        title: {
            text: title
        },
        xAxis: {
            categories: countryName
        },
        yAxis: {
            min: 0,
            max: 100,
            title: {
                text: 'Percentage'
            },
            stackLabels: {
                enabled: true,
                formatter: function () {
                    return '<b>' + this.total + '%</b>';
                }
            }
        },
        legend: {
            reversed: true,
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'top'
        },
        tooltip: {
            formatter: function () {
                let name = this.x;
                let partly_number = this.points[0].y;
                let fully_number = this.points[1].y;
                let total = this.points[0].total;
                return '<span style="font-weight:bold">' + name + '</span><br/>' +
                    '<span style="font-weight:bold">People only partly vaccinated</span>&nbsp&nbsp<b style="font-weight:bold;">' + partly_number + '%</b><br/>' +
                    '<span>People fully vaccinated</span>&nbsp&nbsp<b>' + fully_number + '%</b><br/>' +
                    '<span style="font-weight:bold">Total</span>&nbsp&nbsp<b style="font-weight:bold;">' + total + '%</b>';
            },
            shared: true
        },
        plotOptions: {
            series: {
                stacking: 'precent',
            },
            bar: {
                dataLabels: {
                    enabled: true,
                    formatter: function () {
                        return this.y + "%";
                    },
                    inside: true
                }
            }
        },
        colors: ['#63b2ee', '#9192ab'],
        series: barData
    });
}



// create line chart
function createLineChart() {
    let lineData = getLineData();
    tableChart = Highcharts.chart('container', {
        title: {
            text: title + ', Step 14 2021'
        },
        subtitle: {
            text: "",
        },
        xAxis: {
            categories: dateArray,
            type: 'datetime',
            dateTimeLabelFormats: {
                day: '%m-%d',
            },
            crosshair: true
        },
        yAxis: {
            title: {
                text: 'Population'
            }
        },
        tooltip: {
            split: true,
            xDateFormat: '%m-%d',
            shared: true
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },
        plotOptions: {
            series: {
                labels: {
                    connectorAllowed: false
                }
            }
        },
        series: lineData
    });
}




function createMap(data, mapData, countries, dateArray) {
    // implement map select method
    // wrap point.select
    Highcharts.wrap(Highcharts.Point.prototype, 'select', function (proceed) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
        let points = mapChart.getSelectedPoints();
        if (points.length) {
            if (points.length === 1) {
                $("#flag").attr('class', 'flag ' + points[0].flag);
                $("#info-h2").html(points[0].name);
            } else {
                $('#flag').attr('class', 'flag');
                $('#info-h2').html('Compare countries');
            }
            $('#info .subheader').html(
                '<h4>Confirmed cases</h4><small><em>Shift + Click on map to compare countries</em></small>'
            );
            if (!countryChart) {
                countryChart = Highcharts.chart('country-chart', {
                    chart: {
                        height: 250,
                        spacingLeft: 0,
                    },
                    credits: {
                        enabled: false
                    },
                    title: {
                        text: null
                    },
                    subtitle: {
                        text: null
                    },
                    xAxis: {
                        tickPixeInterval: 1,
                        crosshair: true,
                        categories: dateArray,
                        type: 'datetime',
                        labels: {
                            formatter: function () {
                                let date = new Date(this.value);
                                let month = date.getMonth() + 1;
                                let day = date.getDate();
                                return month + '-' + day;
                            }
                        }

                    },
                    yAxis: {
                        title: {
                            text: 'Population'
                        },
                        opposite: true
                    },
                    tooltip: {
                        split: true,
                        xDateFormat: '%m-%d',
                        shared: true
                    },
                    plotOptions: {
                        series: {
                            animation: {
                                duration: 500
                            },
                            marker: {
                                enabled: false
                            },
                        }
                    }
                });
            }


            // remove old series and redraw
            countryChart.series.slice(0).forEach(function (s) {
                s.remove(false);
            });

            console.log("pointsforeach", points);
            // add new series
            points.forEach(function (p) {
                countryChart.addSeries({
                    name: p.name,
                    data: countries[p.code3].data,
                    type: points.length > 1 ? 'line' : 'area'
                }, false);
            });
            countryChart.redraw();
        } else {
            $('#flag').className = '';
            $('#info-h2').innerHTML = '';
            $('.subheader').innerHTML = '';
            if (countryChart) {
                countryChart = countryChart.destroy();
            }
        }

    });


    //create a mapchart
    mapChart = Highcharts.mapChart('container', {
        title: {
            text: title + " Step 14, 2021"
        },
        subtitle: {
            text: subtitle
        },
        mapNavigation: {
            enabled: true,
            buttonOptions: {
                verticalAlign: 'bottom'
            }
        },
        colorAxis: {
            type: 'logarithmic',
            endOnTick: false,
            startOnTick: false,
            min: 500

        },

        tooltip: {
            footerFormat: '<span style="font-size: 10px">(Click for details)</span>'
        },
        series: [{
            data: data,
            mapData: mapData,
            joinBy: ['iso-a3', 'code3'],
            name: mapSeriesName,
            allowPointSelect: true,
            cursor: 'pointer',
            states: {
                select: {
                    color: '#a4edba',
                    borderColor: 'black',
                    dashStyle: 'shortdot'
                }
            },
            borderWidth: 0.5
        }]
    });
    mapChart.get('us').select();
}