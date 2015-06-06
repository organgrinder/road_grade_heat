
<!DOCTYPE html>
<html>
<head>
<title>Hill Mapper San Francisco</title>
<meta name="description" content="Colors show which streets go uphill or downhill from your location, and their steepness." />
<meta name="author" content="Samuel Maurer" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
<link rel="image_src" href="resources/thumbnail.png" />
<link rel="image_src" href="resources/thumbnail2.png" />

<!-- Open Graph properties for Facebook -->
<meta property="og:url" content="http://hillmapper.com" />
<meta property="og:title" content="Hill Mapper San Francisco" />
<meta property="og:description" content="Colors show which streets go uphill or downhill from your location, and their steepness." />
<meta property="og:image" content="http://hillmapper.com/resources/thumbnail.png" />

<style type="text/css">
  html {
  	width: 100%;
	height: 100%;
  }
  body {
  	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
	font-family: Helvetica, sans-serif;
	font-size: 13px;
  }
  div#header { 
  	height: 34px;
  	background-color: #fafbfc;
	border-bottom: 1px solid #999;
	display: none;
  }
  div#header_left {
  	float: left;
	padding: 9px 0px 0px 100px;
	font-size: 16px;
	font-weight: bold;
  }
  div#header_twitter {
  	float: right;
	padding: 7px 8px 5px 0px;
  }
  div#header_facebook {
  	float: right;
	padding: 7px 30px 5px 0px;
  }
  div#map_canvas { 
  	position: absolute;
  	top: 35px;
  	right: 0px;
  	bottom: 0px;
  	left: 0px;
  }
  div#control_box_mobile {
	border: 1px solid #999;
	width: 115px;
	top: 5px;
	margin-left: 5px;
	position: absolute;
	background-color: #FFF;
	opacity: 0.9;
	padding: 8px 0px 4px 10px;
	display: none;
  }
  div#control_box {
	border: 1px solid #999;
	width: 240px;
	top: 55px;
	margin-left: 90px;
	position: absolute;
	background-color: #FFF;
	opacity: 0.9;
	padding: 8px 10px 8px 15px;
	display: none;
  }
  div#image-bg {
	position: fixed;
	width: 360;
	height: 640px;
	bottom: 0px;
	right: 0px;
	display: none;
  }
  div#instructions_mobile { 
  	position: absolute;
  	font-size: 16px;
  	width: 240px;
  	top: 0px;
  	left: 0px;
  	padding: 5px;
  	background-color: #FFF;
	border: 1px solid #000;
  	opacity: 0.9;
  	padding: 15px 0px 15px 20px;
  	display: none;
  }
  div {
	margin-bottom: 0px;	  
  }
  .title {
	font-size: 14px;
	font-weight: bolder;
	margin-bottom: 8px;
	text-align: center;
  }
  .descript {
	font-weight: bold;
  }
  ol {
 	padding-left: inherit;
	margin-bottom: 0px;
  }
  ol.mobile {
 	padding-left: 20px;
  }
  li {
	margin-bottom: 6px;
  }
  a {
	cursor: pointer;
	color: #08519c;
	text-decoration: none;
  }
  #show {
	display: none;
  }
  hr {
	margin-bottom: 5px;
  }
  #actions {
  	text-align: left;
	margin-bottom: 5px;
  }
  .action_mobile {
  	text-align: left;
	margin-bottom: 5px;
  }
  .star {
    color: #08519c;
	opacity: 0.8;
  }
  #search {
	font-weight: bold;
	margin-bottom: 5px;
  }
  #search_box {
	margin-left: 0px;
	display: table-cell; 
	width: 96%;
  }
  #instructions {
  	font-size: 12px;
  	text-align: left;
	margin-bottom: 5px;
  }
  #detect {
  	text-align: left;
	margin-bottom: 5px;
  }
  #footer {
	font-size: 11px;
	text-align: right;
	margin-bottom: 0px;
  }
  div#alert {
  	position: absolute;
	border: 2px solid #000;
	top: 0px;
	left: 0px;
	width: 320px;
	background-color: #FFF;
	padding: 10px 12px;
	display: none;
  }
  div#alert-left {
	float: left;
	width: 270px; 
	font-size: 14px;
  }
  div#alert-right {
	float: right;
	padding-top: 0px;
  }
