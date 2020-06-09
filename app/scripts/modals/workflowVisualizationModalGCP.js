angular.module('workflow-variables').controller('WorkflowVisualizationModalGCPCtrl', function ($scope, $uibModalInstance, workflow) {
    $scope.workflow = workflow;
    $scope.visualization = workflow.visualization;

    $scope.catalogObjectKind = function () {
        return $scope.workflow.kind.slice(0, $scope.workflow.kind.indexOf('/'));
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    }

    $scope.isWorkflow = function(){
        return $scope.workflow !== null && $scope.catalogObjectKind().toLowerCase().startsWith("workflow");
    }

    $scope.openStudio = function () {
        var url = JSON.parse(localStorage.studioUrl) + '/#workflowcatalog/' + workflow.bucket_name + '/workflow/' + workflow.name;
        var win = window.open(url);
        win.focus();
    }

    $scope.exportVisu = function () {

        // First render all SVGs in JsPlumb to canvases. workflow-visu is the ID of the workflow visualisation container
        var elements = $('.workflow-visu').find('svg').map(function () {
            var svg = $(this);
            var canvas = $('<canvas></canvas>').css({position: 'absolute', left: svg.css('left'), top: svg.css('top')});
            svg.replaceWith(canvas);

            // Get the raw SVG string and curate it
            var content = svg.wrap('<p></p>').parent().html();
            svg.unwrap();

            canvg(canvas[0], content);

            return {
                svg: svg,
                canvas: canvas
            };
        });

        var scrollHeight = $('#workflow-visualization-view').prop('scrollHeight');
        html2canvas($(".workflow-visu")[0], {
            allowTaint: true,
            useCORS: true,
            logging: false,
            scale: 2,
            height: scrollHeight,
            windowHeight: window.outerHeight + window.innerHeight
        }).then(function (canvas) {
            elements.each(function () {
                this.canvas.replaceWith(this.svg);
            });

            canvas.getContext('2d');
            canvas.toBlob(function (blob) {
                saveAs(blob, workflow.name + ".png");
            });

        });
    }
});
