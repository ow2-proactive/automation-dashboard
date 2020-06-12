function UtilsFactory($window) {
    var specialUIModel = ['pa:boolean', 'pa:list', 'pa:datetime', 'pa:hidden', 'pa:global_file', 'pa:user_file', 'pa:optional_global_file', 'pa:optional_user_file', 'pa:credential'];

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

    return {
        openJobInSchedulerPortal : openJobInSchedulerPortal,
        isSpecialUIModel: isSpecialUIModel,
        updateCursor : function(isWaiting){
            return updateCursor(isWaiting);
        }
    };
}

angular.module('main')
    .factory('UtilsFactory', UtilsFactory);
