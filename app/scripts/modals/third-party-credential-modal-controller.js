angular.module('workflow-variables', []).controller('ThirdPartyCredentialModalCtrl', function($scope, $http, $uibModalInstance, UtilsFactory, credKey, closeHandler) {
    $scope.credKey = credKey
    var schedulerRestUrl = JSON.parse(localStorage.schedulerRestUrl);

    $scope.refreshCredentials = function () {
        var url = schedulerRestUrl + 'credentials/';
        $http.get(url, {headers: {'sessionID': getSessionId()}})
            .success(function (response) {
                $scope.credentialKeys = response.sort();
                if ($scope.credKey) {
                    if ($scope.credentialKeys.includes($scope.credKey)) {
                        $('#add-third-party-credential-button').html(UtilsFactory.translate('Edit'));
                    } else {
                        $('#add-third-party-credential-button').html(UtilsFactory.translate('Add'));
                    }
                    $("#new-cred-key").prop('readonly', true);
                    $("#new-cred-key").prop('title', $scope.credKey);
                } else {
                    $("#new-cred-key").prop('readonly', false);
                    $("#new-cred-key").prop('title', UtilsFactory.translate('The credential key should not contain only white spaces.'));
                }
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
            .success($scope.cancel)
            .error(function (response) {
                console.error('Error while querying scheduling api on URL ' + url + ':', JSON.stringify(response));
            });
    }

    $scope.changeMultilineCredential = function() {
        if ($scope.showMultilineCred) {
            // switch to multi-lines credential
            // previous single-line credential value will be copied into multi-line cred
            $('#new-cred-value').hide();
            $('#new-cred-value-multiline').show();
            $scope.errorMessage = "";
        } else {
            // switch to single-line credential
            // if the user has entered multi-lines credential, it will be erased when switching to single-line credential mode
            if ($scope.credValue.includes('\n')) {
                $scope.credValue = "";
                $scope.errorMessage = "Switching to single-line credentials has deleted the multiline credential value, please re-enter your credential.";
            }
            $('#new-cred-value-multiline').hide();
            $('#new-cred-value').show();
        }
    }

    $scope.$watch('credValue', function() {
        if ($scope.credValue && $scope.errorMessage) {
            $scope.errorMessage = "";
        }
    });

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
        if (closeHandler) {
            closeHandler();
        }
    }

    $scope.refreshCredentials();
});