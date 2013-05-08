$(function() {

	/*
	** Variables
	**/

	var map = L.map( "map" ).setView( [ 51.25, 10.75 ], 6 ),
		electionYears = [],
		// control that shows state info on hover
		info = L.control(),
		legend = L.control( { position: "bottomright" } ),
		sliderID = "#slider",
		content = ".content",
		geojson;

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

	// get last election year
	function getLastYear( array, sliderValue ) {
		var result = null;
		$.each( array, function( key, value ) {
			if( value < parseInt( sliderValue ) ) {
				result = value;
			}
		});
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
	$.each( data.features, function ( key, val ) {
		var obj = val.properties.data;
		$('<div class="y-u-1-2 chart-' + val.id +'"><div class="y-ubox-inner" data-id=' + val.id +'><h2>' + val.properties.name + '</h2><ul/></div></div>').appendTo(".test");
		for( var k in obj ) {
			if( obj.hasOwnProperty( k ) ) {
				k = parseInt( k );
				// check if an election year already exists
				if( $.inArray( k, electionYears ) === -1 ) {
					electionYears.push( k );
				}
			}
		}
	});

	electionYears.sort();

	/*
	** Slider
	**/

	$( sliderID ).slider({
		min: electionYears[ 0 ],
		max: electionYears[ electionYears.length - 1 ],
		value: electionYears[ 0 ],
		step: 1,
		slide: function( e, ui ) {
			$( content ).html( ui.value );
			// call style function
			geojson.setStyle( style );
		}
	});

	// output current slider year
	$( content ).html( $( sliderID ).slider( "value" ) );

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
			var sliderValue = $( sliderID ).slider( "value" );
			this._div.innerHTML = "<b>" + props.name + "</b><br>";
			// there has been an election in the sliderValue year
			if( props.data[ sliderValue ] ) {
				this._div.innerHTML += "Jahr: " + sliderValue + "<br>";
				this._div.innerHTML += "Wahlbeteiligung: " + props.data[ sliderValue ].turnout;
			} else {
				// put years in an array
				var years = objectKeys( props.data );
				// if no election ever happened
				if ( parseInt( sliderValue ) < years[ 0 ] ) {
					this._div.innerHTML += "Es gab noch keine Wahl.";
				} else {
					var year = getLastYear( years, sliderValue );
					this._div.innerHTML += "Letzte Wahl im Jahr " + year + "<br>";
					this._div.innerHTML += "Wahlbeteiligung: " + props.data[ year ].turnout;
				}
			}
		} else {
			this._div.innerHTML = "Wähle ein Bundesland aus";
		}
	};

	info.addTo(map);

	function style( feature ) {
		var sliderValue = $( content ).html(),
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
			$(".test .chart-" + feature.id + " ul").empty();
		} else {
			// value is either the current sliderValue or the last election year
			var value =
					feature.properties.data[ sliderValue ]
					? sliderValue
					: year,
				turnout = feature.properties.data[ value ].turnout,
				obj = feature.properties.data,
				count = 0,
				str = "";

			for( var k in obj ) {
				if( obj.hasOwnProperty( k ) ) {
					k = parseInt( k );
					// check if an election year already exists
					if ( parseInt( sliderValue ) >= k ) {
						count++;
						str += "<li class='hint--left' data-hint='" + obj[k].turnout + " % (" + k + ")' style='left:" + (count * 4.5)  + "%; height:" + obj[k].turnout + "%; background:" + getLegendColor(obj[k].turnout) + ";'><span style='display: none;'>" + obj[k].turnout + "</span></li>";
					}
				}
			}

			$(".test .chart-" + feature.id + " ul").html( str );

			result.fillColor = getLegendColor( turnout );
		}
		return result;
	}

	function highlightFeature( e ) {
		var layer = e.target;
		$(".test div").find("[data-id='" + layer.feature.id + "']").addClass("highlight");
		layer.setStyle({
			fillColor: "#000",
			fillOpacity: .95
		});

		if ( !L.Browser.ie && !L.Browser.opera ) {
			layer.bringToFront();
		}

		info.update( layer.feature.properties );
	}

	function resetHighlight( e ) {
		var layer = e.target;
		$(".test div").find("[data-id='" + layer.feature.id + "']").removeClass("highlight");
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
			labels = [],
			from, to;
		div.innerHTML = "Wahlbeteiligung in %<br>";
		// loop through density intervals and generate label with colored square for each interval
		for ( var i = 0, length = grades.length; i < length - 1; i++ ) {
			from = grades[ i ];
			to = grades[ i + 1 ];

			labels.push(
				"<i style='background:" + getLegendColor( from + 1 ) + "'></i> " + from + "–" + to );
		}

		div.innerHTML += labels.join( "<br>" );
		return div;
	};

	legend.addTo( map );

});