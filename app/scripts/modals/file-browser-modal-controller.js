angular.module('workflow-variables').controller('FileBrowserModalCtrl', function($scope, $http, $uibModalInstance, $q, dataspace, variable, selectFolder, SweetAlert, UtilsFactory) {
    var dataspaceRestUrl = JSON.parse(localStorage.restUrl) + "/data/" + dataspace + "/";
    var restRequestHeader = { headers: {'sessionid': getSessionId() }};
    $scope.currentPath = "";
    $scope.locationDescription = UtilsFactory.translate(dataspace.toUpperCase() + " DataSpace");
    $scope.title = UtilsFactory.translate(dataspace.toUpperCase() + " DataSpace File Browser");
    switch(dataspace.toUpperCase()){
        case "GLOBAL":
            $scope.spaceDescription=UtilsFactory.translate("Global DataSpace is a shared storage on the server host where anyone can read/write files.")
            break;
        case "USER":
            $scope.spaceDescription=UtilsFactory.translate("User DataSpace is a personal user data storage.")
            break;
        default:
            $scope.spaceDescription="";
    }
    $scope.variable = variable;
    $scope.selectFolder = selectFolder;
    $scope.showHiddenFiles = false;

    $scope.enterDir = function (event) {
        $scope.currentPath = event.target.getAttribute('value');
        $scope.refreshFiles();
    }

    $scope.showHiddenFilesChange = function () {
        $scope.refreshFiles();
    }

    $scope.enterFilesSubdir = function (event) {
        var clickedRow = $(event.target.parentElement)
        var clickedDir = clickedRow.children(".file-browser-dir");
        if( clickedDir ){
            previousPath = $scope.currentPath
            $scope.currentPath = clickedDir.attr('value');
            $scope.refreshFiles(previousPath);
        }
    }

    // refresh to show the files in the $scope.currentPath, in case of failed, change the value of $scope.currentPath back to previousPath
    $scope.refreshFiles = function(previousPath) {
        var pathname = $scope.currentPath;
        if(pathname.length == 0) {
            pathname = "%2E"; // root path "." need to be encoded as "%2E"
        }
        var url = dataspaceRestUrl + encodeURIComponent(pathname);
        $http.get(url + "?comp=list",
            restRequestHeader)
            .success(function (data){
                $scope.files = $scope.getFilesMetadata(data.fileListing.sort());
                $scope.directories = $scope.getFilesMetadata(data.directoryListing.sort());
            })
            .error(function (xhr) {
                var errorMessage = "";
                if(xhr) {
                    errorMessage = ": "+ xhr
                }
                displayGenericTitleErrorMessage(['Failed to access the path', pathname + errorMessage]);
                $scope.currentPath = previousPath ? previousPath : $scope.currentPath
            });
    }

    $scope.getFilesMetadata = function(fileNames) {
        var filesMetadata = [];
        fileNames.forEach(function(filename, index) {
            var filePath = $scope.currentPath + filename;
            $http({
                url: dataspaceRestUrl + encodeURIComponent(filePath),
                method: "HEAD",
                headers: { "sessionid": localStorage['pa.session'] },
                async: false
            })
            .success(function (data, status, headers, config){
                filesMetadata[index] = {
                    name: filename,
                    type: headers('x-proactive-ds-type'),
                    rights: headers('x-proactive-ds-permissions'),
                    modified: $scope.toDateInClientFormat(headers('Last-Modified'))
                };
                if(filesMetadata[index].type == 'FILE') {
                    filesMetadata[index].type = headers('Content-Type');
                    filesMetadata[index].size = $scope.toReadableFileSize(headers('Content-Length'));
                }
            });
        });
        return filesMetadata;
    }

    $scope.toReadableFileSize = function(size) {
        if (typeof bytes !== 'number') {
            size = parseInt(size);
        }
        var units = [' B', ' KB', ' MB', ' GB', ' TB']
        var unitIndex = 0;
        while(size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024 ;
            unitIndex++;
        }
        return size.toFixed(1) + units[unitIndex];
    },

    $scope.toDateInClientFormat = function(serverDate) {
        return new Date(serverDate).toLocaleString(undefined, { hour12: false });
    }

    $scope.switchSelected = function(event) {
        var targetRow = $(event.target.parentElement)
        function darkenIcon() {
            var selectedElementIcon = $("#files-tbody  tr.active i");
            if(selectedElementIcon.hasClass("fa-file-o")){
                selectedElementIcon.removeClass("fa-file-o");
                selectedElementIcon.addClass("fa-file");
            } else {
                selectedElementIcon.removeClass("fa-folder-o");
                selectedElementIcon.addClass("fa-folder");
            }
        }
        function lightenIcon() {
            var selectedElementIcon = $("#files-tbody  tr.active i");
            if(selectedElementIcon.hasClass("fa-file")){
                selectedElementIcon.removeClass("fa-file");
                selectedElementIcon.addClass("fa-file-o");
            } else {
                selectedElementIcon.removeClass("fa-folder");
                selectedElementIcon.addClass("fa-folder-o");
            }
        }
        if (targetRow.hasClass('active')) {
            // deselect
            lightenIcon();
            targetRow.removeClass("active");
        } else {
            // mark the previous selected item as non-selected, as only one item could be selected at once.
            var selectedElement=$("#files-tbody  tr.active");
            if (selectedElement && selectedElement.length != 0) {
                lightenIcon();
                selectedElement.removeClass("active");
            }
            // highlight currently selected item
            targetRow.addClass("active");
            darkenIcon();
            $("#file-browser-error-message").text("");
        }
    }

    $scope.selectFile = function() {
        var selectedElement=$("#files-container tr.active");
        if (selectedElement.length == 0) {
            if (selectFolder) {
                $("#file-browser-error-message").text("Cannot find any folder selected: please select a folder !");
            } else {
                $("#file-browser-error-message").text("Cannot find any file selected: please select a regular file !");
            }
            return;
        }
        var selectedFile;
        var selectErrorMessage = "";
        if (selectFolder) {
            selectedFile = selectedElement.children(".file-browser-dir");
            selectErrorMessage = "The regular file is disallowed to be the variable value: please select a directory !";
        } else {
            selectedFile = selectedElement.children(".file-browser-file");
            selectErrorMessage = "The directory is disallowed to be the variable value: please select a regular file !";
        }
        if (selectedFile.length == 0) {
            $("#file-browser-error-message").text(selectErrorMessage);
        } else {
            // update the variable value to the selected file path
            var selectedFilePath = selectedFile.attr('value');
            // remove the trailing '/' in the path.
            if(selectedFilePath.endsWith('/')) {
                selectedFilePath = selectedFilePath.slice(0, -1);
            }
            variable.value = selectedFilePath;
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
            if (selectedFile.name.includes(':')) {
                UtilsFactory.displayTranslatedErrorMessage('Oops!!!', ['Failed to upload the file ', selectedFile.name, ':', 'it should not contain colon.']);
                return;
            }
            var uploadURL = dataspaceRestUrl + encodeURIComponent(pathname);
            UtilsFactory.uploadDataspaceFile(uploadURL, selectedFile,
                function (data){
                    $scope.refreshFiles();
                }, function () {});
        }
    }

    $scope.createFolder = function() {
        $("#files-tbody").prepend('<tr class="new-folder-li"><td> <i class="fa fa-folder-o"> </i> <input class="new-folder" value="untitled-folder"/> </td></tr>');
        // workaround to focus the cursor at the end of the input
        var input = $(".new-folder");
        var value = input.val();
        input.focus().val("").blur().focus().val(value).select();

        // Create the new folder in server side
        $(".new-folder").keyup(function(event) {
            if ($(this).is(":focus") && event.key == "Enter") {
                var pathname = $scope.currentPath + $(this).val();
                if (pathname.includes(':')) {
                    displayGenericTitleErrorMessage(['Failed to create the new folder', pathname, ':', 'it should not contain colon.']);
                    return;
                }
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
                        errorMessage = ": "+ xhr;
                    }
                    displayGenericTitleErrorMessage('Failed to create the new folder', errorMessage);
                });
            }
        });
    }

    $scope.downloadFile = function() {
        var selectedElement=$("#files-tbody  tr.active").children().first();
        if (selectedElement.length == 0) {
            displayGenericTitleErrorMessage('No file chosen to be downloaded.');
            return;
        }
        var selectedFilePath = selectedElement.attr('value');
        var filename = selectedFilePath.match('([^\/]*)\/*$')[1];
        if (selectedElement.hasClass("file-browser-dir")) {
            var confirmMessage = UtilsFactory.translate(['You are about to download the folder', '"' + filename + '"', 'as a zip archive', '"' + filename + '.zip"', 'proceed?'])
            SweetAlert.swal({
                title: UtilsFactory.translate("Downloaded!"),
                text: confirmMessage,
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: UtilsFactory.translate("Yes, download it!"),
                cancelButtonText: UtilsFactory.translate("Cancel"),
                closeOnConfirm: false
            }, function (isConfirm) {
                console.log("confirm", isConfirm);
                if (isConfirm) {
                    $scope.downloadFileRequest(selectedFilePath, filename + ".zip", "zip");
                }
            });
        } else {
            $scope.downloadFileRequest(selectedFilePath, filename, "identity");
        }
    }

    $scope.downloadFileRequest = function(filePath, fileName, fileEncoding) {
        $http({
            url: JSON.parse(localStorage.restUrl) + "/common/tokens?numberTokens=1",
            method: "POST",
            headers: {
                'sessionid': getSessionId()
            }
        })
        .success(function (data){
            window.location.href = dataspaceRestUrl + encodeURIComponent(filePath) + "?encoding=" + fileEncoding + "&token=" + data[0];
        })
        .error(function (xhr) {
            var errorMessage = "";
            if(xhr) {
                errorMessage = ": "+ xhr;
            }
            displayGenericTitleErrorMessage('Failed to be authenticated for downloading the file ' + fileName, errorMessage);
        });
    }

    $scope.deleteFile = function() {
        var selectedElement=$("#files-tbody  tr.active").children().first();
        var selectedFilePath = selectedElement.attr('value');
        var confirmMessage;
        var confirmButtonText;
        if(selectedElement.hasClass("file-browser-dir")) {
            confirmMessage = ["Are you sure you want to permanently delete the folder", selectedFilePath, "and all the files in it ?"];
            confirmButtonText = "Yes, delete folder!";
        } else {
            confirmMessage = ["Are you sure you want to permanently delete the file", selectedFilePath, "?"];
            confirmButtonText = "Yes, delete file!";
        }
        SweetAlert.swal({
            title: UtilsFactory.translate("Deleted!"),
            text: confirmMessage,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: confirmButtonText,
            closeOnConfirm: false
        }, function (isConfirm) {
            if (isConfirm) {
               var url = dataspaceRestUrl + encodeURIComponent(selectedFilePath);
               $http.delete(url, restRequestHeader)
                       .success(function (){
                           $scope.refreshFiles();
                           UtilsFactory.displayTranslatedSuccessMessage("Deleted!",["Your", selectedFilePath, "file has been deleted."])
                       })
                       .error(function (xhr) {
                           var errorMessage = "";
                           if(xhr) {
                               errorMessage = ": "+ xhr;
                           }
                           displayGenericTitleErrorMessage(['Failed to delete the file', selectedFilePath + errorMessage])
                       });
            }
        });
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    }

    function displayGenericTitleErrorMessage(message) {
        UtilsFactory.displayTranslatedErrorMessage('Oops!!!', message);
    }

    $scope.refreshFiles();
});
