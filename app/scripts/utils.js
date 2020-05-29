function UtilsFactory($window) {
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
    };

    return {
        openJobInSchedulerPortal : openJobInSchedulerPortal,
        updateCursor : function(isWaiting){
            return updateCursor(isWaiting);
        }
    };
}

angular.module('main')
    .factory('UtilsFactory', UtilsFactory);