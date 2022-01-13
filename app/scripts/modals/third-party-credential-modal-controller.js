angular.module('workflow-variables', []).controller('ThirdPartyCredentialModalCtrl', function($scope, $http, $uibModalInstance) {
    var schedulerRestUrl = JSON.parse(localStorage.schedulerRestUrl);

    $scope.refreshCredentials = function () {
        var url = schedulerRestUrl + 'credentials/';
        $http.get(url, {headers: {'sessionID': getSessionId()}})
            .success(function (response) {
                $scope.credentialKeys = response.sort();
            })
            .error(function (response) {
                console.error('Error while querying scheduling api on URL ' + url + ':', JSON.stringify(response));
            });
    }

    $scope.removeThirdPartyCredential = function (credKey) {
        var url = schedulerRestUrl + 'credentials/' + encodeURIComponent(credKey);
        $http.delete(url, {headers: {'sessionID': getSessionId()}})
            .success($scope.refreshCredentials)
            .error(function (response) {
                console.error('Error while querying scheduling api on URL ' + url + ':', JSON.stringify(response));
            });
    }

    $scope.addThirdPartyCredential = function (credKey, credValue) {
        var url = schedulerRestUrl + 'credentials/' + encodeURIComponent(credKey);
        var data = 'value=' + encodeURIComponent(credValue);
        $http.post(url, data, {headers: {'sessionID': getSessionId(), 'Content-Type': 'application/x-www-form-urlencoded'}})
            .success($scope.refreshCredentials)
            .error(function (response) {
                console.error('Error while querying scheduling api on URL ' + url + ':', JSON.stringify(response));
            });
    }

    $scope.changeMultilineCredential = function() {
        if ($scope.showMultilineCred) {
            $('#new-cred-value').hide();
            $('#new-cred-value-multiline').show();
        } else {
            $('#new-cred-value').show();
            $('#new-cred-value-multiline').hide();
        }
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    }

    $scope.refreshCredentials();
});