</style>

<script src="http://maps.googleapis.com/maps/api/js?sensor=true&libraries=geometry,places"></script>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js"></script>
<script src="resources/infobox_packed.js"></script>

<script type="text/javascript">

// Declare map and overlay elements
var isMobile;
var map;
var locMarker;
var infoWindow;
var markerCircles = [];
var gradeLines = [];

// Each object in gradeLines[] will have the following components:
// - obj (Google Polyline)
//		Actual object that's overlayed on the map, constructed from path in the JSON file
// - grade (float)
//		grade of the line, from the JSON file
// - highLatLng (Google LatLng)
// - lowLatLng (Google LatLng)
//		LatLngs for the high and low endpoints of the grade line
//		Pulling these from the array seems faster than using obj.getPath().getAt(x)
// - uphill (bool)
//		Records whether the grade line is currently rendered as uphill or downhill
//		This speeds up the refreshing by letting us update grade line styles selectively
// - onscreen (bool)
//		Records whether the grade line is currently visible within the viewport
//		This speeds up the refreshing by letting us update grade line styles selectively

var initialMapZoom = 14;
var initialMapType = 'map';
var initialMapCenter = new google.maps.LatLng(37.7915, -122.4345);
var initialMarkerPosition = new google.maps.LatLng(37.7815, -122.4345);
var markerCircleRadiuses = [50, 130, 230, 350]; // radiuses in meters at zoom level 15, automatically scaled
var markerCircleOpacities = [0.12, 0.06, 0.04, 0.025];

var SF_BOUNDS = new google.maps.Polygon({
	paths: [
		new google.maps.LatLng(37.7034, -122.3514),
		new google.maps.LatLng(37.8149, -122.3514),
		new google.maps.LatLng(37.8149, -122.5192),
		new google.maps.LatLng(37.7034, -122.5192),
	],
});


function initialize() {

	detectMobile();
	if (isMobile)
		initialMapCenter = initialMarkerPosition;

	parseHashParams();
	isMobile ? setUpMobileUI() : setUpDesktopUI();
	
	setUpMap();
	setUpLocMarker();
	setUpSearchBox();
	var xhr = new XMLHttpRequest();
	try {
		xhr.open('GET', 'data/webdata.json', true);
	} catch(err) {
//		alert(err.description);
	}
	xhr.onload = function() {
//		alert('data loaded');
		loadJSON(JSON.parse(this.responseText)); 
		updateGradeLineVisibility();
		updateDirectionStyles();
		activateGradeLines();
		// Set up non-visible items last:
		setTimeout(function() {
			updateDirectionStyles(true);
			activateGradeLines(true);
			addGradeLineListeners();
		}, 500);
	};
	xhr.send();
}

function detectMobile() {
	// needs: isMobile

	isMobile = (screen.width < 400 || screen.height < 400) ? true : false;

	if (window.location.search == '') 
		return;
	
	// Allows people to use ?mobile=true or ?mobile=false to force a UI
	var params = window.location.search.substr(1).split('&');
	for (var i=0; i<params.length; i++) {
		if (params[i].split('=')[0] == 'mobile') {
			if (params[i].split('=')[1] == 'true')
				isMobile = true;
			else if (params[i].split('=')[1] == 'false')
				isMobile = false;
		}
	}
}

function setUpMobileUI() {
	$('#control_box_mobile').show();
	$('#instructions_mobile').center();
	$('#map_canvas').css({top: '0px'});
	tryGeolocation(true);
}

function setUpDesktopUI() {
	$('#header').show();
	$('#control_box').show();
	
	// Facebook code
	(function(d, s, id) {
	  var js, fjs = d.getElementsByTagName(s)[0];
	  if (d.getElementById(id)) return;
	  js = d.createElement(s); js.id = id;
	  js.src = "//connect.facebook.net/en_US/all.js#xfbml=1";
	  fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));

	// Twitter code
	!function(d,s,id) {
		var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';
		if(!d.getElementById(id)){js=d.createElement(s);
		js.id=id;
		js.src=p+'://platform.twitter.com/widgets.js';
		fjs.parentNode.insertBefore(js,fjs);
	}}(document, 'script', 'twitter-wjs');
}

