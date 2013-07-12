
/*
** Variables
**/

var map = L.map( "map", {
		center: new L.LatLng(51.5, 10.9),
		zoom: 6
	}),
	electionYears = [],
	// control that shows state info on hover
	info = L.control(),
	legend = L.control( { position: "bottomright" } ),
	electionYear = "year",
	sliderID = "#slider",
	charts = ".charts",
	singleChart = "single-chart",
	singleChartGrid = "y-u-1-4",
	deHighlight = "single-chart--de-highlight",
	lineWidth, geojson, fillThisCircle, clickableProp;

var layer = L.tileLayer(
	'http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png', {
		key: '980649775644402089a8c3bad401a72e',
		styleId: 22677,
		attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
	}
).setOpacity(0.5).addTo(map);

/*
** General functions
**/

function germanFloat( num ) {
	return num.toString().replace( ".", "," );
}

// get last election year
function getLastYear( array, sliderValue ) {
	var result = null;
	for ( var i = 0, length = array.length; i < length; i++ ) {
		if( array[i] < parseInt( sliderValue ) ) {
			result = array[i];
		}
	}
	return result;
}

// get array of object keys
function objectKeys( obj ) {
	var result = [];
	for( var k in obj ) {
		if( obj.hasOwnProperty( k ) ) {
			result.push( parseInt( k ) );
		}
	}
	return result;
}

// get legend color based on a threshold
function getLegendColor( d ) {
	return	d > 90	? "#4a833e" :
			d > 80	? "#9dc375" :
			d > 70	? "#d9e9ad" :
			d > 60	? "#ceb9c4" :
			d > 50	? "#b792b5" :
			d > 40	? "#834d8e" :
					  "#fff";
}

function circleRadius( r ) {
	r = Math.abs(r);
	return	r > 15	? 100000 :
			r > 10	? 25000 :
			r > 5	? 12500 :
			r > 0	? 6250 :
					  500;
}

function roundNumber(number, digits) {
	var multiple = Math.pow(10, digits);
	return Math.round(number * multiple) / multiple;
}

// build an array of all election years and add lists for the sidebar

for ( var i = 0, length = data.features.length; i < length; i++ ) {
	var obj = data.features[ i ].properties.data;
	$('<div class="' + singleChartGrid + ' chart-' + data.features[i].id +'"><div class="single-chart" data-id=' + data.features[i].id +'><h2>' + data.features[i].properties.name + '</h2><ul/></div></div>').appendTo( charts );
	for( var k in obj ) {
		if( obj.hasOwnProperty( k ) ) {
			k = parseInt( k );
			// check if an election year already exists
			if( $.inArray( k, electionYears ) === -1 ) {
				electionYears.push( k );
			}
		}
	}
}

electionYears.sort();

// must be located exactly here
var listHeight = document.getElementsByClassName( singleChart )[0].getElementsByTagName( "ul" )[0].offsetHeight / 16;

/*
** Slider
**/

function labelStuff(layer, sliderValue) {
	var poly = layer.feature.properties,
		str = "";

	str = poly.name + "<br>";
	// there has been an election in the sliderValue year
	if( poly.data[ sliderValue ] ) {
		str += germanFloat( poly.data[ sliderValue ].turnout ) + "&thinsp;% (" + sliderValue + ")";
	} else {
		// put years in an array
		var years = objectKeys( poly.data ),
			year = getLastYear( years, sliderValue );
		// if no election ever happened
		if ( parseInt( sliderValue ) < years[ 0 ] ) {
			str += "Bisher keine Wahl";
		} else {
			str += germanFloat( poly.data[ year ].turnout ) + "&thinsp;% (" + year + ")";
		}
	}
	return str;
}

$( sliderID ).slider({
	min: electionYears[ 0 ],
	max: electionYears[ electionYears.length - 1 ],
	value: electionYears[ 0 ],
	step: 1,
	slide: function( e, ui ) {
		document.getElementsByClassName( electionYear )[0].innerHTML = ui.value;

		geojson.eachLayer(function (layer) {


		    // layer.feature is available
		    layer.bindLabel(labelStuff(layer, ui.value));
		});


		// call style function
		geojson.setStyle( style );
	}
});




// output current slider year
document.getElementsByClassName( electionYear )[0].innerHTML = $( sliderID ).slider( "value" );

