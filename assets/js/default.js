
/*
** Variables
**/

var map = L.map( "map", {
		center: new L.LatLng(51.5, 10.9),
		zoom: 6,
		layers: cities
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
	lineWidth, geojson;

// var layer = L.tileLayer(
// 	'http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png', {
// 		key: '980649775644402089a8c3bad401a72e',
// 		styleId: 22677,
// 		attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
// 	}
// ).setOpacity(0.5).addTo(map);

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
	return	r > 60	? 10000 :
			r > 45	? 9000 :
			r > 40	? 8000 :
			r > 35	? 7000 :
			r > 30	? 6000 :
			r > 25	? 5000 :
			r > 20	? 4000 :
			r > 15	? 3000 :
			r > 10	? 2000 :
			r > 5	? 1000 :
					  500;
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

$( sliderID ).slider({
	min: electionYears[ 0 ],
	max: electionYears[ electionYears.length - 1 ],
	value: electionYears[ 0 ],
	step: 1,
	slide: function( e, ui ) {
		document.getElementsByClassName( electionYear )[0].innerHTML = ui.value;
		// call style function
		geojson.setStyle( style );
	}
});

// output current slider year
document.getElementsByClassName( electionYear )[0].innerHTML = $( sliderID ).slider( "value" );

/*
** Info box at the upper right corner
**/

// info.onAdd = function( map ) {
// 	// create div with class 'info'
// 	this._div = L.DomUtil.create( "div", "info" );
// 	this.update();
// 	return this._div;
// };

// method that will update the control based on passed feature properties
// info.update = function( props ) {
// 	// someone hovers over a polygon
// 	if ( props ) {
// 		this._div.style.display = "block";
// 		var sliderValue = $( sliderID ).slider( "value" );
// 		this._div.innerHTML = "<b>" + props.name + "</b><br>";
// 		// there has been an election in the sliderValue year
// 		if( props.data[ sliderValue ] ) {
// 			this._div.innerHTML += germanFloat( props.data[ sliderValue ].turnout ) + "&thinsp;% (" + sliderValue + ")";
// 		} else {
// 			// put years in an array
// 			var years = objectKeys( props.data ),
// 				year = getLastYear( years, sliderValue );
// 			// if no election ever happened
// 			if ( parseInt( sliderValue ) < years[ 0 ] ) {
// 				this._div.innerHTML += "Bisher keine Wahl";
// 			} else {
// 				this._div.innerHTML += germanFloat( props.data[ year ].turnout ) + "&thinsp;% (" + year + ")";
// 			}
// 		}
// 	} else {
// 		this._div.style.display = "none";
// 	}
// };

// info.addTo( map );

var circles = [];
var cities = L.layerGroup(circles);
L.control.layers({}, {"Circles": cities}).addTo(map);

function style( feature ) {

	var sliderValue = document.getElementsByClassName( electionYear )[0].innerHTML,
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

	if(feature.id === 1) {
		circles = [];
		// L.control.layers({}, {"Circles": cities}).removeFrom(map);
	}

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

		for( var k in obj ) {
			if( obj.hasOwnProperty( k ) ) {
				var thisTurnout = obj[ k ].turnout;
				k = parseInt( k );
				// check if an election year already exists
				if ( parseInt( sliderValue ) >= k ) {

					if (year) {
						var difference = thisTurnout - obj[ year ].turnout,
							colorCircle =
								difference < 0
								? "#834d8e"
								: "#4a833e";

						if( difference ) {

							var circle = L.circle(bounds.getCenter(), circleRadius( difference ) * 5, {
								color: colorCircle,
								fillColor: colorCircle,
								fillOpacity: 1
							}).addTo(map);

							circles.push(circle);



						}

					}

					str += "<li class='hint--right' data-hint='" + germanFloat( thisTurnout ) + "&thinsp;% (" + k + ")' style='width:" + lineWidth + "%; border-top:" + ( listHeight - ( listHeight * 0.01 * thisTurnout ) ) + "em solid #f5f5f5; background:" + getLegendColor( thisTurnout ) + ";'><span style='display: none;'>" + thisTurnout + "</span></li>";
				}
			}
		}

		$( "." + singleChart + "[data-id='" + feature.id + "'] ul" ).html( str );

		result.fillColor = getLegendColor( turnout );
	}

	if(feature.id === 16) {

		cities = L.layerGroup(circles);

	}

	return result;
}

$(".charts").hide();

$("#checkbox").change(function(){
	// $(".single-chart").toggleClass("abbr");
	// $.each( data.features, function ( key, val ) {
	// 	var value =
	// 		$(".single-chart").hasClass("abbr")
	// 		? val.properties.abbr
	// 		: val.properties.name;
	// 	$(".single-chart h2").eq(key).html(value);
	// });
	$(".charts").toggle();
});

function highlightFeature( e ) {
	var layer = e.target,
		poly = layer.feature.properties,
		str = "";

	$( "." + singleChart + ":not([data-id='" + layer.feature.id + "'])" ).addClass( deHighlight );
	layer.setStyle({
		fillColor: "#000",
		fillOpacity: .5
	});

	var sliderValue = $( sliderID ).slider( "value" );

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

	layer.bindLabel(str).addTo(map);

	if ( !L.Browser.ie && !L.Browser.opera ) {
		layer.bringToFront();
	}

	//info.update( layer.feature.properties );
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
