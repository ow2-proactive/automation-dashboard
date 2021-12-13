angular.module('workflow-variables').controller('CatalogObjectsModalCtrl', function($scope, $rootScope, $http, $uibModalInstance, variable, variableModel, SweetAlert, UtilsFactory) {
    $scope.variable = variable;
    $scope.variableModel = variableModel;

    var restRequestHeader = { headers: {'sessionid': getSessionId() }};
    var matches = $scope.variableModel.match(/\((.*)\)/); //matches[1] contains the value between the parentheses
    if (matches && matches.length > 1) {
        var params = matches[1].split(',');
        var kindFilter = params[0];
        var filterContentType = params[1];
    }
    $scope.kindLabel = (kindFilter) ? kindFilter : 'Object'; //TODO
    var kindFilterUrl = (kindFilter) ? 'kind=' + kindFilter : '';
    var contentFilterUrl = (filterContentType) ? 'contentType=' + filterContentType : '';
    var filterUrlParams = [kindFilterUrl, contentFilterUrl].join('&');

    $scope.updateBuckets = function() {
        var getBucketsUrl = JSON.parse(localStorage.appCatalogBucketsUrl) + '/?' + filterUrlParams;
        console.log("getBucketsUrl: ", getBucketsUrl);

        $http.get(getBucketsUrl, restRequestHeader)
            .success(function (data){
                console.log("buckets data: ", data);
                $scope.buckets = data;
                // to open the browser on the first bucket
                if ($scope.buckets) {
                    $scope.internalSelectBucket(0, $scope.buckets[0].name);
                }
            })
            .error(function (xhr) {
                var errorMessage = "";
                if(xhr) {
                    errorMessage = ": "+ xhr
                }
                $scope.displayGenericTitleErrorMessage(['Failed to access the catalog', url + errorMessage]);
            });

//        console.log("selected bucket: ", $scope.buckets, $('#catalog-get-buckets-table tr')[0])
//        $scope.internalSelectBucket($('#catalog-get-buckets-table tr')[0]);
    }

    $scope.internalSelectBucket = function (selectedIndex, currentBucket) {
        console.log("internalSelectBucket", selectedIndex, currentBucket)
        if (!currentBucket){
            return;
        }
        $scope.selectedBucketIndex = selectedIndex;
//        $scope.highlightSelectedRow('#catalog-get-buckets-table', currentBucket);

        var getCatalogObjectsUrl = JSON.parse(localStorage.appCatalogBucketsUrl) + "/"+ currentBucket + '/resources/?' + filterUrlParams;
        $http.get(getCatalogObjectsUrl, restRequestHeader)
            .success(function (data){
                $scope.catalogObjects = data;
                console.log("catalogObjects, ", $scope.catalogObjects);
                if ($scope.catalogObjects) {
                    $scope.internalSelectObject(0, $scope.catalogObjects[0].name); //$('#catalog-get-objects-table tr')[0]
                }
            });
    }

    $scope.internalSelectObject = function (selectedIndex, currentCatalogObject) {
        console.log("internalSelectObject", selectedIndex, currentCatalogObject);
        $scope.selectedCatalogObjectIndex = selectedIndex;

        var bucketName = $scope.buckets[$scope.selectedBucketIndex].name;
//        this.highlightSelectedRow('#catalog-get-objects-table', currentObjectRow);

        var getRevisionsUrl = '/catalog/buckets/' + bucketName + '/resources/' + encodeURIComponent(currentCatalogObject) + '/revisions';
        $http.get(getRevisionsUrl, restRequestHeader)
             .success(function (data){
                 $scope.revisions = data;
                 console.log("revisions: ", $scope.revisions);

                 var latestRevision = JSON.parse(JSON.stringify($scope.revisions[0]));//Copy of the fist revision: the latest one
//                 latestRevision.links[1].href = 'buckets/' + latestRevision.bucket_name + '/resources/' + latestRevision.name;
                 latestRevision.href = 'buckets/' + latestRevision.bucket_name + '/resources/' + latestRevision.name;
                 latestRevision.isLatest = true;
                 $scope.revisions.unshift(latestRevision);
//                 var latestRevisionProjectName = latestRevision.project_name;
//                 var RevisionList = _.template(catalogRevision);
                 $scope.revision = latestRevision;
//                 $scope.internalSelectRevision($('#catalog-get-revisions-table tr')[0])
             });
    }

    $scope.internalSelectRevision = function (selectedIndex, currentRevision) {
            console.log("internalSelectRevision", selectedIndex, currentRevision);
            $scope.selectedRevisionIndex = selectedIndex;
            $scope.revision = $scope.revisions[selectedIndex];
    }

    $scope.displayGenericTitleErrorMessage = function (message) {
       UtilsFactory.displayTranslatedErrorMessage('Oops!!!', message);
   }

    $scope.getSelectedBucketName = function(){
        return $scope.getSelectedRowId("#catalog-get-buckets-table .catalog-selected-row", "bucketname");
    },

    $scope.getSelectedRowId = function(tableSelector, dataName){
        return ($(($(tableSelector))[0])).data(dataName);
    }

    $scope.selectCatalogObject = function () {
        $scope.cancel();
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    }

    $scope.updateBuckets();
});
