app.directive('myAdSense', function() {
  return {
    restrict: 'A',
    transclude: true,
    replace: true,
    template: '<div ng-transclude></div>',
    link: function ($scope, element, attrs) {}
  }
})
app.directive('contenteditable', function() {
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {

			elm.bind('blur', function() {
				scope.$apply(function() {
					ctrl.$setViewValue(elm.html());
				});
			});

			ctrl.$render = function() {
				elm.html(ctrl.$viewValue);
			};
		}
	};
});

app.directive('dropToUpload', function() {
	return {
		restrict: 'A',
		scope: {
			file: '=',
			fileName: '=',
			callback: '='
		},
		link: function(scope, element, attrs) {
			var processDragOverOrEnter, checkSize, isTypeValid;
			processDragOverOrEnter = function(event) {
				if (event != null) {
					event.preventDefault();
				}
				event.dataTransfer.effectAllowed = 'copy';
				return false;
			};
			checkSize = function(size) {
				var _ref;
				if (((_ref = attrs.maxFileSize) === (void 0) || _ref === '') || (size / 1024) / 1024 < attrs.maxFileSize) {
					return true;
				} else {
					alert("File must be smaller than " + attrs.maxFileSize + " MB");
					return false;
				}
			};
			isTypeValid = function(type) {
				var validMimeTypes = attrs.validMimeTypes;
				if ((validMimeTypes === (void 0) || validMimeTypes === '') || validMimeTypes.indexOf(type) > -1) {
					return true;
				} else {
					alert("Invalid file type.  File must be one of following types " + validMimeTypes);
					return false;
				}
			};
			element.bind('dragover', processDragOverOrEnter);
			element.bind('dragenter', processDragOverOrEnter);
			return element.bind('drop', function(event) {
				var file, name, reader, size, type;
				if (event != null) {
					event.preventDefault();
				}
				file = event.dataTransfer.files[0];
				name = file.name;
				type = file.type;
				size = file.size;
				reader = new FileReader();
				reader.onload = function(evt) {
					if (checkSize(size) && isTypeValid(type)) {
						return scope.$apply(function() {
							scope.callback(file,evt.target.result)
						});
					}
				};
				reader.readAsDataURL(file);
				return false;
			});
		}
	};
});

app.directive('mediaManager', function() {
	return {
		restrict: 'A',
		replace: true,
		transclude: true,
		template:	'<div>'+
				 		'<input type="file" class="hidden" accept="image/*" capture="camera">'+
						'<div ng-transclude></div>'+
					'</div>',
		scope: {
			callback: '=mediaManager',
		},
		link: function(scope, elem, attrs, ctrl) {
			it.elem = elem;
			processDragOverOrEnter = function(event) {
				if (event != null) {
					event.preventDefault();
				}
				event.originalEvent.dataTransfer.effectAllowed = 'copy';
				return false;
			};

			elem.bind('click', function(e){
				//At some point, this may end up being a call to open a modal which links to the media list
				$(elem).children('input')[0].click()
			});

			elem.bind('change', function(e) {
				var file, name, reader, size, type;
				if (e != null) {
					e.preventDefault();
				}
				file = e.target.files[0];
				name = file.name;
				type = file.type;
				size = file.size;
				reader = new FileReader();
				reader.onload = function(evt) {
					return scope.$apply(function() {
						scope.callback(file,evt.target.result)
					});
				};
				reader.readAsDataURL(file);
				return false;
			});
			elem.bind('dragover', processDragOverOrEnter);
			elem.bind('dragenter', processDragOverOrEnter);
			return elem.bind('drop', function(event) {
				var file, name, reader, size, type;
				if (event != null) {
					event.preventDefault();
				}
				it.event = event;
				file = event.originalEvent.dataTransfer.files[0];
				name = file.name;
				type = file.type;
				size = file.size;
				reader = new FileReader();
				reader.onload = function(evt) {
					return scope.$apply(function() {
						scope.callback(file,evt.target.result)
					});
				};
				reader.readAsDataURL(file);
				return false;
			});
		}
	};
});