function parseHashParams() {
	// needs: initialMapZoom, initialMapType, initialMapCenter, initialMarketPosition	

	if (window.location.hash == '')
		return;	
	var hash = window.location.hash.substr(1).split('/');
	
	// First check for existence of each parameter and put into correct data type
	var z = hash[0] ? parseInt(hash[0]) : '';
	var t = hash[1] ? hash[1] : '';
	var m_lat = hash[2] ? parseFloat(hash[2]) : '';
	var m_lng = hash[3] ? parseFloat(hash[3]) : '';
	var c_lat = hash[4] ? parseInt(hash[4]) : '';
	var c_lng = hash[5] ? parseInt(hash[5]) : '';

	if (isNaN(z) || isNaN(m_lat) || isNaN(m_lng) || isNaN(c_lat) || isNaN(c_lng)) {
		err();
		return;
	}
	if (! (t == 'map' || t == 'terrain' || t == 'satellite')) {
		err();
		return;
	}
	
	// Satellite imagery not included in mobile interface, so use terrain instead
	if (isMobile && t == 'satellite')
		t = 'terrain';
	
	var m = new google.maps.LatLng(m_lat, m_lng);
	var c = new google.maps.LatLng(m_lat-c_lat/10000, m_lng-c_lng/10000);
	var cdb = google.maps.geometry.spherical.computeDistanceBetween;	
	
	// If either latlng is greater than 50 km from SF, probably an error
	if ((cdb(m, initialMapCenter) > 50000) || (cdb(c, initialMapCenter) > 50000)) {
		err();
		return;
	}
		
	initialMapZoom = z;
	initialMapType = t;
	initialMarkerPosition = m;
	initialMapCenter = c;
	
	function err() {
		window.location.hash = 'error_loading_link';
	}
}

function setUpMap() {
	// needs: map, initialMapZoom, initialMapType, initialMapCenter

	var mapStyles = [ 
		{featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{color: '#f8f1e3'}] },
		{featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#a5bfdd'}] },
		{featureType: 'poi', stylers: [{visibility: 'off'}] },
		{featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{visibility: 'on'}, {color: '#d9e8bd'}] },
		{featureType: 'transit', stylers: [{visibility: 'off'}] },
		{featureType: 'transit.station.rail', stylers: [{visibility: 'on'}] },
		{featureType: 'road', elementType: 'geometry.fill', stylers: [{color: '#ffffff'}] },
		{featureType: 'road', elementType: 'geometry.stroke', stylers: [{lightness: 40}] },
		{featureType: 'road', elementType: 'labels.icon', stylers: [{visibility: 'off'}] },
		{featureType: 'road', elementType: 'labels.text.stroke', stylers: [{color: '#ffffff'}] },
		{featureType: 'road.highway.controlled_access', 
			elementType: 'geometry.fill', stylers: [{color: '#fbc042'}, {lightness: 70}] },
	];

	var customMapType = new google.maps.StyledMapType(mapStyles, {name: 'Map'});
	
	// this is just to translate the initialMapType shorthand into the real identifiers
	var mapTypes = {
		map: 'Map', 
		terrain: google.maps.MapTypeId.TERRAIN, 
		satellite: google.maps.MapTypeId.SATELLITE,
	};
	
	var mapTypeIds = isMobile ? 
		[mapTypes.map, mapTypes.terrain] :
		[mapTypes.map, mapTypes.terrain, mapTypes.satellite];
	
    var mapOptions = {
		zoom: initialMapZoom,
		center: initialMapCenter,
		scaleControl: true,
		streetViewControl: false,
		mapTypeId: mapTypes[initialMapType],
		mapTypeControlOptions: {
        	mapTypeIds: mapTypeIds,
        }
	};

	map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
	map.mapTypes.set('Map', customMapType);
	
	google.maps.event.addListener(map, 'idle', function() {
		// this picks up 'dragend', 'zoom_changed', AND the initial map load
		// maybe can simplify this if there's an event for initial map load...
		updateGradeLineVisibility();
	});
	google.maps.event.addListener(map, 'click', function() {
		if (infoWindow)
			infoWindow.close();
	});
	google.maps.event.addListener(map, 'maptypeid_changed', function() {
		updateLink();
	});
	google.maps.event.addListener(map, 'dragend', function() {
		updateLink();
	});
	google.maps.event.addListener(map, 'zoom_changed', function() {
		scaleMarkerCircles();
		updateLink();
	});
	
	// Draw boundary line at the south edge of SF
	var boundary = new google.maps.Polyline({
		map: map,
		path: [
			new google.maps.LatLng(37.7083, -122.3932),
			new google.maps.LatLng(37.7083, -122.5023)
		],
		clickable: false,
		strokeColor: 'black',
		strokeOpacity: 0.3,
		strokeWeight: 2,
	});
}