function style( feature ) {

	if(typeof window["featureNumber" + feature.id] === 'undefined') {
		window["featureNumber" + feature.id] = new L.circle(
			[0,0], 0
		).addTo(map);
	}

	var sliderValue = +document.getElementsByClassName( electionYear )[0].innerHTML,
		years = objectKeys( feature.properties.data ),
		year = getLastYear( years, sliderValue ),
		result = {
			fillOpacity: 1,
			fillColor: "#000",
			//border
			weight: 1,
			opacity: 1,
			color: "#fff"
		};

	var bounds = new L.LatLngBounds(),
		polygonCoords = feature.geometry.coordinates;

	if(feature.geometry.type === "Polygon") {
		// weird: one must switch longitude and langitude
		for (var i = 0; i < polygonCoords[0].length; i++) {
		  bounds.extend([polygonCoords[0][i][1], polygonCoords[0][i][0]]);
		}

	} else if (feature.geometry.type === "MultiPolygon")  {
		// weird: one must switch longitude and langitude
		for (var i = 0; i < polygonCoords.length; i++) {
			for (var j = 0; j < polygonCoords[i].length; j++) {
				for (var k = 0; k < polygonCoords[i][j].length; k++) {
					bounds.extend([polygonCoords[i][j][k][1], polygonCoords[i][j][k][0]]);
				}
			}
		}
	}

	if ( parseInt( sliderValue ) < years[ 0 ] ) {
		result.fillOpacity = 1;
		result.fillColor = '#fff';

		// remove HTML
		document.getElementsByClassName( "chart-" + feature.id )[0].getElementsByTagName( "ul" )[0].innerHTML = "";
	} else {
		// value is either the current sliderValue or the last election year
		var value =
				feature.properties.data[ sliderValue ]
				? sliderValue
				: year,
			turnout = feature.properties.data[ value ].turnout,
			obj = feature.properties.data,
			str = "";
		lineWidth = 100 / Object.keys( obj ).length;

		var arrResult = [];

		// console.log(years);
		// compute turnout changes
		for (var i = 1; i < years.length; i++) {
			arrResult.push([years[i], roundNumber(obj[years[i]].turnout - obj[years[i - 1]].turnout, 2)]);
		}

		for( var k in obj ) {
			if( obj.hasOwnProperty( k ) ) {
				var thisTurnout = obj[ k ].turnout;
				k = parseInt( k );
				// check if an election year already exists
				if ( parseInt( sliderValue ) >= k ) {
					str += "<li class='hint--right' data-hint='" + germanFloat( thisTurnout ) + "&thinsp;% (" + k + ")' style='width:" + lineWidth + "%; border-top:" + ( listHeight - ( listHeight * 0.01 * thisTurnout ) ) + "em solid #f5f5f5; background:" + getLegendColor( thisTurnout ) + ";'><span style='display: none;'>" + thisTurnout + "</span></li>";
				}
			}
		}

		if ($('#checkbox2').is(':checked')) {
			fillThisCircle = 1;
			clickableProp = true;
		} else {
			fillThisCircle = 0;
			clickableProp = false;
		}

		// create circle
		for (var i = 0; i < arrResult.length; i++) {
			if(arrResult[i][0] === value ) {
				var colorCircle =
					arrResult[i][1] < 0
					? "#ff0000"
					: "#00ff00";

				map.removeLayer(window["featureNumber" + feature.id]);
				// console.log(arrResult[i][1]);
				window["featureNumber" + feature.id] = new L.circle(
					bounds.getCenter(), circleRadius( arrResult[i][1] ), {
						color: 'transparent',
						fillColor: colorCircle,
						fillOpacity: fillThisCircle,
						clickable: clickableProp
					}
				).bindLabel(germanFloat(arrResult[i][1]) + " % Unterschied zur<br> Vorwahl " + year + " in " + feature.properties.name);

				map.addLayer(window["featureNumber" + feature.id]);

				break;
			}


		if(arrResult[0][0] > value) {
			map.removeLayer(window["featureNumber" + feature.id]);
		}
		}

		$( "." + singleChart + "[data-id='" + feature.id + "'] ul" ).html( str );

		result.fillColor = getLegendColor( turnout );
	}

	return result;
}

$(".charts").hide();

$("#checkbox1").change(function(){
	$(".charts").toggle();
});

$("#checkbox2").change(function() {
	if ($('#checkbox2').is(':checked')) {
			fillThisCircle = 1;
			clickableProp = true;
		} else {
			fillThisCircle = 0;
			clickableProp = false;
		}
	geojson.eachLayer(function (layer) {
		window["featureNumber" + layer.feature.id].setStyle({
			fillOpacity: fillThisCircle,
			clickable: clickableProp
		});
	});
});

function highlightFeature( e ) {
	var layer = e.target;

	$( "." + singleChart + ":not([data-id='" + layer.feature.id + "'])" ).addClass( deHighlight );
	layer.setStyle({
		fillColor: "#000",
		fillOpacity: .5
	});

	// if ( !L.Browser.ie && !L.Browser.opera ) {
	// 	layer.bringToFront();
	// }

}

function resetHighlight( e ) {
	var layer = e.target;
	$( "." + singleChart + ":not([data-id='" + layer.feature.id + "'])" ).removeClass( deHighlight );
	geojson.resetStyle( layer );
	//info.update();
}

function zoomToFeature( e ) {
	map.fitBounds( e.target.getBounds() );
}

function onEachFeature( feature, layer ) {

	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight,
		click: zoomToFeature
	});
}

/*
** GeoJSON
**/

// add geoJSON information to map with style and event listeners

geojson = L.geoJson(data, {
	style: style,
	onEachFeature: onEachFeature
}).addTo( map );

geojson.eachLayer(function (layer) {
	// layer.feature is available
	layer.bindLabel(labelStuff(layer, +document.getElementsByClassName( electionYear )[0].innerHTML));
});

/*
** Legend
**/

legend.onAdd = function( map ) {
	var div = L.DomUtil.create( "div", "info legend" ),
		grades = [ 40, 50, 60, 70, 80, 90, 100 ],
		length = grades.length,
		labels = [],
		str = "",
		from, to;
	str = "<h2>Wahlbet. in %</h2>";
	str += "<ul>";
	for ( var i = length - 1; i > 0; i-- ) {
		from = grades[ i ];
		to = grades[ i - 1 ];
		str += "<li style='border-left-color:" + getLegendColor( from - 1 ) + ";'>" + to + "+</li>";
	}
	str += "</ul>";
	div.innerHTML = str;
	return div;
};

legend.addTo( map );

svgObj = $('path[stroke="transparent"]');
svgObj.css('z-index', 9999);
