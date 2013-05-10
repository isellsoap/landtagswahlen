
/*
** Variables
**/

var map = L.map( "map").setView([51.5, 10.9], 5.9),
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
// 		key: '78af7957f2434beb8355688d730a10a4',
// 		styleId: 22677,
// 		attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
// 	}
// ).addTo(map);

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

info.onAdd = function( map ) {
	// create div with class 'info'
	this._div = L.DomUtil.create( "div", "info" );
	this.update();
	return this._div;
};

// method that will update the control based on passed feature properties
info.update = function( props ) {
	// someone hovers over a polygon
	if ( props ) {
		this._div.style.display = "block";
		var sliderValue = $( sliderID ).slider( "value" );
		this._div.innerHTML = "<b>" + props.name + "</b><br>";
		// there has been an election in the sliderValue year
		if( props.data[ sliderValue ] ) {
			this._div.innerHTML += germanFloat( props.data[ sliderValue ].turnout ) + "&thinsp;% (" + sliderValue + ")";
		} else {
			// put years in an array
			var years = objectKeys( props.data ),
				year = getLastYear( years, sliderValue );
			// if no election ever happened
			if ( parseInt( sliderValue ) < years[ 0 ] ) {
				this._div.innerHTML += "Bisher keine Wahl";
			} else {
				this._div.innerHTML += germanFloat( props.data[ year ].turnout ) + "&thinsp;% (" + year + ")";
			}
		}
	} else {
		this._div.style.display = "none";
	}
};

info.addTo( map );

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

	if ( parseInt( sliderValue ) < years[ 0 ] ) {
		result.fillOpacity = 0.025;
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
					str += "<li class='hint--right' data-hint='" + germanFloat( thisTurnout ) + "&thinsp;% (" + k + ")' style='width:" + lineWidth + "%; border-top:" + ( listHeight - ( listHeight * 0.01 * thisTurnout ) ) + "em solid #f5f5f5; background:" + getLegendColor( thisTurnout ) + ";'><span style='display: none;'>" + thisTurnout + "</span></li>";
				}
			}
		}

		$( "." + singleChart + "[data-id='" + feature.id + "'] ul" ).html( str );

		result.fillColor = getLegendColor( turnout );
	}

	return result;
}

// $("button").click(function(){
// 	$(".single-chart").toggleClass("abbr");
// 	$.each( data.features, function ( key, val ) {
// 		var value =
// 			$(".single-chart").hasClass("abbr")
// 			? val.properties.abbr
// 			: val.properties.name;
// 		$(".single-chart h2").eq(key).html(value);
// 	});
// 	$(".sidebar").parent().toggleClass("bla1");
// 	$("#map").toggleClass("bla2");

// });

function highlightFeature( e ) {
	var layer = e.target;
	$( "." + singleChart + ":not([data-id='" + layer.feature.id + "'])" ).addClass( deHighlight );
	layer.setStyle({
		fillColor: "#000",
		fillOpacity: .5
	});

	if ( !L.Browser.ie && !L.Browser.opera ) {
		layer.bringToFront();
	}

	info.update( layer.feature.properties );
}

function resetHighlight( e ) {
	var layer = e.target;
	$( "." + singleChart + ":not([data-id='" + layer.feature.id + "'])" ).removeClass( deHighlight );
	geojson.resetStyle( layer );
	info.update();
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
