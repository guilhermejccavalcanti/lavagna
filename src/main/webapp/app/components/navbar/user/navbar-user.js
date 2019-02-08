(function() {
    var components = angular.module('lavagna.components');

    components.component('lvgNavbarUser', {
        templateUrl: 'app/components/navbar/user/navbar-user.html',
        bindings: {
            username: '=',
            provider: '=',
            isCurrentUser: '='
        },
        controller: function(User, $mdSidenav, $state, $window) {
             var ctrl = this;
             
             ctrl.$state = $state;

             User.currentCachedUser().then(function (u) {
                 ctrl.navbarUser = u;
             });

             ctrl.toggleSidebar = function() {
            	 $mdSidenav('left').toggle();
             }

             ctrl.login = function () {
                 var reqUrlWithoutContextPath = $window.location.pathname.substr($("base").attr('href').length - 1);
                 $window.location.href = 'login?reqUrl=' + encodeURIComponent(reqUrlWithoutContextPath);
             }
        }
    });
})();
