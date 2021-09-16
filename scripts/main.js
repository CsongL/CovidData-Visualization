let numRegex = /^[0-9\.]+$/,
    quoteRegex = /\"/g,
    lastCommaRegex = /,\s$/;
// countryChart
let countryChart;

let mapChart;

let tableChart;
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

let title = 'Total Confirmed COVID-19 cases,';

let subtitle = 'The number of confirmed cases is lower than the number of actual cases; the main reason for that is limited testing';

let chartType = 'map';

$(document).ready(function () {
    Highcharts.ajax({
        url: 'data/owid-covid-data-processed.csv',
        // url: 'https://covid.ourworldindata.org/data/owid-covid-data.json',
        dataType: 'csv',
        success: function (json) {
            console.log("sucessfully loaded data");
            console.log(json);
        },
        error: function (error) {
            if (error.response != "") {
                mapData = getMapData(); // map data
                csv = error.response;
                console.log(error)
                console.log(csv)
                csv = csv.split(/\n/);

                categories = csv[0].split(",");

                csv.forEach(function (line, index) {
                    csv[index] = line.split(",");
                })

                console.log(csv);
                dateArray = getDate(csv);
                console.log('date', dateArray);

                // get each country data of category
                countries = getDatabyCategory(csv, "total_cases");
                console.log(countries);

                // latest data
                data = getLatestValue(countries, dateArray);
                console.log('data', data);
                console.log('mapdat', mapData);

                createMap(data, mapData, countries, dateArray);

            } else {
                console.log("read local data failed");
            }
        }
    });
})

function choiceType(event) {
    let dataType = $('#choice').val();

    if(dataType === 'total_cases'){
        title = 'Total Confirmed COVID-19 cases,';
        subtitle = 'The number of confirmed cases is lower than the number of actual cases; the main reason for that is limited testing'
    } else if(dataType === 'total_deaths'){
        title = 'Total Confirmed COVID-19 death cases,';
        subtitle = 'Limited testing and challenges in the attribution of the cause of death means that the number of confirmed death may not be an accurate count of the true number of deaths from COVID-19';
    } else if(dataType === 'total_vaccinations'){
        title = 'People vaccinated against COVID-19 Vaccine';
        subtitle = '';
    }
    countries = getDatabyCategory(csv, dataType);
    data = getLatestValue(countries, dateArray);
    if(chartType === 'table'){
        changeToTable()
    } else if(chartType === 'map'){
        changeToMap();
    }
}

function changeToTable() {
    let dataType = $('#choice').val();
    if(chartType === 'map'){
        mapChart.destroy();
        $('#info').hide();
    }

    if (dataType == 'total_cases') {
       createLineChart();
    }else if(dataType == 'total_deaths'){
        createLineChart();
    }else if(dataType == 'total_vaccinations'){
        createBarChart();
    }
    $('#table').css("background-color", "#3498db");
    $('#map').css("background-color", "#848080");
    chartType = 'table';
}

function changeToMap(){
    let dataType = $('#choice').val();
    if(chartType == 'table'){ 
        tableChart.destroy()
        $('#info').show();
    }

    createMap(data, mapData, countries, dateArray);

    $('#map').css("background-color", "#3498db");
    $('#table').css("background-color", "#848080");
    chartType = 'map';
}
// get line data
function getLineData() {
    let nation = ['IND', 'USA', 'AUS', 'GBR', 'CAN']
    let lineData = [];
    for (let code3 of nation) {
        console.log(countries[code3])
        lineData.push({
            name: countries[code3].name,
            data: countries[code3].data
        })
    }
    return lineData;
}

// create bar chart
function createBarChart() {
    let nation = ['IND', 'USA', 'AUS', 'GBR', 'CHN', 'FRA', 'JPN'];
    let fully_vaccinated = getDatabyCategory(csv, "people_fully_vaccinated");
    let vaccinated = getDatabyCategory(csv,"people_vaccinated");
    let total_population = getDatabyCategory(csv, "population")

    let latest_fully_vaccinated = getLatestValue(fully_vaccinated, dateArray);
    let latest_vaccinated = getLatestValue(vaccinated, dateArray);
    let latest_total_population = getLatestValue(total_population, dateArray);

    console.log(latest_fully_vaccinated);
    let barData = constructBarData(nation, latest_fully_vaccinated, latest_vaccinated, latest_total_population);
    let countryName = getCountryName(nation, latest_vaccinated);
    console.log(barData);
    tableChart = Highcharts.chart('container', {
        chart: {
            type: 'bar'
        },
        title:{
            text: title
        },
        xAxis: {
            categories : countryName
        },
        yAxis: {
            min: 0,
            max: 100,
            title: {
                text: 'Percentage'
            }
        },
        legend: {
            reversed: true
        },
        tooltip: {
            pointFormat: '<div style="background-color:{series.color}; width: 5px; height:5px"></div><b style="font-weight: bold">{series.name}</b>' + 
            '<b>{point.y}%<br/>',
            shared: true
        },
        plotOptions: {
            series: {
                stacking: 'precent'
            }
        },
        series: barData
    });
}

