angular.module('workflow-variables').controller('CatalogObjectsModalCtrl', function($scope, $rootScope, $http, $uibModalInstance, variable, variableModel, SweetAlert, UtilsFactory) {
    var restRequestHeader = { headers: {'sessionid': getSessionId() }};
    var matches = variableModel.match(/\((.*)\)/); //matches[1] contains the value between the parentheses
    if (matches && matches.length > 1) {
        var params = matches[1].split(',');
        var kindFilter = params[0];
        var filterContentType = params[1];
    }
    var kindFilterUrl = (kindFilter) ? 'kind=' + kindFilter : '';
    var contentFilterUrl = (filterContentType) ? 'contentType=' + filterContentType : '';
    var filterUrlParams = [kindFilterUrl, contentFilterUrl].join('&');

    $scope.updateBuckets = function() {
        $scope.clearData();
        var getBucketsUrl = JSON.parse(localStorage.appCatalogBucketsUrl);
        if (!$scope.showAllBuckets) {
            getBucketsUrl += '/?' + filterUrlParams;
        }
        $http.get(getBucketsUrl, restRequestHeader)
            .success(function (data){
                $scope.buckets = data;
                // to open the browser on the first bucket
                if ($scope.buckets && $scope.buckets.length > 0) {
                    $scope.internalSelectBucket(0);
                }
            })
            .error(function (xhr) {
                var errorMessage = "";
                if(xhr) {
                    errorMessage = ": "+ xhr
                }
                $scope.displayGenericTitleErrorMessage(['Failed to access the catalog', getBucketsUrl + errorMessage]);
            });
    }

    $scope.internalSelectBucket = function (selectedIndex) {
        $scope.clearData();
        $scope.selectedBucketIndex = selectedIndex;
        if (!$scope.buckets || selectedIndex >= $scope.buckets.length){
            return;
        }

        var bucketName = $scope.buckets[$scope.selectedBucketIndex].name;
        var getCatalogObjectsUrl = JSON.parse(localStorage.appCatalogBucketsUrl) + "/"+ bucketName + '/resources/?' + filterUrlParams;
        $http.get(getCatalogObjectsUrl, restRequestHeader)
            .success(function (data){
                $scope.catalogObjects = data;
                // auto select the first catalog object in the bucket
                if ($scope.catalogObjects && $scope.catalogObjects.length > 0) {
                    $scope.internalSelectObject(0);
                }
            })
            .error(function (xhr) {
                var errorMessage = "";
                if(xhr) {
                    errorMessage = ": "+ xhr
                }
                $scope.displayGenericTitleErrorMessage(['Failed to access the catalog', getCatalogObjectsUrl + errorMessage]);
            });
    }

    $scope.internalSelectObject = function (selectedIndex) {
        $scope.revisions = undefined;
        $scope.revision = undefined;
        $scope.selectedCatalogObjectIndex = selectedIndex;
        if (!$scope.buckets || $scope.selectedBucketIndex >= $scope.buckets.length || !$scope.buckets[$scope.selectedBucketIndex]){
            return;
        }
        if (!$scope.catalogObjects || selectedIndex >= $scope.catalogObjects.length || !$scope.catalogObjects[selectedIndex]) {
            return;
        }

        var bucketName = $scope.buckets[$scope.selectedBucketIndex].name;
        var objectName = $scope.catalogObjects[selectedIndex].name;
        var getRevisionsUrl = JSON.parse(localStorage.appCatalogBucketsUrl) + "/" + bucketName + '/resources/' + encodeURIComponent(objectName) + '/revisions';

        $http.get(getRevisionsUrl, restRequestHeader)
             .success(function (data){
                 $scope.revisions = data;
                 // insert the latest revision at the beginning of the list
                 var latestRevision = JSON.parse(JSON.stringify($scope.revisions[0]));//Copy of the fist revision: the latest one
                 latestRevision.links[1].href = 'buckets/' + latestRevision.bucket_name + '/resources/' + latestRevision.name;
                 latestRevision.isLatest = true;
                 $scope.revisions.unshift(latestRevision);
                 // auto select the latest revision
                 if ($scope.revisions) {
                    $scope.internalSelectRevision(0);
                 }
             })
            .error(function (xhr) {
                var errorMessage = "";
                if(xhr) {
                    errorMessage = ": "+ xhr
                }
                $scope.displayGenericTitleErrorMessage(['Failed to access the catalog', getRevisionsUrl + errorMessage]);
            });
    }

    $scope.internalSelectRevision = function (selectedIndex) {
        $scope.selectedRevisionIndex = selectedIndex;
        if (!$scope.revisions || !$scope.revisions[selectedIndex]){
            return;
        }
        $scope.revision = $scope.revisions[selectedIndex];
    }

    $scope.showAllChanged = function() {
        $scope.updateBuckets();
    }

    $scope.clearData = function() {
        $scope.catalogObjects = undefined;
        $scope.revisions = undefined;
        $scope.revision = undefined;
    }

    $scope.displayGenericTitleErrorMessage = function (message) {
       UtilsFactory.displayTranslatedErrorMessage('Oops!!!', message);
   }

    $scope.selectCatalogObjectVariable = function () {
        if (!$scope.revision) {
            UtilsFactory.displayTranslatedErrorMessage('Oops!!!', "Please select a catalog object first.");
            return;
        }
        // format: buckets/[bucketName]/resources/[catalogObjectName]</revisions/[revisionCommitTime]>
        var selectedObjectLink = $scope.revision.links[1].href;
        // format: [bucketName]/[catalogObjectName]</[revisionCommitTime]>
        var selectedObjectValue = selectedObjectLink.replace('buckets/', '').replace('resources/', '').replace('revisions/', '');
        // update the variable value to the selected catalog object
        variable.value = selectedObjectValue;

        $scope.cancel();
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    }

    $scope.updateBuckets();
});
