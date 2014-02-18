var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $routeParams, $http, config, geoService, userService){
	if(!$rootScope.temp)
		$rootScope.temp={};
	var tools = {
		active:function(loc){
			if(window.location.hash.split('/')[1]==loc)
				return 'active';
		},
		url:function(){
			return 'views/'+$routeParams.view+'.html';
		},
		setup:function(){
			$("#siteTitle").fitText(1.1, { minFontSize: '22px', maxFontSize: '75px' });
		},
		picture:function(pictureDetails,src){
			console.log(pictureDetails)
			it.details = pictureDetails;
			it.src = src;
			$('#yourPic').attr('src',src);
		},
		search:function(geoShape){
			it.geoShape = geoShape;
			it.parseSearch=geoService.parseSearch(geoShape);
		},
		geo: geoService,
		user: userService
	}
	$scope.tools = tools;


	tools.setup();
	if(!$rootScope.user)
		$scope.tools.user.init();

	it.MainCtrl=$scope;
});



var OpportunityCtrl = app.controller('OpportunityCtrl', function($rootScope, $scope, $routeParams, $http, geoService){
	$scope.view = $routeParams.view;
	$scope.id = $routeParams.id;
	$rootScope.temp.opportunity = {};

	var tools = {
		url:function(){
			return 'views/opportunity/'+$routeParams.view+'.html';
		},
		add:{
			setGeo:function(geo){
				console.log('setGeo',geo)
				$rootScope.temp.opportunity.geo = geo;
			},
			browseFile:function(){
				$('#bannerPictureInput').click();
			},
			setPicture:function(details,src){
				var picture = details;
					picture.src = src;
				$rootScope.temp.opportunity.picture = picture;
			}
		}
	}
	$scope.tools = tools;

	it.OpportunityCtrl=$scope;
});