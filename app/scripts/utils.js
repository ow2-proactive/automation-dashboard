function UtilsFactory($window, $uibModal) {
    var specialUIModel = ['pa:boolean', 'pa:list', 'pa:datetime', 'pa:hidden', 'pa:global_file', 'pa:user_file', 'pa:global_folder', 'pa:user_folder', 'pa:credential'];

    function openJobInSchedulerPortal(jobId) {
        if (jobId) {
            var url = JSON.parse(localStorage.schedulerPortalUrl)+ '/?job=' + jobId;
            var win = $window.open(url, '/scheduler/');
            win.focus();
        }
    }

    function updateCursor(isWaiting) {
        var body = angular.element(document).find('body');
        if (isWaiting) {
            body.addClass('waiting');
        } else {
            body.removeClass('waiting');
        }
    }

    // check whether the variable needs a special UI (i.e., it's not simply showing its value with an inputbox)
    // For example, if the variable is the type 'pa:boolean', 'pa:list', or 'pa:datetime' etc, the function return true
    function isSpecialUIModel(variable) {
        return -1 !== specialUIModel.findIndex(function (targetModel) {
            return variable.model.toLowerCase().indexOf(targetModel) !== -1;
        });
    };

    // When the variable value is null or undefined, convert it to the empty string
    function parseEmptyVariablesValue(variables) {
        angular.forEach(variables, function(variable){
            if(variable.value == null) {
                variable.value = "";
            }
        });
        return variables;
    }

    // open a pop-up to manage (browse, upload, delete) the global or user data space files
    function openFileBrowser(variable, dataspace, selectFolder) {
         $uibModal.open({
             templateUrl: 'views/modals/dataspace-file-browser.html',
             controller: 'FileBrowserModalCtrl',
             windowClass: 'fadeIn file-browser-modal',
             size: 'lg',
             resolve: {
                 dataspace: function() {
                     return dataspace;
                 },
                 variable: function() {
                     return variable;
                 },
                 selectFolder: function() {
                     return selectFolder;
                 }
             }
         });
    }

    return {
        openJobInSchedulerPortal : openJobInSchedulerPortal,
        isSpecialUIModel: isSpecialUIModel,
        parseEmptyVariablesValue: parseEmptyVariablesValue,
        openFileBrowser: openFileBrowser,
        updateCursor : function(isWaiting){
            return updateCursor(isWaiting);
        }
    };
}

angular.module('main')
    .factory('UtilsFactory', UtilsFactory);
