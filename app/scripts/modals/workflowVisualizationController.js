/*** Controller for workflow visualization ***/
function WorkflowVisualizationController($scope, $timeout) {

    this.$onInit = function() {
        scaleVisu();
        $scope.$on('event:scaleVisu', function(){
            scaleVisu();
        });
        $scope.$on('event:centerVisu', function(){
            centerVisualization();
        });
    }

    /* Scales the workflows visualization to fit in the context (object-details-panel) */
    var scaleVisu = function() {
        //To re-scale visualization, we need to know how it is originally displayed (width & length of visu and context).
        // So we have to wait until it is displayed ($digest cycle is done) to re-scale it
        $timeout(function() {
            var visuElement = angular.element(document.querySelector('#object-details-panel #workflow-visualization'))[0];
            var visuContainerElement = angular.element(document.querySelector('#object-details-panel #workflow-visualization-view'))[0];

            //we check if visu is displayed to avoid errors but it should be
            if (visuElement && visuContainerElement) {
                var visuContainerWidth = visuContainerElement.offsetWidth;
                var visuContainerHeight = visuContainerElement.offsetHeight;

                //calculating the visualization original width & height to know the scale to apply to make it fit in the container
                var visuSize = getVisuSize('#object-details-panel #workflow-visualization-view');

                var scaleValue = Math.min(
                    visuContainerWidth / (visuSize.width),
                    visuContainerHeight / (visuSize.height)
                );
                if (scaleValue > 1){
                    scaleValue = 1;
                }

                var newHeightValue = scaleValue*visuSize.height+50;//we add 50 to have more space because the calculation isn't exact

                //transform scale moves the element so we need to place it back to its original place (newTop, newLeft)
                //and then we move it to the center with a translate
                var originalTop = parseInt($('#object-details-panel #workflow-visualization').css('top'), 10);
                var originalLeft = parseInt($('#object-details-panel #workflow-visualization').css('left'), 10);
                var newTop = originalTop*scaleValue;
                var newLeft = originalLeft*scaleValue;
                var translateX = visuContainerWidth*0.5-visuSize.width*scaleValue*0.5;
                //no need to translateY because we will adapt the container height

                //applying new style
                visuElement.style['transform']='scale('+scaleValue+') translate('+translateX+'px, 0px)';
                visuElement.style['transform-origin']='0 0';
                visuElement.style['top']=newTop+'px';
                visuElement.style['left']=newLeft+'px';
                visuContainerElement.style['height'] = newHeightValue+'px';
            }
            //If it's not, there is no scale but it's OK because it will add scroll bars
        });
    }

    function centerVisualization() {
        var visuElement = angular.element(document.querySelector('.workflow-visualization-modal #workflow-visualization'))[0];
        var visuContainerElement = angular.element(document.querySelector('.workflow-visualization-modal #workflow-visualization-view'))[0];

        if (visuElement && visuContainerElement) {
            var visuContainerWidth = visuContainerElement.offsetWidth;
            var visuContainerHeight = visuContainerElement.offsetHeight;
            var visuSize = getVisuSize('.workflow-visualization-modal #workflow-visualization-view');

            var translateX = Math.max(visuContainerWidth*0.5-visuSize.width*0.5, 0);
            var translateY = Math.max(visuContainerHeight*0.5-visuSize.height*0.5, 0);

            visuElement.style['transform']='translate('+translateX+'px,'+translateY+'px)';
        }
    }

    var getVisuSize = function(visuSelector){
        var visuSize = {'height':200, 'width':200};
        var maxTop = 0;
        var maxLeft = 0;
        var minTop = Infinity;
        var minLeft = Infinity;
        var maxTaskWidth = 0;
        var maxTaskHeight = 0;
        var additionalSpace = 50;//to have more space because the calculation isn't exact
        $(visuSelector).find('.task').each(function () {
            var taskTop = parseInt($(this).css('top'), 10);
            var taskLeft = parseInt($(this).css('left'), 10);
            if (taskLeft < minLeft) {
                minLeft = taskLeft;
            }
            if (taskLeft > maxLeft) {
                maxLeft = taskLeft;
            }
            if (taskTop < minTop) {
                minTop = taskTop;
            }
            if (taskTop > maxTop) {
                maxTop = taskTop;
            }
            var taskWidth = $(this).outerWidth();//doesn't work with Firefox quantum so element isn't centered
            var taskHeight = $(this).outerHeight();
            if (taskWidth > maxTaskWidth) {
                maxTaskWidth = taskWidth;
            }
            if (taskHeight > maxTaskHeight) {
                maxTaskHeight = taskHeight;
            }
        });
        maxTaskHeight += additionalSpace;
        maxTaskWidth += additionalSpace;
        if (minTop !== maxTop) {
            visuSize.height = maxTop - minTop + maxTaskHeight;
        } else {
            //tasks horizontally aligned or just 1 task
            visuSize.height = maxTaskHeight;
        }
        if (minLeft !== maxLeft) {
            visuSize.width = maxLeft - minLeft + maxTaskWidth;
        } else {
            //tasks vertically aligned or just 1 task
            visuSize.width = maxTaskWidth;
        }
        return visuSize;
    }
}

angular.module('workflow-variables')
    .controller('WorkflowVisualizationController', WorkflowVisualizationController);