function getCountryName(nation, latestData){
    let countryName = [];
    for(let i = 0; i< latestData.length; i++){
        if(nation.indexOf(latestData[i].code3) != -1){
            countryName.push(latestData[i].name);
        }
    }
    return countryName;
}

function constructBarData(nation, latest_fully_vaccinated, latest_vaccinated, latest_total_population){
    let barData = [];
    let barData_fully = [];
    let barData_partly = [];
    for(let index = 0; index < latest_fully_vaccinated.length; index++){
        if(nation.indexOf(latest_fully_vaccinated[index].code3) != -1){
            let fully_vaccinated_percent = (latest_fully_vaccinated[index].value/ latest_total_population[index].value);
            let partly_vaccinated_percent = (latest_vaccinated[index].value / latest_total_population[index].value);
            let final_fully = (fully_vaccinated_percent*100).toFixed(2);
            let final_partly = (partly_vaccinated_percent*100 - fully_vaccinated_percent*100).toFixed(2);
            barData_fully.push(Number(final_fully));
            barData_partly.push(Number(final_partly));
        }
    }
    barData = [{
        name: 'People partly vaccinated',
        data: barData_partly
    },{
        name: 'People fully vaccinated',
        data: barData_fully
    }];
    return barData;
}

// create line chart
function createLineChart() {
    let lineData = getLineData();
    tableChart = Highcharts.chart('container', {
        title: {
            text: title + ' Step 14 2021'
        },
        subtitle: {
            text: "",
        },
        xAxis: {
            categories: dateArray,
            type: 'datetime',
            dateTimeLabelFormats: {
                day: '%m-%d',
            }
        },
        yAxis: {
            title: {
                text: 'Population'
            }
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
        console.log("getpoints", points);
        if (points.length) {
            console.log("setClass")
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
                        dateTimeLabelFormats: {
                            day: '%m-%d',
                        }

                    },
                    yAxis: {
                        title: {
                            text: 'Population'
                        },
                        opposite: true
                    },
                    tooltip: {
                        split: true
                    },
                    plotOptions: {
                        series: {
                            animation: {
                                duration: 500
                            },
                            marker: {
                                enabled: false
                            },
                            threshold: 0
                        }
                    }
                });
            }


            // remove old series and redraw
            countryChart.series.slice(0).forEach(function (s) {
                console.log("remove", s);
                s.remove(false);
            });

            console.log("pointsforeach", points);
            // add new series
            points.forEach(function (p) {
                console.log(p);
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
            name: 'Current confimed cases',
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

// get latest value for current number
function getLatestValue(countries, dateArray) {
    let latestData = [];
    for (let code3 in countries) {
        if (Object.hasOwnProperty.call(countries, code3)) {
            let value = null;
            let day = null;
            let itemData = countries[code3].data;
            let i = itemData.length;
            while (i--) {
                if (typeof itemData[i] === 'number') {
                    value = itemData[i];
                    day = dateArray[i];
                    break;
                }
            }
            latestData.push({
                name: countries[code3].name,
                code3: code3,
                value: value,
                day: day

            });
        }
    }
    return latestData;
}

// get map data
function getMapData() {
    let mapData = Highcharts.geojson(Highcharts.maps['custom/world']);
    mapData.forEach(function (country) {
        country.id = country.properties['hc-key']; // for Chart.get()
        country.flag = country.id.replace('UK', 'GB').toLowerCase();
    });
    return mapData;
}

//  get date array
function getDate(rawData) {
    console.log('getDate', rawData);
    let dateArray = [];
    console.log(rawData[1]);
    let iso_code = rawData[1][0];
    let i = 1;
    while (iso_code == rawData[i][0]) {
        dateArray.push(rawData[i++][3]);
    }
    return dateArray;
}

//  accoring to category to get data during one month
function getDatabyCategory(rawData, category) {

    let countries = {};
    let index = rawData[0].indexOf(category);
    console.log(index);
    for (let i = 1; i < rawData.length - 1;) {
        let iso_code = rawData[i][0];
        let countryname = rawData[i][2];
        let tempArray = [];
        while (i < rawData.length - 1 && rawData[i][0] == iso_code) {
            let val = rawData[i][index].replace(quoteRegex, '');
            if (numRegex.test(val)) {
                val = parseFloat(val);
            } else if (!val || lastCommaRegex.test(val)) {
                val = null; // 这里可能存在问题
            }
            tempArray.push(val);
            i++;
        }
        countries[iso_code] = {
            name: countryname,
            code3: iso_code,
            data: tempArray
        }

    }

    return countries;
}