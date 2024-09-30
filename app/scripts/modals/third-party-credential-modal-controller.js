angular.module('workflow-variables', []).controller('ThirdPartyCredentialModalCtrl', function ($scope, $uibModalInstance, toaster, SweetAlert, UtilsFactory, credKey) {

    $scope.isVariableModelEditMode = !!credKey;

    $scope.thirdPartyCredentials = [];
    $scope.newForm = {
        key: '',
        value: ''
    }
    $scope.editForm = {
        key: '',
        value: ''
    }
    $scope.isTextAreaMode = false;
    $scope.isTextAreaEditMode = false;
    $scope.isEditMode = false;
    $scope.isReverseKeySort = false;

    function loadThirdPartyCredentials(isReload) {
        UtilsFactory.getThirdPartyCredentials()
            .then(function (response) {
                $scope.thirdPartyCredentials = angular.copy(response.data)
                if (isReload && credKey) {
                    $scope.isVariableModelEditMode = true;
                    return;
                }
                if (credKey && $scope.thirdPartyCredentials.includes(credKey)) {
                    $scope.enableEditMode(credKey)
                    $scope.isVariableModelEditMode = true;
                } else {
                    $scope.newForm.key = credKey;
                    $scope.isVariableModelEditMode = false;
                }
            })
            .catch(function (response) {
                console.error('Error while getting third party credentials: ', response);
                toaster.error((response.errorMessage ? response.errorMessage : 'Something went wrong!'), (response.httpErrorCode === 403 ? 'Permission denied!' : 'Cannot load third party credentials'));
            });
    }

    $scope.addNewCredential = function (key, value, isUpdateMode) {
        UtilsFactory.postThirdPartyCredentials(key, value)
            .then(function (response) {
                loadThirdPartyCredentials(true);
                toaster.success(isUpdateMode ? 'Credential ' + key + 'updated successfully!' : 'Credential ' + key + 'added successfully!');
                if (isUpdateMode) {
                    $scope.editForm = {
                        key: '',
                        value: ''
                    }
                } else {
                    $scope.newForm = {
                        key: '',
                        value: ''
                    }
                }
            })
            .catch(function (response) {
                console.error('Error while getting third party credentials: ', response);
                toaster.error((response.errorMessage ? response.errorMessage : 'Something went wrong!'), (response.httpErrorCode === 403 ? 'Permission denied!' : 'Cannot create a or update third party credential ' + key));
            })
            .finally(function () {
                var credentialValueTextArea = document.getElementById('add-credential-textarea');
                // Reset credentials value textarea to default size (1 liner)
                credentialValueTextArea.style.height = '';
                // Get the scope of the modal and set the value input back to hidden
                angular.element(credentialValueTextArea).scope().isTextAreaMode = false;
            });
    }

    $scope.editCredential = function (key, value) {
        $scope.addNewCredential(key, value, true);
        $scope.disableEditMode();
    }

    $scope.removeCredential = function (key) {
        SweetAlert.swal({
                title: UtilsFactory.translate('Are you sure?'),
                text: UtilsFactory.translate('You are about to remove credential ' + key),
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: UtilsFactory.translate('Remove'),
                cancelButtonText: UtilsFactory.translate('Cancel'),
                closeOnConfirm: true,
                closeOnCancel: true
            },
            function (isConfirm) {
                if (isConfirm) {
                    UtilsFactory.removeThirdPartyCredentials(key)
                        .then(function (response) {
                            loadThirdPartyCredentials();
                            toaster.success('Credential ' + key + ' removed successfully!');
                        })
                        .catch(function (response) {
                            console.error('Error while getting third party credentials: ', response);
                            toaster.error((response.errorMessage ? response.errorMessage : 'Something went wrong!'), (response.httpErrorCode === 403 ? 'Permission denied!' : 'Cannot remove third party credential ' + key));
                        });
                }
            });
    }

    $scope.enableEditMode = function (key) {
        $scope.isEditMode = true;
        $scope.editForm.key = key;
        $scope.editForm.value = '';
    }

    $scope.disableEditMode = function () {
        $scope.isEditMode = false;
        $scope.editForm.key = '';
        $scope.editForm.value = ''
    }

    loadThirdPartyCredentials();

    // use : refers to the click on the button close
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});