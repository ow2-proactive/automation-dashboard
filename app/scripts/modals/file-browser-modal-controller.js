angular.module('workflow-variables').controller('FileBrowserModalCtrl', function($scope, $http, $uibModalInstance, $q, dataspace, variable, SweetAlert) {
    var dataspaceRestUrl = JSON.parse(localStorage.restUrl) + "/data/" + dataspace + "/";
    var restRequestHeader = { headers: {'sessionid': getSessionId() }};
    var uploadRequest = undefined;
    var canceller = $q.defer();
    $scope.currentPath = "";
    $scope.locationDescription = dataspace.toUpperCase() + " DataSpace";
    $scope.isUploading = false;
    $scope.enterFilesSubdir = function (event) {
        $scope.currentPath = event.target.getAttribute('value');
        $scope.refreshFiles();
    }

    $scope.refreshFiles = function() {
        var pathname = $scope.currentPath;
        if(pathname.length == 0) {
            pathname = "%2E"; // root path "." need to be encoded as "%2E"
        }
        var url = dataspaceRestUrl + encodeURIComponent(pathname);
        $http.get(url + "?comp=list",
            restRequestHeader)
            .success(function (data){
                $scope.files = data.fileListing.sort();
                $scope.directories = data.directoryListing.sort();
                if(uploadRequest) {
                    $scope.isUploading = !$scope.isUploading;
                }
            });
    }

    $scope.switchSelected = function(event) {
        var targetElementClass = event.target.classList;
        if (targetElementClass.contains('active')) {
            // deselect
            targetElementClass.remove("active");
        } else {
            // mark the previous selected item as non-selected, as only one item could be selected at once.
            var selectedElement=$("#files-tbody  td.active");
            var selectedElementIcon;
            if (selectedElement) {
                selectedElementIcon = $("#files-tbody  td.active i");
                // Lighten the icon
                if(selectedElementIcon.hasClass("fa-file")){
                    selectedElementIcon.removeClass("fa-file");
                    selectedElementIcon.addClass("fa-file-o");
                } else {
                    selectedElementIcon.removeClass("fa-folder");
                    selectedElementIcon.addClass("fa-folder-o");
                }
                selectedElement.removeClass("active");
            }
            // highlight currently selected item
            targetElementClass.add("active");
            // Darken the icon
            selectedElementIcon = $("#files-tbody  td.active i");
            if(selectedElementIcon.hasClass("fa-file-o")){
                selectedElementIcon.removeClass("fa-file-o");
                selectedElementIcon.addClass("fa-file");
            } else {
                selectedElementIcon.removeClass("fa-folder-o");
                selectedElementIcon.addClass("fa-folder");
            }
            $("#file-browser-error-message").text("");
        }
    }

    $scope.selectFile = function() {
        var selectedElement=$("#files-container td.active");
        if (selectedElement.length == 0) {
            $("#file-browser-error-message").text("Cannot find any file selected: please select a regular file !");
            return;
        }
        var selectedFile = selectedElement.filter(".file-browser-file");
        if (selectedFile.length == 0) {
            $("#file-browser-error-message").text("Directory is disallowed as the variable value: please select a regular file !");
        } else {
            // update the variable value to the selected file path
            variable.value = selectedFile.attr('value');
            $scope.cancel();
        }
    }

    $scope.clickUpload = function() {
        $('#selected-upload-file').click();
    }

    $scope.fileSelected = function(files) {
        var selectedFile = files[0];
        if (selectedFile) {
            var pathname = $scope.currentPath + selectedFile.name;
            $scope.isUploading = !$scope.isUploading;
            uploadRequest = $http({
                    url: dataspaceRestUrl + encodeURIComponent(pathname),
                    method: "PUT",
                    data: selectedFile,
                    processData: false,
                    headers: { "sessionid": getSessionId() },
                    timeout: canceller.promise
                })
                .success(function (data){
                    $scope.refreshFiles();
                    $scope.isUploading = !$scope.isUploading;
                    uploadRequest = undefined;
                })
                .error(function (xhr) {
                    var errorMessage = "";
                    if(xhr) {
                        errorMessage = ": "+ xhr.errorMessage;
                    }
                    alert("Failed to upload the file " + selectedFile.name + errorMessage);
                    $scope.isUploading = !$scope.isUploading;
                    uploadRequest = undefined;
                });
        }
    }

    $scope.createFolder = function() {
        $("#files-tbody").prepend('<tr class="new-folder-li"><td> <i class="fa fa-folder-o"> </i> <input class="new-folder" value="untitled-folder"/> </td></tr>');
        $(".new-folder").keyup(function(event) {
            if ($(this).is(":focus") && event.key == "Enter") {
                var pathname = $scope.currentPath + $(this).val();
                $http({
                    url: dataspaceRestUrl + encodeURIComponent(pathname),
                    method: "POST",
                    data: $.param({mimetype: "application/folder"}),
                    headers: {
                        'sessionid': getSessionId(),
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                .success(function (data){
                    $(".new-folder-li").remove();
                    $scope.refreshFiles();
                })
                .error(function (xhr) {
                    var errorMessage = "";
                    if(xhr) {
                        errorMessage = ": "+ xhr.errorMessage;
                    }
                    alert("Failed to create the new folder " + pathname + errorMessage);
                });
            }
        });
    }

    $scope.deleteFile = function() {
        var selectedElement=$("#files-tbody  td.active");
        var selectedFilePath = selectedElement.attr('value');
        var confirmMessage;
        if(selectedElement.hasClass("file-browser-dir")) {
            confirmMessage = "Are you sure you want to permanently delete the folder " + selectedFilePath + " and all the files in it ?";
        } else {
            confirmMessage = "Are you sure you want to permanently delete the file " + selectedFilePath + " ?";
        }
        SweetAlert.swal({
            title: "Are you sure?",
            text: confirmMessage,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        }, function (isConfirm) {
            if (isConfirm) {
               var url = dataspaceRestUrl + encodeURIComponent(selectedFilePath);
               $http.delete(url, restRequestHeader)
                       .success(function (){
                           $scope.refreshFiles();
                           SweetAlert.swal("Deleted!", "Your " + selectedFilePath + " file has been deleted.", "success");
                       })
                       .error(function (xhr, status, error) {
                           SweetAlert.swal({
                               text: '"Failed to delete the file " + selectedFilePath + ": "+ xhr.statusText.',
                               type: 'error'
                           });
                       });
            }
        });
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
        if(uploadRequest) {
            canceller.resolve();
        }
    }

    $scope.refreshFiles();

});
