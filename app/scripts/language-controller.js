/*Language view controller */
angular.module('main').controller('LanguageController', function($scope, $rootScope, $translate){

    const mainCTR = $scope.$parent.$parent

    this.$onInit = function () {
        setDefaultSelectedLanguage(localStorage['proactiveLanguage']);
    }


    //Set the locally stored language as default value for the language dropdown menu
    function setDefaultSelectedLanguage(language) {
        var lang = $('#' + language + '').text();
        var flagObject = $('#' + language + '').find('img').attr('src');
        var flag = '<img alt="' + language + '"style="height:25px;padding-left: 0px;padding-right: 5px;padding-top: 4px;padding-bottom: 4px;" src="' + flagObject + '"/>';
        $('#selected').html(flag + lang);
    }

    //Set the selected language as language dropdown value
    $scope.selectedLanguage = function () {
        $('#language-dropdown').find('a').click(function () {
            var language = $(this).text();
            localStorage['selectedLanguage'] = language;
            var flagObject = $(this).find('img').attr('src');
            var flag = '<img alt="' + language + '" style="height:25px;padding-left: 0px;padding-right: 5px;padding-top: 4px;padding-bottom: 4px;" src="' + flagObject + '"/>';
            $('#selected').html(flag + language);
        });
    };



    $scope.reloadPortal = function () {
        location.reload()
    }
})