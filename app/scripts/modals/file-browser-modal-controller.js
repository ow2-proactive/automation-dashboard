angular.module('workflow-variables').controller('FileBrowserModalCtrl', function($scope, $http, $uibModalInstance, $q, dataspace, variable) {
    var dataspaceRestUrl = JSON.parse(localStorage.restUrl) + "/data/" + dataspace + "/";
    var restRequestHeader = { headers: {'sessionid': getSessionId() }};
    var uploadRequest = undefined;
    var canceller = $q.defer();
    $scope.currentPath = "";
    $scope.locationDescription = dataspace.toUpperCase() + " DataSpace";

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
                    $scope.switchToUploadingState();
                }
            });
    }

    $scope.switchSelected = function(event) {
        var targetElementClass = event.target.classList;
        if (targetElementClass.contains('selected')) {
            // deselect
            targetElementClass.remove("selected");
        } else {
            // mark the previous selected item as non-selected, as only one item could be selected at once.
            var selectedElement=$("ul#files-ul > li.selected");
            if (selectedElement) {
                selectedElement.removeClass("selected");
            }
            // highlight currently selected item
            targetElementClass.add("selected");
            $("#file-browser-error-message").text("");
        }
    }

    $scope.selectFile = function() {
        var selectedElement=$("ul#files-ul > li.selected");
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
            $scope.switchToUploadingState();
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
                    $scope.switchToNothingUploadingState();
                    uploadRequest = undefined;
                })
                .error(function (xhr) {
                    var errorMessage = "";
                    if(xhr) {
                        errorMessage = ": "+ xhr.errorMessage;
                    }
                    alert("Failed to upload the file " + selectedFile.name + errorMessage);
                    $scope.switchToNothingUploadingState();
                    uploadRequest = undefined;
                });
        }
    }

    $scope.createFolder = function() {
        $("#files-ul").prepend('<li class="new-folder-li"> <i class="fa fa-folder-o"> </i> <input class="new-folder" value="untitled-folder"> </li>');
        $('.new-folder').focus();
        $('.new-folder').select();
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
        var selectedElement=$("ul#files-ul > li.selected");
        if (selectedElement.length == 0) {
            alert("No file chosen to be deleted.");
            return;
        }
        var selectedFilePath = selectedElement.attr('value');
        var confirmMessage;
        if(selectedElement.hasClass("file-browser-dir")) {
            confirmMessage = "Are you sure you want to permanently delete the folder " + selectedFilePath + " and all the files in it ?";
        } else {
            confirmMessage = "Are you sure you want to permanently delete the file " + selectedFilePath + " ?";
        }
        if (confirm(confirmMessage)) {
            var url = dataspaceRestUrl + encodeURIComponent(selectedFilePath);
            $http.delete(url, restRequestHeader)
                .success(function (){
                    $scope.refreshFiles();
                })
                .error(function (xhr, status, error) {
                    alert("Failed to delete the file " + selectedFilePath + ": "+ xhr.statusText);
                });
        }
    }

    $scope.switchToUploadingState = function() {
        $("#upload-file-btn").removeClass('fa-upload').addClass('fa-spinner fa-pulse');
        $("#upload-file-btn").attr("disabled", true);
    }

    $scope.switchToNothingUploadingState = function() {
        $("#upload-file-btn").removeClass('fa-spinner fa-pulse').addClass('fa-upload');
        $("#upload-file-btn").attr("disabled", false);
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
        if(uploadRequest) {
            canceller.resolve();
        }
    }
    // enable input inside the modal
    $(document).off('focusin.modal');
    $scope.refreshFiles();
});