app.directive('map', ['geoService', function(geoService){
	/*
		selectors: 		'MARKER|CIRCLE|RECTANGLE' (you can allow multiple by dividing them with the: | bar)
		color: 			a hex color if you wish to override the selection color
		zoom: 			map zoom level
		initmarker: 	allows you to add a point to the map when the map is created.
		advanced: 		by default, the return object is formated with latitude,longitude and(radius,northEast,southWest) enable advanced if you want the orig. shape returned by the map.
		callback: 		this callback will be called every time the user changes the marker or selection on the map.  It will return the new geo-object / map-shape.

		You can modify the default configuration in the code below.
	*/
	return {
		restrict: 'E',
		replace: true,
		scope: {
			callback: '='
		},
		link:function (scope, elem, attr){

			/*SETUP DEFAULT VARIABLES FOR DIRECTIVE*/
			scope.config = {
				selectors: new Array('MARKER','CIRCLE', 'RECTANGLE'),
				color: '#1E90FF',
				zoom: 15,
				initmarker: false,
				advanced:false
			}

			/*OVERRIDE DEFAULTS IF PROVIDED*/
			it.mapAttr = attr;
			if(attr.selectors)
				scope.config.selectors = attr.selectors.split('|');
			if(attr.color)
				scope.config.color = attr.color;
			if(attr.zoom)
				scope.config.zoom = Number(attr.zoom);
			if(attr.initmarker)
				scope.config.initmarker = attr.initmarker;
			if(attr.advanced)
				scope.config.advanced = attr.advanced;

			/*THESE CONSTANTS ARE REQUIRED*/
			scope.consts = {
				modes: [],
				currentShape:false
			};

			//Setup interaction
			$(scope.config.selectors).each(function(index, elem){
				scope.consts.modes.push(google.maps.drawing.OverlayType[elem]);
			});

			geoService.location().then(function(geo){
				scope.geo=geo;
				var mapOptions = {
					center: new google.maps.LatLng(geo.coords.latitude,geo.coords.longitude),
					zoom: scope.config.zoom
				};
				scope.map = new google.maps.Map(elem[0],mapOptions);

				var polyOptions = {
					strokeWeight: 0,
					fillOpacity: 0.45,
					editable: false
				};
				drawingManager = new google.maps.drawing.DrawingManager({
					drawingControlOptions: {
						position: google.maps.ControlPosition.TOP_CENTER,
						drawingModes: scope.consts.modes
					},
					drawingMode: scope.consts.modes[0],
					rectangleOptions: polyOptions,
					circleOptions: polyOptions,
					map: scope.map
				});

				google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
					scope.deleteOld();
					var newShape = e.overlay;
						newShape.type = e.type;
						scope.setCurrent(newShape);
						if(typeof(scope.callback)=='function'){
							if(scope.config.advanced)
								scope.callback(newShape);
							else
								scope.callback(scope.normalizeShape(newShape))
						}
				});

				if(scope.config.initmarker)
					scope.consts.currentShape = new google.maps.Marker({
						map:scope.map,
						animation: google.maps.Animation.DROP,
						position: mapOptions.center
					});

				var rectangleOptions = drawingManager.get('rectangleOptions');
				rectangleOptions.fillColor = scope.config.color;
				drawingManager.set('rectangleOptions', rectangleOptions);

				var circleOptions = drawingManager.get('circleOptions');
				circleOptions.fillColor = scope.config.color;
				drawingManager.set('circleOptions', circleOptions);
			})
			scope.setCurrent=function setCurrent(shape) {
				scope.consts.currentShape = shape;
			}
			scope.deleteOld=function deleteOld() {
				if (scope.consts.currentShape) {
					scope.consts.currentShape.setMap(null);
				}
			}
			scope.normalizeShape=function normalizeShape(geoShape){
				if(geoShape.type=='circle'){
					normalized={
						"type": "circle",
						"latitude": geoShape.getCenter().lat(),
						"longitude": geoShape.getCenter().lng(),
						"radius": Math.round(geoShape.getRadius()) / 1000
					}
				}else if(geoShape.type=='rectangle'){
					normalized = {
						"type": "rectangle",
						"northEast":{
							"latitude": geoShape.getBounds().getNorthEast().lat(),
							"longitude": geoShape.getBounds().getNorthEast().lng()
						},
						"southWest":{
							"latitude": geoShape.getBounds().getSouthWest().lat(),
							"longitude": geoShape.getBounds().getSouthWest().lng()
						}
					}
				}else if(geoShape.type=='marker'){
					normalized={
						"type": "marker",
						"latitude": geoShape.getPosition().lat(),
						"longitude": geoShape.getPosition().lng()
					}
				}
				return normalized;
			}
			it.mapScope = scope;
		}
	}
}]);