function setUpLocMarker() {
	// needs: map, initialMarkerPosition, initialMapZoom, locMarker, 
	//    markerCircles, markerCircleRadiuses, markerCircleOpacities

//	var markerIcon = {url: 'http://www.google.com/intl/en_us/mapfiles/ms/micons/man.png'};
	var markerIcon = {url: 'resources/orange-man.png'};
	locMarker = new google.maps.Marker({
		map: map, 
		position: initialMarkerPosition, 
		draggable: true, 
		icon: markerIcon
	});

	// Draw sequence of circles around marker
	circleOptions = { 
		map: map,
		clickable: false,
		center: initialMarkerPosition,
		strokeColor: '#000000',
		strokeWeight: 2,
		fillOpacity: 0
	};
	
	for (var i=0; i<markerCircleRadiuses.length; i++) {
		circleOptions.strokeOpacity = markerCircleOpacities[i];
		markerCircles.push(new google.maps.Circle(circleOptions));
	}
	
	scaleMarkerCircles()

	// Set up event listeners
	if (isMobile) {
		google.maps.event.addListener(locMarker, 'dragstart', function() {
			hideMarkerCircles();
		});
		google.maps.event.addListener(locMarker, 'dragend', function() {
			positionMarkerCircles();
			showMarkerCircles();
			updateDirectionStyles();
		});
	}
	
	if (!isMobile) {
		google.maps.event.addListener(locMarker, 'position_changed', function() {
			positionMarkerCircles();
			updateDirectionStyles();
		});
	}
		
	google.maps.event.addListener(locMarker, 'dragend', function() {
		updateDirectionStyles(true);
		updateLink();
	});
}

function showMarkerCircles() {
	// needs: markerCircles
	for (var i=0; i<markerCircles.length; i++) 
		markerCircles[i].setVisible(true);	
}

function hideMarkerCircles() {
	// needs: markerCircles
	for (var i=0; i<markerCircles.length; i++) 
		markerCircles[i].setVisible(false);	
}

function positionMarkerCircles() {
	// needs: markerCircles, locMarker
	for (var i=0; i<markerCircles.length; i++)
		markerCircles[i].setCenter(locMarker.getPosition());
}

function scaleMarkerCircles() {
	// needs: markerCircles, markerCircleRadiuses
	var scale = Math.pow(1.7, (15 - map.getZoom()));
	for (var i=0; i<markerCircles.length; i++)
		markerCircles[i].setRadius(markerCircleRadiuses[i] * scale);
}

function setUpSearchBox() {
	// needs: map, locMarker	
	var input = document.getElementById('search_box');
	var autocomplete = new google.maps.places.Autocomplete(input, {
		componentRestrictions: {country: 'us'},
	});
	autocomplete.setComponentRestrictions();
	autocomplete.bindTo('bounds', map);
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		var place = autocomplete.getPlace();
		if (! google.maps.geometry.poly.containsLocation(place.geometry.location, SF_BOUNDS)) {
			customAlert("Hill Mapper's coverage area is currently limited to the city of San Francisco.");
			return;
		}
		map.setCenter(place.geometry.location);
		map.setZoom(16);
		locMarker.setPosition(place.geometry.location);
	});
}

