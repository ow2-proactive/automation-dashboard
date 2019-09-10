/****** Main controller ******/
function NodeGanttMainController($scope, $timeout, rmService) {
    this.$onInit = function () {
        $scope.nodes = {};
        updateNodes("a");
    }
    var nowDate = moment();
    $scope.ganttOptions = {
        fromDate: nowDate,
        toDate: moment().endOf('month'),
        currentDate: 'line',
        currentDateValue: nowDate,
        scale: 'second',
        allowSideResizing: true,
        headers: ['month', 'week', 'day', 'hour', 'minute', 'second'],
        corner: {
            headersLabels: function (key) {
                return key.charAt(0).toUpperCase() + key.slice(1)
            },
            headersLabelsTemplates: '<i>{{getLabel(header)}}</i>'
        },
        filterRow: '',
        dateFormat: 'YYYY-MM-DDTHH:mm:ss',
        maxHeight: 500
    };

    $scope.ganttHeaders = {
        '1 minute': ['month', 'week', 'day', 'hour', 'minute', 'second'],
        '5 minute': ['month', 'week', 'day', 'hour', 'minute'],
        '10 minute': ['month', 'week', 'day', 'hour', 'minute'],
        '30 minute': ['month', 'week', 'day', 'hour', 'minute'],
        '1 hour': ['month', 'week', 'day', 'hour', 'minute'],
        '2 hour': ['month', 'week', 'day', 'hour', 'minute'],
        '4 hour': ['month', 'week', 'day', 'hour'],
        '8 hours': ['month', 'week', 'day', 'hour'],
        'day': ['day','week', 'hour'],
        'week': ['month', 'week', 'day'],
        'month': ['month', 'week', 'day'],
        'year': ['year', 'month', 'day']
    };
    $scope.headersFormats = {
                 year: 'YYYY',
                quarter: '[Q]Q YYYY',
                month: 'MMMM YYYY',
                week: 'w',
                day: 'D',
                hour: 'H',
                minute:'mm',
                second:'ss',
                millisecond:'H:mm:ss:SSS'
    };

    var ganttScalesMap = {
        "1 minute": {"ganttScope": "second", range: 'a'},
        "5 minutes": {"ganttScope": "second", range: 'n'},
        "10 minutes": {"ganttScope": "minute", range: 'm'},
        "30 minutes": {"ganttScope": "minute", range: 't'},
        "1 hour": {"ganttScope": "minute", range: 'h'},
        "2 hours": {"ganttScope": "minute", range: 'j'},
        "4 hours": {"ganttScope": "minute", range: 'k'},
        "8 hours": {"ganttScope": "minute", range: 'H'},
        "day": {"ganttScope": "hour", range: 'd'},
        "week": {"ganttScope": "day", range: 'w'},
        "month": {"ganttScope": "day", range: 'M'},
        "year": {"ganttScope": "month", range: 'y'},
    };
    ganttScaleChanged("1 minute");
    $scope.ganttScaleLabels = Object.keys(ganttScalesMap);


    $scope.ganttScaleChanged = function (scale) {
        updateNodes(ganttScalesMap[scale].range)
        ganttScaleChanged(scale);
    }

    function ganttScaleChanged(scale) {
        $scope.selectedScale = scale;
        if (scale === '1 minute') {
            $scope.ganttOptions.fromDate = moment().subtract(1, 'minute');
            $scope.ganttOptions.toDate = moment();
        } else if (scale === '5 minutes') {
            $scope.ganttOptions.fromDate = moment().subtract(5, 'minute');
            $scope.ganttOptions.toDate = moment();
        } else if (scale === '10 minutes') {
            $scope.ganttOptions.fromDate = moment().subtract(10, 'minute');
            $scope.ganttOptions.toDate = moment();
        } else if (scale === '30 minutes') {
            $scope.ganttOptions.fromDate = moment().subtract(30, 'minute');
            $scope.ganttOptions.toDate = moment();
        } else if (scale === '1 hour') {
            $scope.ganttOptions.fromDate = moment().subtract(1, 'hour');
            $scope.ganttOptions.toDate = moment();
        } else if (scale === '2 hours') {
            $scope.ganttOptions.fromDate = moment().subtract(2, 'hour');
            $scope.ganttOptions.toDate = moment();
        } else if (scale === '4 hours') {
            $scope.ganttOptions.fromDate = moment().subtract(4, 'hour');
            $scope.ganttOptions.toDate = moment();
        } else if (scale === '8 hours') {
            $scope.ganttOptions.fromDate = moment().subtract(8, 'hour');
            $scope.ganttOptions.toDate = moment();
        } else if (scale === 'day') {
            $scope.ganttOptions.fromDate = moment().subtract(1, 'day');
            $scope.ganttOptions.toDate = moment();
        } else if (scale === 'week') {
            $scope.ganttOptions.fromDate = moment().subtract(7, 'day');
            $scope.ganttOptions.toDate = moment();
        } else if (scale === 'month') {
            $scope.ganttOptions.fromDate = moment().startOf('month');
            $scope.ganttOptions.toDate = moment();
        } else if (scale === 'year') {
            $scope.ganttOptions.fromDate = moment().startOf('year');
            $scope.ganttOptions.toDate = moment();
        }
        //update actual gantt scope: there is a difference between the scale that is displayed on buttons (label) and the value for angular-gantt: What angular-gantt calls "month" is actually year for common sense, day is month...
        $scope.ganttOptions.scale = ganttScalesMap[$scope.selectedScale].ganttScope;
        //update gantt headers
        $scope.ganttOptions.headers = $scope.ganttHeaders[$scope.selectedScale];
    }
    function updateNodes(range){
        rmService.getNodes().then(function (responserm) {
            console.log("responserm")
            console.log(responserm);
            console.log("result");
            var groubByNoderm= groupBy(responserm.data.nodesEvents, 'nodeSource');
            Object.keys(groubByNoderm).forEach(function (nodeRm) {
                //console.log(groupBy(groubByNoderm[nodeRm], 'defaultJMXUrl'))
                groubByNoderm[nodeRm] = groupBy(groubByNoderm[nodeRm], 'defaultJMXUrl');
            })
            console.log(groubByNoderm)
            //console.log(groupBy(groubByNoderm, 'nodeSource'));
            rmService.getStats("sigar:Type=Mem", range, "ActualFree", "service:jmx:rmi:///jndi/rmi://10.214.254.241:49734/rmnode")
                .then(function (response) {
                    $scope.nodes = angular.copy(response);
                    $scope.gantEventsData = updateData();
                })
                .catch(function (response) {
                    console.error("Error stats rm: ", response);
                });
        }).catch(function (responserm) {
            console.error("Error retrieving nodes: ", responserm);
        });
        rmService.getStats("sigar:Type=Mem", range, "ActualFree", "service:jmx:rmi:///jndi/rmi://10.214.254.241:52127/rmnode")
            .then(function (response) {
                $scope.nodes = angular.copy(response);
                $scope.gantEventsData = updateData();
            })
            .catch(function (response) {
                console.error("Error stats rm: ", response);
            });
    }
    function groupBy(collection, property) {
        var i = 0, val, index,
            values = [], result = {};
        for (; i < collection.length; i++) {
            val = collection[i][property];
            index = values.indexOf(val);
            if (index !== -1)
            //result[index][property].push(collection[i]);
            //console.log(result[index][collection[i][property]])
                result[collection[i][property]].push(collection[i])
            else {
                values.push(val);
                var n = []
                n = []
                n.push(collection[i])
                //result.push(n);
                result[collection[i][property]] = n
            }
        }
        return result;
    }
    function random_rgba() {
        var o = Math.round, r = Math.random, s = 255;
        return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + r().toFixed(1) + ')';
    }
    function updateData() {
        function objectTasks(job) {
            console.log(job);
            var resultTable = [];
            job.ActualFreeMem.forEach(function (job) {
                resultTable.push({
                    from: job.from.split('Z')[0],
                    to: job.to.split('Z')[0],
                    color: random_rgba()

                });
            });
            return resultTable;
        }
        console.log($scope.nodes)
        return Object.keys($scope.nodes.data).map(function (item) {
            return {
                name: item,
                tasks: objectTasks($scope.nodes.data[item])
            };
        });
    }
};


angular.module('job-analytics')
    .controller('NodeGanttMainController', NodeGanttMainController);