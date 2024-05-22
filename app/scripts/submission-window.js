angular.module('main').controller('SubmitViewController', function($scope, UtilsFactory){
    $scope.isNotClosable = true;
    $scope.tabs = [
       {
           title: UtilsFactory.translate('Select Workflow'),
           url: "/automation-dashboard/views/common/catalog-view.html",
       },
       {
           title: UtilsFactory.translate('Submit'),
           url: "/automation-dashboard/views/common/workflow-info.html"
       }
   ]

   $scope.variablesTemplateFooterButtonInfo = [
           {
               label: "Submit",
               title: UtilsFactory.translate('Submit'),
               className: "btn btn-primary m-r-xs text-white",
               hasSpinner: false
           },
           {
               label: "Check",
               title: UtilsFactory.translate('Check'),
               className: "btn btn-default m-r-xs"
           },
           {
               label: "Previous",
               title: UtilsFactory.translate('Previous'),
               className: "btn btn-default m-r-xs",
               hasSpinner: false
           },
           {
               label: "Close",
               title: UtilsFactory.translate('Close'),
               className: "btn btn-default m-r-xs",
               hasSpinner: false
           }
       ]
})