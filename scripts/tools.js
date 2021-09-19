// get a random number from x, y, z
function getSJS(x,y,z){
    let int = null;
    while(int >= x || int <= y || int === null){
        int = Math.random();
        int = (int.toFixed(z) * x).toFixed(0);
    }
    return int;
}

// set background div size
function setDivSize(){
    let box = document.getElementById('F-dynamicbg-box'),
    div = box.getElementsByTagName('div'),
    math = [0,1];
    for (let i=0;i<div.length;i++) {
        math[1] = getSJS(100,40,9)
        if(math[1] != math[2]){
            div[i].style.width = math[1] + 'px';
            div[i].style.height = math[1] + 'px';
            math[2] = math[1];
        }
    }

    for(let i=0;i<div.length;i++){
        div[i].style.left = getSJS(100,10,8) + 'vw';
        div[i].style.transform = 'rotate(' + getSJS(360,5,9) + 'deg)';
    }
}

//  get country name
function getCountryName(nation, latestData){
    let countryName = [];
    for(let i = 0; i< latestData.length; i++){
        if(nation.indexOf(latestData[i].code3) != -1){
            countryName.push(latestData[i].name);
        }
    }
    return countryName;
}

function getContinentData(latestData, measure){
    let continentName = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania"];
    let asiaData = [], europeData = [], norAmeData = [], souAmeData = [], africaData = [], oceData = [];
    for(let i= 0; i<latestData.length; i++){
        let tempObject = {
            name: latestData[i].name,
            value: Number((latestData[i].value/measure).toFixed(2))
        };
        switch(data[i].continent){
            case continentName[0]:
                asiaData.push(tempObject);
                break;
            case continentName[1]:
                europeData.push(tempObject);
                break;
            case continentName[2]:
                norAmeData.push(tempObject);
                break;
            case continentName[3]:
                souAmeData.push(tempObject);
                break;
            case continentName[4]:
                africaData.push(tempObject);
                break;
            case continentName[5]:
                oceData.push(tempObject);
                break;
        }
    }
    return {
        'Asia': asiaData,
        'Europe': europeData,
        "North America": norAmeData,
        "South America": souAmeData,
        "Africa" : africaData,
        "Oceania" : oceData
    }
}


// get bar chart data
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

// get line data
function getLineData() {
    let nation = ['IND', 'USA', 'AUS', 'GBR', 'CAN']
    let lineData = [];
    for (let code3 of nation) {
        lineData.push({
            name: countries[code3].name,
            data: countries[code3].data
        })
    }
    return lineData;
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
                continent: countries[code3].continent,
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
    let dateArray = [];
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
    for (let i = 1; i < rawData.length - 1;) {
        let iso_code = rawData[i][0];
        let continent = rawData[i][1];
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
            continent: continent,
            data: tempArray
        }

    }

    return countries;
}