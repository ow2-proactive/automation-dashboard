var loginModule = angular.module('loginModule', []);

loginModule.controller('loginController', function ($scope, $state) {

    function doLogin(userName, userPass) {
        var authData = $.param({'username': userName, 'password': userPass});
        var authConfig = {
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformResponse: []
        };
        // because of that wrong response type in that sched resource !!!
        return $http.post(JSON.parse(localStorage['schedulerRestUrl']) + 'login', authData, authConfig)
            .success(function (response) {
                if (response.match(/^[A-Za-z0-9]+$/)) {
                    localStorage['pa.session'] = response;
                    console.log("loginController.doLogin authentification succeed " + response);
                }
                else {
                    console.log("loginController.doLogin authentification failed " + response);
                }
            })
            .error(function (response) {
                console.error('loginController.doLogin authentification error', status, response);
            });
    }

    $scope.login = function () {
        var username = $scope.username;
        var password = $scope.password;

        localStorage['pa.login'] = username;
        $scope.loginController.userName = localStorage['pa.login'];

        doLogin(username, password)
            .success(function (response) {
                var sessionid = getSessionId();
                console.log("loginController pa.session " + sessionid);
                if (sessionid != undefined) {
                    console.log("loginController logged");
                    $state.go('portal.main'); // where to defined the homepage.
                }
            })
            .error(function (response) {
                console.log("loginController error doLogin");
            });
    };
});

loginModule.controller('logoutController', function ($rootScope, $scope, $state) {
    $scope.logout = function () {
        localStorage.removeItem('pa.session');
        // Stop all PCA refreshing services
        $rootScope.$broadcast('event:StopRefreshing');
        console.log("event:StopRefreshing emitted");

        $state.go('login');
    };
});
