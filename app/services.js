app.factory('config', function ($rootScope, $http) {
	if(!$rootScope.data)
		$rootScope.data = {};

	var config = {
		fireRoot: 			'https://shoeless-service.firebaseio.com/',
		fireRef: 			new Firebase('https://shoeless-service.firebaseio.com/'),
		parseRoot: 			'https://api.parse.com/1/',
		parseAppId: 		'zCeMqwAiXfro6zMhZU8fNasunDK8qrXo4wJvNpJb',
		parseJsKey: 		'T9ujIrSaWVlo0iEZ2lUKGz8ob7RYZ8KGfs4HSQQK',
		parseRestApiKey: 	'sPkm1Yy5lOFqAhto9qQnUFceTIPqJap7GCqSWWRl',
	};

	Parse.initialize(config.parseAppId, config.parseJsKey);
	 $http.defaults.headers.common['X-Parse-Application-Id'] = config.parseAppId;
	 $http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parseRestApiKey;
	 $http.defaults.headers.common['Content-Type'] = 'application/json';

	it.config = config;
	return config;
});

app.factory('geoService', function ($q) {
	var  geoService={
		helpModal:function(){
			$('#userGeoHelpModal').modal('show');
		},
		location:function(){
			var deferred = $q.defer();
			if(navigator.geolocation){
				navigator.geolocation.getCurrentPosition(function(geo){
					deferred.resolve(geo)
				})
			}else{
				deferred.resolve({status:'error',message:'Geolocation is not supported by this browser.'});
			}
			return deferred.promise;
		},
		distance:function(geo1,geo2){
			var from = new google.maps.LatLng(geo1.latitude,geo1.longitude);
			var to = new google.maps.LatLng(geo2.latitude,geo2.longitude);
			var dist = google.maps.geometry.spherical.computeDistanceBetween(from, to);
			var miles = dist*.00062137;
			return miles;
		},
		parsePoint:function(geo){
			if(geo.coords)
				return {
					__type:"GeoPoint",
					latitude:geo.coords.latitude,
					longitude:geo.coords.longitude
				}
			else
				return {
					__type:"GeoPoint",
					latitude:geo.latitude,
					longitude:geo.longitude
				}
		},
		parseSearch:function(geoShape){
			var where = {};
			if(geoShape.type=='circle'){
				where={
					"geo": {
						"$nearSphere": {
							"__type": "GeoPoint",
							"latitude": geoShape.latitude,
							"longitude": geoShape.longitude
						},
						"$maxDistanceInMiles": geoShape.radius
					}
				}
			}else if(geoShape.type=='rectangle'){
				where = {
					"geo": {
						"$within": {
							"$box": [{
								"__type": "GeoPoint",
								"latitude": geoShape.northEast.latitude,
								"longitude": geoShape.northEast.longitude
							},{
								"__type": "GeoPoint",
								"latitude": geoShape.southWest.latitude,
								"longitude": geoShape.southWest.longitude
							}]
						}
					}
				}
			}else if(geoShape.type=='marker'){
				where={
					"geo": {
						"$nearSphere": {
							"__type": "GeoPoint",
							"latitude": geoShape.latitude,
							"longitude": geoShape.longitude
						}
					}
				}
			}
			return where;
		}
	}
	it.geoService = geoService;
	return geoService;
});

app.factory('userService', function ($rootScope, $http, config, geoService) {
	 var userService = {
 		init:function(){
 			if(navigator.onLine){
 				userService.auth = new FirebaseSimpleLogin(config.fireRef, function(error, data) {
 					if (error) {
 						console.log(error);
 					} else if (data) {
						// console.log('FireAuth has been authenticated!')
						$('#userLoginModal').modal('hide');
						if(localStorage.user){
							var localUser = angular.fromJson(localStorage.user);
							$http.defaults.headers.common['X-Parse-Session-Token'] = localUser.sessionToken;
						}
						userService.initParse(data);
					} else {
						// console.log('not logged in.');
						$rootScope.$broadcast('authError');
					}
				});
 			}else{
 				alert('You are not online!')
 			}
 		},
 		initParse:function(){
 			$http.get(config.parseRoot+'users/me').success(function(data){
 				$rootScope.user = data;
 				if($rootScope.user.email=='apex2060@gmail.com' || $rootScope.user.email=='jac06022@gmail.com')
 					$rootScope.user.isAdmin=true;
 			}).error(function(){
				alert('You are not authenticated any more!');
			});
 		},
 		signupModal:function(){
 			geoService.location().then(function(geo){
				if(!$rootScope.temp.user)
					$rootScope.temp.user = {};
				$rootScope.temp.user.geo = geoService.parsePoint(geo);
			})
 			$('#userSignupModal').modal('show');
 		},
 		signup:function(user){
 			userService.signupParse(user);
 		},
 		signupParse:function(user){
 			user.username = user.email;
 			if(user.password!=user.password1){
 				notify('error','Your passwords do not match.');
 			}else{
 				delete user.password1;
 				$http.post('https://api.parse.com/1/users', user).success(function(data){
 					userService.signupFire(user);
 				}).error(function(error, data){
 					console.log('signupParse error: ',error,data);
 				});
 			}
 		},
 		signupFire:function(user){
 			userService.auth.createUser(user.email, user.password, function(error, data) {
 				if(error)
 					console.log('signupFire error: ',error,data)
 				else{
 					$('#userSignupModal').modal('hide');
 					userService.login(user);
 				}
 			});
 		},
 		loginModal:function(){
 			$('#userLoginModal').modal('show');
 		},
 		login:function(user){
 			userService.loginParse(user);
 		},
 		loginParse:function(user){
 			var login = {
 				username:user.email,
 				password:user.password
 			}
 			$http.get("https://api.parse.com/1/login", {params: login}).success(function(data){
 				$http.defaults.headers.common['X-Parse-Session-Token'] = data.sessionToken;
 				localStorage.user=angular.toJson(data);
 				$rootScope.user=data;
 				userService.loginFire(user);
 			}).error(function(data){
 				notify('error',data.error);
				// $('#loading').removeClass('active');
			});
 		},
 		loginFire:function(user){
 			userService.auth.login('password', {
 				email: user.email,
 				password: user.password
 			});
 		},
 		settingsModal:function(){
 			$('#userSettingsModal').modal('show');
 		}
 	}
	it.userService = userService;
	return userService;
});

app.factory('fileService', function ($http, config) {
	var fileService = {
		upload:function(details,b64,successCallback,errorCallback){
			var file = new Parse.File(details.name, { base64: b64});
			file.save().then(function(data) {
				if(successCallback)
					successCallback(data);
			}, function(error) {
				if(errorCallback)
					errorCallback(error)
			});
		}
	}

	it.fileService = fileService;
	return fileService;
});