var it = {};

var app = angular.module('ShoeLessService', ['firebase','pascalprecht.translate','ngAnimate','ngRoute','ui.calendar'])
.config(function($routeProvider,$translateProvider) {
	$routeProvider
	.when('/opportunity/:view', {
		templateUrl: 'views/opportunity.html',
		controller: 'OpportunityCtrl'
	})
	.when('/opportunity/:view/:id', {
		templateUrl: 'views/opportunity.html',
		controller: 'OpportunityCtrl'
	})
	.when('/:view', {
		templateUrl: 'views/main.html',
		controller: 'MainCtrl'
	})
	.when('/:view/:id', {
		templateUrl: 'views/main.html',
		controller: 'MainCtrl'
	})
	.otherwise({
		redirectTo: '/home'
	});

	$translateProvider.useStaticFilesLoader({
		prefix: 'languages/',
		suffix: '.json'
	});
	$translateProvider.uses('en');
});


angular.element(document).ready(function() {
	angular.bootstrap(document, ['ShoeLessService']);
});