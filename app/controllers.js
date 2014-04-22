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
			var params = it.params = 'where='+JSON.stringify(it.parseSearch)
			$http.get(config.parseRoot+'classes/opportunity?limit=10&'+params).success(function(data){
				$rootScope.data.opportunities = data.results;
				it.searchData=data;
			})
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



var OpportunityCtrl = app.controller('OpportunityCtrl', function($rootScope, $scope, $routeParams, $http, config, geoService, fileService){
	$scope.view = $routeParams.view;
	$scope.id = $routeParams.id;
	$rootScope.temp.opportunity = {};

	var tools = {
		url:function(){
			return 'views/opportunity/'+$routeParams.view+'.html';
		},
		opportunity:{
			setGeo:function(geo){
				$rootScope.temp.opportunity.geo = geoService.parsePoint(geo);
			},
			setPicture: function(details,src){
				if(!$rootScope.temp.opportunity)
					$rootScope.temp.opportunity = {};
				$rootScope.$apply(function(){
					$rootScope.temp.opportunity.picture = {
						temp: true,
						status: 'uploading',
						class: 'grayscale',
						name: 'Image Uploading...',
						src: src
					};
				})

				if($rootScope.user){
					console.log('Uploading picture')
					fileService.upload(details,src,function(data){
						console.log('Picture Uploaded')
						$rootScope.$apply(function(){
							$rootScope.temp.opportunity.picture = {
								name: data.name(),
								src: data.url()
							}
						})
					});
				}else{
					$rootScope.temp.opportunity.picture.name = "You must sign in before you can upload media.";
				}
			},
			save:function(){
				var opportunity = $rootScope.temp.opportunity;
				opportunity.ACL = {
						"*": {
							"read": true
						}
					}
				opportunity.ACL[$rootScope.user.objectId] = {
						"read": true,
						"write": true
					}
					console.log('Save: ',opportunity)
				$http.post(config.parseRoot+'classes/opportunity', opportunity).success(function(data){
					$rootScope.temp.opportunity = {};
					console.info('Opportunity Saved!')
				}).error(function(data){
					console.log('Error: ',data)
				});
			}
		}
	}
	$scope.tools = tools;

	it.OpportunityCtrl=$scope;
});