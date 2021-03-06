(function () {

	'use strict';

	var directives = angular.module('lavagna.directives');

	directives.directive('lvgUser', function ($filter, $q, $rootScope, UserCache) {

		var providerMap = {
			'demo': 'fa-laptop',
			'ldap': 'fa-book',
			'persona': 'fa-user',
			'oauth.google': 'fa-google',
			'oauth.bitbucket': 'fa-bitbucket',
			'oauth.github': 'fa-github',
			'oauth.twitter': 'fa-twitter'
		};

		var generateTooltipHTML = function (user) {
			var userDisplayText = $filter('formatUser')(user);
			var userProviderClass = providerMap[user.provider] || 'fa-laptop';
			return '<div class=\"lavagna-tooltip\">' +
				'<div class=\"provider\"><i class=\"fa ' + userProviderClass + '\"></i></div>' +
				'<div class=\"name\">' + userDisplayText + '</div>' +
				'<div class=\"user-info\"><ul>' +
				'<li><i class=\"fa fa-user\"></i>' + user.username + '</li>' +
				(user.email != null ? '<li><i class=\"fa fa-envelope\"></i><a href="mailto:' + user.email + '">' + user.email + '</a></li>' : '') +
				'</ul></div>' +
				'</div>';
		};

		var loadUser = function (userId, placeholder, providerPlaceholder, scope) {
			var deferred = $q.defer();
			UserCache.user(userId).then(function (user) {
				placeholder.text($filter('formatUser')(user));
				if (user.enabled) {
					placeholder.removeClass('user-disabled');
				} else {
					placeholder.addClass('user-disabled');
				}
				deferred.resolve(generateTooltipHTML(user));
				scope.user = user;
			});
			return deferred.promise;
		};

		return {
			restrict: 'A',
			transclude: true,
			scope: true,
			template: '<span data-bindonce="readOnly">'
				+ '<span data-bo-if="!readOnly">'
				+	'<a data-lvg-tooltip data-lvg-tooltip-html=\"{{tooltipHTML}}\" class=\"lvg-user-link-placeholder\" ui-sref="user.dashboard({provider: user.provider, username: user.username})"><span class=\"lvg-user-placeholder\"></span><span data-ng-transclude></span></a>'
				+ '</span><span data-bo-if="readOnly">'
				+	'<span class=\"lvg-user-placeholder\"></span><span data-ng-transclude></span>'
				+ '</span></span>',
			link: function ($scope, element, attrs) {
				$scope.readOnly = attrs.readOnly != undefined;

				var unregister = $scope.$watch(attrs.lvgUser, function (userId) {
					if (userId == undefined) {
						return;
					}
					var placeholder = element.find('.lvg-user-placeholder');
					var providerPlaceholder = element.find('.lvg-user-provider-placeholder');
					

					loadUser(userId, placeholder, providerPlaceholder, $scope).then(function (html) {
						$scope.tooltipHTML = html;
					});

					var unbind = $rootScope.$on('refreshUserCache-' + userId, function () {
						loadUser(userId, placeholder, providerPlaceholder, linkPlaceholder).then(function (html) {
							$scope.tooltipHTML = html;
						});
					});
					$scope.$on('$destroy', unbind);

					unregister();
				});
			}
		};
	});
})();
