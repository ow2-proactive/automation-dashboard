function UtilsFactory($window) {
    function openJobInSchedulerPortal(jobId) {
        console.log('here')
        if (jobId) {
            var url = JSON.parse(localStorage.schedulerPortalUrl)+ '/?job=' + jobId;
            var win = $window.open(url, '/scheduler/');
            win.focus();
        }
    }

    return {
        openJobInSchedulerPortal : openJobInSchedulerPortal
    };
}

angular.module('main')
    .factory('UtilsFactory', UtilsFactory);