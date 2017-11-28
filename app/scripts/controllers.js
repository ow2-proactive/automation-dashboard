/**
 * INSPINIA - Responsive Admin Theme
 *
 */

/**
 * MainCtrl - controller
 */
function MainCtrl() {

    this.userName = localStorage['pa.login'];

}

angular
    .module('inspinia')
    .controller('MainCtrl', MainCtrl)