function loadJSON(json) {
	// needs: gradeLines
	// The slow part of loading is linking them to the map -- figure out how to fix

	var t = new Date().getTime();
	for (var i=0, l=json.features.length; i<l; i++) {
		var f = {};
		var path = google.maps.geometry.encoding.decodePath(json.features[i][0]);
		f.obj = new google.maps.Polyline({path: path});
		f.grade = json.features[i][1];
		var opacity = (1/30) * Math.min(f.grade, 30); // 30% grade = 1.0 opacity
		f.obj.setOptions({
			strokeOpacity: opacity,
			strokeWeight: 6,
		});
		var d = json.features[i][2];
		f.lowLatLng = path[d * (path.length-1)];
		f.highLatLng = path[(1-d) * (path.length-1)];
		f.onscreen = true; // default in case data loads more quickly than the map viewport
		gradeLines.push(f);
	}
	console.log('loadJSON: ' + (new Date().getTime() - t) + ' ms');
}

function updateGradeLineVisibility() {
	// needs: gradeLines[]
		
	// This runs at initialization and whenever the viewport bounds are changed

	if (! map.getBounds())
		return;
	
	var t = new Date().getTime();
	var b = map.getBounds();	
	for (var i=0, l=gradeLines.length; i<l; i++) {
		var s = gradeLines[i];
		s.onscreen = (b.contains(s.highLatLng) || b.contains(s.lowLatLng));
	}
	console.log('updateVisibility: ' + (new Date().getTime() - t) + ' ms');
}

function updateDirectionStyles(override) {
	// needs: gradeLines[], locMarker
	
	// This runs continuously whenever the marker is moved. It only updates the lines marked
	// as visible in the viewport unless 'override' is set to 'true'
		
	var t = new Date().getTime();
	var count = 0;
	var markerLatLng = locMarker.getPosition();
	var g = google.maps.geometry.spherical;
	
	for (var i=0, l=gradeLines.length; i<l; i++) {
		if ((! override) && (! gradeLines[i].onscreen))
			continue;
			
		var dHigh = g.computeDistanceBetween(markerLatLng, gradeLines[i].highLatLng);
		var dLow = g.computeDistanceBetween(markerLatLng, gradeLines[i].lowLatLng);
		var h = (dHigh > dLow);
		
		if (gradeLines[i].uphill != h) {
			count ++;
			gradeLines[i].uphill = h;
			color = h ? '#de2d26' : '#08519c'; // red, blue
			gradeLines[i].obj.setOptions({strokeColor: color});
		}
	}
	var s = override ? ' (full map)' : '';
	console.log('updateDirectionStyles: ' + (new Date().getTime() - t) + ' ms, ' + count + ' lines' + s);
}

function activateGradeLines(override) {
	// needs: map, gradeLines
	
	// This runs at initialization only. The majority of the initialization time goes to 
	// linking the gradeLines to the map. So if the viewport bounds have loaded already, we 
	// can speed things up by only linking the visible lines, and linking the others later.

	var t = new Date().getTime();
	var count = 0;

	for (var i=0, l=gradeLines.length; i<l; i++) {
		if ((! override) && (! gradeLines[i].onscreen))
			continue;
		count ++;
		gradeLines[i].obj.setMap(map);
	}
	var s = override ? ' (full map)' : '';
	console.log('activateGradeLines: ' + (new Date().getTime() - t) + ' ms, ' + count + ' lines' + s);	
}

function addGradeLineListeners() {
	var t = new Date().getTime();
	for (var i=0, l=gradeLines.length; i<l; i++) {
		// Because listeners are added inside a loop, we have to create the callbacks
		// using an outside function so that each has the correct closures.
		google.maps.event.addListener(gradeLines[i].obj, 'click', makeGradeLineCallback(gradeLines[i].grade));
	}
	console.log('addGradeLineListeners: ' + (new Date().getTime() - t) + ' ms');	
}

function makeGradeLineCallback(grade) {
	return function(e) {
		makeGradeLabel(grade, e.latLng);
	};
}

function makeGradeLabel(grade, latLng) {
	// needs: map, infoWindow
	if (infoWindow)
		infoWindow.close();
	var msg = '' + grade.toFixed(1) + '%&nbsp;grade';
	var style = {
		background: '#FFF', 
		width: '76px', 
		opacity: '0.8',
		padding: '2px',
		border: '1px solid #CCC',
		'font-family': 'Helvetica, sans-serif',
		'font-size': '12px',
		'text-align': 'center',
	};
	infoWindow = new InfoBox({
		content: msg, 
		position: latLng, 
		boxStyle: style, 
		closeBoxURL: '',
		enableEventPropagation: true,
		alignBottom: true,
		pixelOffset: new google.maps.Size(-38, 0),
	});
	infoWindow.open(map);
}

function retrieveLocMarker() {
	// needs: map, locMarker
	locMarker.setPosition(map.getCenter());
	positionMarkerCircles();
    updateDirectionStyles();
    updateDirectionStyles(true);
	updateLink();
}

function customAlert(s) {
	if (isMobile)
		alert(s)
	else {
		$('#alert-left').html(s);
		// calculate offset to center 'OK' button: 
		//    box height minus padding, minus button height, divided by 2, minus an adjustment
		var offset = ($('#alert').innerHeight() - 20 - $('#alert-ok').innerHeight()) / 2 - 2;
		$('#alert-right').css('padding-top', offset);
		$('#alert').center();
		$('#alert').show();
		$('#alert-ok').focus();
	}
}

function updateLink() {
	// needs: map, locMarker
	var z = map.getZoom();
	var t = map.getMapTypeId().toLowerCase();
	var m = locMarker.getPosition();
	var m_lat = m.lat().toFixed(5);
	var m_lng = m.lng().toFixed(5);
	var c = map.getCenter();
	var c_lat = (10000 * (m.lat() - c.lat())).toFixed();
	var c_lng = (10000 * (m.lng() - c.lng())).toFixed();
	var hash = '#' + z + '/' + t + '/' + m_lat + '/' + m_lng + '/' + c_lat + '/' + c_lng;

	// This sometimes leads Safari to throw exceptions, for reasons i can't determine... 
	window.location.hash = hash;
}

function tryGeolocation(initial) {
	// needs: map, locMarker
	//   and if initial=true: initialMapCenter, initialMarkerPosition, initialMapZoom
	if(navigator.geolocation)
    	navigator.geolocation.getCurrentPosition(geoSetMap, fail);
    else
    	fail();
    	
    function geoSetMap(pos) {
	    var latlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
		if (! google.maps.geometry.poly.containsLocation(latlng, SF_BOUNDS)) {
			var s = isMobile ? 
				"It looks like you're outside of Hill Mapper's coverage area — currently limited to the city of San Francisco — but you can still explore the map." :
				"It looks like you're outside of Hill Mapper's coverage area, which is currently limited to the city of San Francisco.";
		    customAlert(s)
			return;
		}
		setLocation(latlng);
    }
    
    function fail(e) {
    	var s = isMobile ?
    		"Unable to detect your location. You can still explore the map, or reload the page to try again." :
    		"Unable to detect your location.";
	    customAlert(s);
    }
}

function setLocation(latlng) {
	if (map) {
	    map.setCenter(latlng);
	    map.setZoom(16);
	    locMarker.setPosition(latlng);
	    positionMarkerCircles();
	    updateDirectionStyles();
	    updateDirectionStyles(true);
	}
	else {
		initialMapCenter = latlng;
		initialMapZoom = 16;
		initialMarkerPosition = latlng;
	}
}


// jQuery code for the HTML elements:

// from http://archive.plugins.jquery.com/project/autocenter
(function($){
    $.fn.extend({
        center: function () {
            return this.each(function() {
                var top = ($(window).height() - $(this).outerHeight()) / 2;
                var left = ($(window).width() - $(this).outerWidth()) / 2;
                $(this).css({position:'absolute', margin:0, top: (top > 0 ? top : 0)+'px', left: (left > 0 ? left : 0)+'px'});
            });
        }
    }); 
})(jQuery);


$(document).ready(function(){

	$("#hide").click(function() {
		$(".descript").hide();
		$(".instructions").hide();
		$(this).hide();
		$("#show").show();
	});

	$("#show").click(function() {
		$(".descript").show();
		$(".instructions").show();
		$(this).hide();
		$("#hide").show();
	});
	
	$('#link_generator').mouseover(function() {
		$(this).attr('href', generateLink());
	});
	
	$('a.marker_retriever').click(function() {
		retrieveLocMarker();
	});
	
	$('a.location_detector').click(function() {
		tryGeolocation();
	});
	
	$('a.instruction_viewer').click(function() {
		$('#instructions_mobile').show();
	});
	
	$('div#instructions_mobile').click(function() {
		$('#instructions_mobile').hide();
	});
	
	$('#alert-ok').click(function() {
		$('#alert').hide();
	});
	
	$('#alert-ok').keydown(function(e) {
		if(e.keyCode == 13) // this is the 'enter' key
			$('#alert').hide();
	});
	
});

</script>

<!-- Google Analytics -->
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  ga('create', 'UA-42777617-1', 'hillmapper.com');
  ga('send', 'pageview');
</script>

</head>
<body onLoad="initialize()">

  <div id="header">
  <div id="header_left">HILL MAPPER SAN FRANCISCO</div>
  <div id="header_twitter">
<a href="https://twitter.com/share" class="twitter-share-button" data-url="http://hillmapper.com/"></a>
<a href="https://twitter.com/hillmapper" class="twitter-follow-button" data-show-count="false"></a>
  </div>
  <div id="header_facebook">
<div class="fb-like" data-href="http://hillmapper.com/" data-width="100" data-layout="button_count" data-show-faces="false" data-send="false"></div>
  </div>
  </div>
  
  <div id="map_canvas"></div>

  <div id="control_box">
  	<div class="descript">Colors show which streets go uphill or downhill when you approach them from the stick-figure location marker.</div>
  	<ol class="instructions">
  	<li>Red streets go uphill. Blue streets go downhill.</li>
  	<li>The darker the color, the steeper the hill. Unshaded streets are flat.</li>
  	<li>Try moving the location marker to redraw the terrain.</li>
  	</ol>
  	<hr class="instructions">

  	<div id="hide">
  		 <span class="star">&#9733;</span>
 		 <a>Hide instructions</a></div>
  	<div id="show">
  		 <span class="star">&#9733;</span>
  		 <a>Show instructions</a></div>
  	<div id="actions">
  		 <span class="star">&#9733;</span>
  		 <a class="marker_retriever">Retrieve marker from off screen</a></div>
  	<div id="search">Search for location: <br>
  		<input id="search_box" type="text"></div>
  	<div id="detect">
  		<a class="location_detector">Detect location</a><br></div>
  	<div id="footer">Made by <a href="http://samuelmaurer.info/" target="_blank">Sam Maurer</a>, 2013</div>

  </div>

  <div id="alert">
	  <div id="alert-left"></div>
	  <div id="alert-right"><input id="alert-ok" type="submit" value="OK"></div>
  </div>
  
  <div id="control_box_mobile">
  	<div class="action_mobile">
  		&bull; <a class="instruction_viewer">INSTRUCTIONS</a></div>
  	<div class="action_mobile">
  		&bull; <a class="marker_retriever">Retrieve marker</a></div>
  	<div class="action_mobile">
  		&bull; <a class="location_detector">Update location</a></div>
  </div>
  
  <div id="instructions_mobile">
    	<div>Colors show which streets go uphill or downhill when you approach them from the stick-figure location marker.</div>
  	<ol class="mobile">
  	<li>Red streets go uphill. Blue streets go downhill.</li>
  	<li>The darker the color, the steeper the hill. Unshaded streets are flat.</li>
  	<li>Try moving the marker or updating your location to redraw the terrain.</li>
  	</ol>
  </div>
  
</body>
</html>
