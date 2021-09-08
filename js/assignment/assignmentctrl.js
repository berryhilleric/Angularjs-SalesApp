﻿(function () {

    angular.module('SalesGoalsControllers').controller('AssignmentCtrl', AssignmentCtrl);

    AssignmentCtrl.$inject = ['$scope', '$location', '$http', '$rootScope', '$window', '$q', 'SalesGoalsApiService'];

    function AssignmentCtrl($scope, $location, $http, $rootScope, $window, $q, SalesGoalsApiService) {
        console.log('assignment ctrl start');
        Popper.Defaults.modifiers.computeStyle.gpuAcceleration = false;
        var vm = this;
        vm.territories = [];
        vm.salesStates = [];
        vm.unassignedStates = [];
        vm.currentTerritory = 0; //used as an index into the vm.territories array -- DOES NOT represent that seqnum of the current territory
        vm.currentTerritoryName = '';   //used to display the territory name duallist territory dropdown box
        vm.currentTerritoryColor = ''; //used to color the duallist territory dropdown box

        vm.SaveUpdates = function () {
            
            //var unassignedTerritory = {
            //    name: "unassigned",
            //    seqnum: 0,
            //    color: '#FFFFFF',
            //    salesperson: '',
            //    currentgoal: 0,
            //    salesStates: vm.unassignedStates
            //}  

            //var temp = vm.territories; //to avoid including the "unassigned" territory in the territories array, I created an temp array to pass to the api data -- allows me to update states that were previously assigned to unassigned
            //temp.push(unassignedTerritory);
            

            return SalesGoalsApiService.UpdateStates(vm.territories). then(function(){
                vm.AssignMapColors();
               
            },
            function () {
                //what should happen if if UpdateStates fails??
            });
        }

        vm.AssignMapColors = function () {
            var territoriesLength = vm.territories.length;
            for (var i = 0; i < territoriesLength; i++) {
                var salesStatesLength = vm.territories[i].salesStates.length;
                for (var j = 0; j < salesStatesLength; j++) {
                    var mapLength = window.JSMaps.maps.usaCanada.paths.length
                    for (var k = 0; k < mapLength; k++) {
                        if (window.JSMaps.maps.usaCanada.paths[k].abbreviation == vm.territories[i].salesStates[j]) {
                            window.JSMaps.maps.usaCanada.paths[k].color = vm.territories[i].color;
                        }
                    }
                }
            }
            $('#usaCanada-map').trigger('reDraw', window.JSMaps.maps.usaCanada);
            //$(function () {

            //    $('#usaCanada-map').JSMaps({
            //        map: 'usaCanada',
            //        displayAbbreviationOnDisabledStates: true,
            //        displayAbbreviations: true
            //    });

            //});
        }

        vm.MoveAllToTerritory = function () {
            var unassignedLength = vm.unassignedStates.length;

            for (var i = 0; i < unassignedLength; i++) {
                vm.territories[vm.currentTerritory].salesStates.push(vm.unassignedStates[i]);
            }
            vm.unassignedStates = [];
            vm.territories[vm.territories.length - 1].salesStates = vm.unassignedStates; //you can assume the unassigned territory is always last because it is pushed last in the api data call callback method
        }

        vm.MoveSelectedToTerritory = function () {
            var options = $('#unassigned-select')[0].options;
            var optionsLength = options.length;
            var newUnassignedStates = [];
            for (var i = 0; i < optionsLength; i++) {
                if (options[i].selected) {
                    vm.territories[vm.currentTerritory].salesStates.push(options[i].text);
                }
                else {
                    newUnassignedStates.push(options[i].text);
                }
            }

            vm.unassignedStates = newUnassignedStates;
            vm.territories[vm.territories.length - 1].salesStates = vm.unassignedStates; //you can assume the unassigned territory is always last because it is pushed last in the api data call callback method
        }

        vm.MoveSelectedToUnassigned = function(){
            var options = $('#assigned-select')[0].options;
            var optionsLength = options.length;
            var newAssignedStates = [];
            for (var i = 0; i < optionsLength; i++) {
                if (options[i].selected) {
                    vm.unassignedStates.push(options[i].text);
                    //vm.territories[vm.currentTerritory].salesStates.push(options[i].text);
                }
                else {
                    newAssignedStates.push(options[i].text);
                }
            }

            vm.territories[vm.currentTerritory].salesStates = newAssignedStates;
        }

        vm.MoveAllToUnassigned = function () {
            var assignedLength = vm.territories[vm.currentTerritory].salesStates.length;

            for (var i = 0; i < assignedLength; i++) {
                vm.unassignedStates.push(vm.territories[vm.currentTerritory].salesStates[i]);
            }
            vm.territories[vm.currentTerritory].salesStates = [];
        }

        vm.ChangePath = function (path) {
            $location.path(path);
        }

        

        

        var promise1 = SalesGoalsApiService.GetTerritories().then(function(response) {
            console.log("territories  success");
            //set the inital display name and color of the territory dropdown box
            vm.territories = response.data;
            vm.currentTerritoryName = vm.territories[0].name;
            vm.currentTerritoryColor = vm.territories[0].color;
        },
        function () { console.log("territories  fail"); });

      var promise2 = SalesGoalsApiService.GetTerritoryStates().then(function(response) {
        console.log("sales states  success");
        vm.salesStates = response.data;
      }, function(response) {
        console.log("sales states  fail");
      });

      //callback methods -- they're are scoped to this function
      

      

        //assign all of the states to the approriate territories
        $q.all([promise1, promise2]).then(function () {
            var numberOfTerritories = vm.territories.length;
            var numberOfSalesStates = vm.salesStates.length;
            
            for (var i = 0; i < numberOfTerritories; i++) {
                vm.territories[i].salesStates = [];
            }
            
            for (var i = 0; i < numberOfTerritories; i++) {
                for (var j = 0; j < numberOfSalesStates; j++) {
                    if(vm.salesStates[j].territory_id == vm.territories[i].seqnum)
                    {
                        vm.territories[i].salesStates.push(vm.salesStates[j].name);
                    }                    
                }
            }

            //create an "unassigned" territory with seqnum 0 and put all unassinged states/provinces in it
            for (var i = 0; i < numberOfSalesStates; i++) {
                if (vm.salesStates[i].territory_id == 0) {
                    vm.unassignedStates.push(vm.salesStates[i].name);
                }
            }
            
            var unassignedTerritory = {
                seqnum: 0,
                color: '#FFFFFF',
                salesperson: '',
                goal: 0,
                salesStates: vm.unassignedStates
            }

            vm.territories.push(unassignedTerritory);
            vm.AssignMapColors();
            
        });

        window.JSMaps.maps.usaCanada = {
            "config": {
                "mapWidth": 700.400,
                "mapHeight": 660.000,
                "displayAbbreviations": true,
                "abbreviationColor": '#f2f2f2',
                "abbreviationFontSize": 12,
                "autoPositionAbbreviations": true
                //"defaultText": "<h1>USA and Canada</h1><br /><p>Relations between Canada and the United States of America historically have been extensive, given a shared border and ever-increasing close cultural, economical ties and similarities. The shared historical and cultural heritage has resulted in one of the most stable and mutually beneficial international relationships in the world. For both countries, the level of trade with the other is at the top of the annual combined import-export total. </p>"
            },
            "paths": [
              {
                  "enable": true,
                  "name": "California",
                  "abbreviation": "CA",
                  "textX": -8,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>California</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M202.7,464.0 L233.0,473.0 L225.1,502.1 L236.2,518.5 L245.0,532.0 L257.9,551.2 L258.9,556.9 L260.5,559.1 L256.6,561.8 L256.4,564.0 L253.9,566.6 L253.4,569.9 L255.0,571.3 L252.4,573.6 L232.0,570.9 L231.7,564.9 L230.7,562.3 L226.3,556.7 L224.3,556.5 L223.9,553.3 L221.7,553.1 L218.8,550.8 L216.9,551.9 L210.0,550.0 L212.9,550.0 L216.9,551.8 L218.6,549.7 L216.2,547.3 L209.4,545.2 L208.3,543.5 L209.9,538.1 L206.2,531.6 L203.3,521.2 L205.5,519.4 L201.8,514.3 L202.6,508.4 L205.4,512.6 L203.7,505.2 L202.6,508.0 L200.4,505.1 L199.9,500.5 L196.9,494.7 L198.7,485.6 L196.2,480.3 L196.5,478.4 L200.5,473.4 L202.0,469.8 Z"
              },
              {
                  "enable": true,
                  "name": "Hawaii",
                  "abbreviation": "HI",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Hawaii</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M658.3,304.0 L658.6,303.0 L658.6,302.3 L659.0,301.5 L659.5,301.0 L660.3,300.6 L661.5,299.1 L662.3,298.7 L663.1,298.5 L663.4,297.4 L663.8,296.8 L664.4,296.1 L665.4,295.0 L665.1,294.4 L664.0,292.9 L663.6,291.9 L663.2,290.2 L663.1,289.2 L663.2,288.0 L663.4,287.2 L664.1,286.2 L664.7,285.8 L666.1,285.3 L666.8,285.3 L668.2,285.6 L668.7,286.0 L669.4,286.1 L670.2,286.6 L670.9,287.1 L671.4,287.7 L671.7,287.8 L672.3,288.3 L673.1,288.7 L673.9,289.3 L674.7,289.7 L675.2,289.6 L675.9,289.7 L676.9,290.1 L677.5,290.2 L679.0,290.7 L680.3,291.2 L681.1,291.8 L682.7,292.5 L683.3,292.8 L684.7,293.4 L685.9,294.2 L688.1,295.8 L688.7,296.3 L689.8,297.3 L690.3,298.0 L691.0,298.7 L691.5,299.4 L691.5,300.5 L691.4,301.1 L691.4,302.0 L692.6,302.2 L693.1,302.4 L693.9,303.2 L694.2,303.7 L694.7,304.8 L694.7,305.8 L695.2,306.2 L695.7,307.0 L696.3,307.7 L698.0,308.4 L699.3,309.4 L699.9,310.2 L700.0,310.7 L699.9,311.4 L699.4,312.7 L699.1,313.3 L698.4,314.1 L697.2,315.1 L696.0,315.9 L694.8,317.0 L694.4,317.4 L692.7,318.3 L691.1,318.9 L689.4,320.0 L687.0,320.8 L685.6,320.7 L684.7,320.4 L683.5,321.1 L682.8,321.9 L682.1,322.4 L680.6,322.9 L680.2,323.6 L679.5,324.1 L678.4,324.5 L677.5,325.3 L676.8,327.3 L676.2,327.9 L676.0,328.8 L675.3,329.7 L674.8,330.1 L673.8,331.1 L673.4,331.5 L672.4,331.9 L671.4,331.9 L670.5,331.4 L670.0,330.3 L668.7,329.8 L667.3,328.7 L666.6,328.6 L665.9,328.4 L664.7,327.7 L664.3,327.4 L663.8,326.5 L663.4,325.9 L662.8,324.4 L662.8,323.1 L663.1,321.2 L663.3,320.2 L663.3,319.3 L663.6,318.3 L663.7,316.6 L663.1,315.2 L662.6,313.3 L662.0,312.7 L661.6,311.6 L661.2,309.6 L660.8,308.5 L659.6,307.7 L659.3,306.9 L659.2,306.4 L658.3,304.6 Z"
              },
              {
                  "enable": true,
                  "name": "Oregon",
                  "abbreviation": "OR",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Oregon</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M233.0,473.0 L202.7,464.0 L202.1,460.4 L202.9,455.2 L208.9,446.1 L212.4,437.2 L215.8,430.5 L217.1,424.1 L222.5,426.0 L224.1,427.3 L223.9,432.0 L226.9,433.9 L230.5,433.3 L234.5,435.4 L241.3,436.2 L246.1,435.5 L250.3,435.8 L264.9,439.4 L266.8,444.2 L262.7,450.1 L259.1,453.8 L258.7,455.6 L260.6,457.2 L258.8,461.0 L254.7,478.5 Z"
              },
              {
                  "enable": true,
                  "name": "North Dakota",
                  "abbreviation": "ND",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>North Dakota</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M374.9,424.8 L401.7,425.7 L402.7,425.8 L403.5,429.3 L403.3,434.2 L405.1,441.1 L405.4,449.7 L406.7,453.0 L407.0,456.8 L398.8,456.7 L354.2,454.3 L354.4,452.4 L356.9,423.4 L373.7,424.7 L374.9,424.8 Z"
              },
              {
                  "enable": true,
                  "name": "Saskatchewan",
                  "abbreviation": "SK",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Saskatchewan</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M374.9,424.8 L367.8,424.3 L356.9,423.4 L317.2,418.6 L317.2,418.6 L317.2,418.5 L334.9,304.4 L375.6,309.0 L378.3,309.1 L378.3,309.2 L375.3,353.9 L374.9,424.8 Z"
              },
              {
                  "enable": true,
                  "name": "Montana",
                  "abbreviation": "MT",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Montana</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M317.2,418.6 L356.9,423.4 L354.4,452.4 L354.2,454.3 L353.4,463.8 L353.3,463.8 L303.5,457.5 L302.7,462.5 L301.3,459.8 L299.6,461.1 L294.4,460.3 L293.3,461.1 L288.8,460.4 L287.1,456.6 L284.4,446.8 L281.4,448.4 L280.1,447.2 L281.8,444.2 L282.1,440.4 L283.6,436.5 L282.1,436.5 L278.2,429.2 L276.0,427.0 L276.6,424.4 L275.0,420.9 L277.3,411.0 L290.2,413.8 L290.3,413.8 L290.3,413.8 L316.4,418.5 L316.4,418.5 L317.2,418.6 Z"
              },
              {
                  "enable": true,
                  "name": "Arizona",
                  "abbreviation": "AZ",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Arizona</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M257.9,551.2 L259.4,540.3 L264.0,541.7 L265.0,540.1 L266.6,532.4 L292.6,537.2 L306.2,539.3 L302.2,567.5 L298.0,595.9 L281.2,593.2 L251.1,575.5 L252.4,573.6 L255.0,571.3 L253.4,569.9 L253.9,566.6 L256.4,564.0 L256.6,561.8 L260.5,559.1 L258.9,556.9 Z"
              },
              {
                  "enable": true,
                  "name": "Nevada",
                  "abbreviation": "NV",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Nevada</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M266.6,532.4 L265.0,540.1 L264.0,541.7 L259.4,540.3 L257.9,551.2 L245.0,532.0 L236.2,518.5 L225.1,502.1 L233.0,473.0 L254.7,478.5 L269.7,481.8 L276.5,483.2 L270.9,510.9 Z"
              },
              {
                  "enable": true,
                  "name": "Alabama",
                  "abbreviation": "AL",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Alabama</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M486.2,609.0 L484.3,611.5 L477.7,610.7 L475.7,595.6 L476.5,565.2 L475.6,564.2 L475.6,564.1 L496.8,562.2 L502.6,582.2 L506.0,588.6 L504.4,593.4 L506.6,601.5 L484.2,603.9 Z"
              },
              {
                  "enable": true,
                  "name": "New Mexico",
                  "abbreviation": "NM",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>New Mexico</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M320.5,594.3 L305.8,592.3 L305.2,596.9 L298.0,595.9 L302.2,567.5 L306.2,539.3 L354.6,544.7 L354.3,548.4 L354.2,549.7 L353.9,549.8 L350.2,594.8 L319.4,591.8 Z"
              },
              {
                  "enable": true,
                  "name": "Colorado",
                  "abbreviation": "CO",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Colorado</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M354.6,544.7 L306.2,539.3 L311.1,505.8 L312.0,499.6 L349.7,504.0 L364.9,505.1 L364.3,515.2 L363.8,521.7 L362.4,545.2 Z"
              },
              {
                  "enable": true,
                  "name": "Wyoming",
                  "abbreviation": "WY",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Wyoming</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M349.7,504.0 L312.0,499.6 L296.9,497.2 L298.6,487.3 L299.9,479.5 L302.7,462.5 L303.5,457.5 L353.3,463.8 L351.8,480.1 L351.5,483.9 L351.2,487.7 Z"
              },
              {
                  "enable": true,
                  "name": "Wisconsin",
                  "abbreviation": "WI",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Wisconsin</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M438.1,447.9 L440.3,448.4 L445.9,445.7 L450.0,449.1 L452.2,451.5 L466.1,454.3 L469.0,456.8 L468.9,460.2 L471.0,462.5 L468.4,468.2 L472.3,464.6 L475.2,460.2 L473.3,465.6 L471.2,474.5 L471.6,476.6 L470.5,481.2 L471.9,488.9 L461.4,489.7 L450.9,490.3 L450.8,490.3 L447.7,488.1 L445.8,480.6 L445.3,476.4 L442.5,475.0 L439.1,471.5 L433.9,468.4 L434.7,461.4 L433.1,460.2 L434.3,456.7 L437.1,454.9 L436.9,449.0 Z"
              },
              {
                  "enable": true,
                  "name": "Kansas",
                  "abbreviation": "KS",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Kansas</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M364.3,515.2 L416.2,516.7 L419.6,518.5 L418.0,521.4 L421.8,525.4 L422.1,546.8 L362.4,545.2 L363.8,521.7 Z"
              },
              {
                  "enable": true,
                  "name": "Nebraska",
                  "abbreviation": "NE",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Nebraska</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M416.2,516.7 L364.3,515.2 L364.9,505.1 L349.7,504.0 L351.2,487.7 L351.5,483.9 L392.6,486.3 L395.6,488.4 L401.3,487.6 L407.4,491.4 L410.5,498.7 L410.3,501.1 L412.0,503.6 L412.8,510.5 L412.8,510.7 L412.8,510.7 L412.7,510.7 L412.7,510.7 L413.8,513.2 Z"
              },
              {
                  "enable": true,
                  "name": "Oklahoma",
                  "abbreviation": "OK",
                  "textX": 10,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Oklahoma</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M362.4,545.2 L422.1,546.8 L422.1,548.0 L422.2,551.8 L423.8,562.9 L423.7,580.4 L417.5,577.3 L411.5,578.1 L408.2,580.0 L403.3,577.4 L401.6,579.7 L396.9,577.0 L394.5,577.9 L393.5,575.4 L390.1,576.0 L384.3,574.2 L383.7,572.4 L380.3,572.4 L377.7,570.5 L378.5,551.1 L354.2,549.7 L354.3,548.4 L354.6,544.7 Z"
              },
              {
                  "enable": true,
                  "name": "Michigan",
                  "abbreviation": "MI",
                  "textX": 13,
                  "textY": 10,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Michigan</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M468.0,439.1 L463.4,442.7 L463.2,440.2 L465.7,438.8 Z M505.1,492.8 L498.9,493.9 L495.1,494.5 L495.0,493.9 L479.8,495.6 L482.7,490.2 L483.1,483.0 L480.1,476.6 L479.8,472.0 L481.3,468.9 L480.9,465.8 L484.9,460.3 L485.1,463.6 L486.7,462.7 L486.5,459.7 L489.3,457.8 L488.3,455.3 L490.3,453.4 L499.7,456.6 L501.5,459.3 L500.6,460.2 L502.2,463.0 L502.3,466.8 L500.9,469.7 L499.1,470.7 L499.2,473.8 L500.9,474.3 L503.6,470.1 L505.7,468.9 L507.7,470.2 L511.0,478.9 L510.8,482.7 L510.0,483.7 L508.6,483.0 L507.3,486.7 L507.2,487.1 Z M491.4,446.5 L494.0,445.5 L494.2,447.3 L493.3,448.8 L498.6,451.0 L490.8,450.7 L490.5,452.8 L488.2,451.3 L484.6,450.9 L483.9,452.2 L479.7,453.0 L476.7,456.2 L477.5,453.9 L474.8,455.9 L474.5,454.0 L471.0,462.5 L468.9,460.2 L469.0,456.8 L466.1,454.3 L452.2,451.5 L450.0,449.1 L454.2,446.4 L456.9,445.8 L461.9,441.6 L463.4,444.1 L469.2,445.2 L471.4,448.1 L476.8,448.1 L479.6,445.5 L484.0,445.1 L487.8,443.6 L487.4,446.2 Z"
              },
              {
                  "enable": true,
                  "name": "Alaska",
                  "abbreviation": "AK",
                  "textX": 30,
                  "textY": -30,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Alaska</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M3.2,212.9 L0.0,211.3 L7.1,209.9 L9.5,210.7 L8.8,212.7 L5.9,211.8 Z M39.0,217.6 L38.7,221.4 L36.5,221.6 L34.3,219.4 L31.7,219.7 L29.7,217.9 L30.3,216.2 L34.3,215.7 Z M56.6,228.9 L54.0,229.9 L52.7,228.9 L54.0,227.1 Z M203.1,309.2 L203.3,305.8 L204.4,309.7 L201.2,311.5 L198.9,305.6 L200.1,304.9 L202.5,307.1 Z M112.4,230.2 L114.1,232.8 L112.5,235.0 L107.3,233.4 L106.0,231.4 L108.7,230.7 L110.4,231.9 Z M147.3,230.7 L149.5,231.6 L144.7,233.4 L141.9,233.5 L146.4,231.8 Z M195.6,292.9 L195.8,289.7 L197.4,284.3 L200.5,285.6 L200.7,289.5 L198.3,294.2 L193.5,295.5 Z M206.8,313.4 L204.2,313.1 L201.4,316.4 L200.8,313.2 L202.1,313.2 L204.8,309.5 L203.1,304.4 L203.5,302.8 L201.5,297.1 L199.8,296.3 L201.9,294.6 L201.1,284.9 L198.9,283.4 L199.7,271.7 L198.1,274.9 L197.1,281.4 L192.9,279.1 L193.9,277.8 L194.2,273.8 L193.0,274.7 L190.6,270.0 L190.6,270.0 L192.9,269.8 L196.2,266.2 L201.5,266.2 L202.7,269.8 L201.7,270.8 L203.6,276.0 L205.9,284.7 L207.3,301.3 L206.2,302.8 L206.7,306.1 L207.9,306.5 L214.0,314.6 L213.8,316.7 L212.3,318.0 L211.5,322.9 L208.0,325.8 L204.4,325.5 L205.2,321.4 L206.8,320.4 L208.2,316.7 L207.5,313.5 L207.1,313.5 L207.7,316.7 L206.4,319.8 L204.4,321.2 L203.6,320.0 L202.4,324.0 L201.3,321.8 L202.3,318.5 L204.4,313.7 Z M196.8,300.4 L192.7,304.7 L191.5,307.3 L193.8,297.6 L196.1,298.1 L197.0,299.5 L197.7,296.4 L201.8,300.0 L200.7,303.3 L202.1,301.8 L202.8,304.3 L201.0,304.8 L199.4,300.2 L199.6,303.8 L196.2,303.0 Z M190.2,288.9 L188.7,288.8 L189.2,286.3 L188.2,282.6 L187.9,281.0 L192.9,280.3 L196.3,284.9 L194.5,290.4 L193.2,290.0 L190.8,285.4 L190.5,288.8 L191.9,288.4 L193.3,291.6 L192.2,298.2 L189.6,303.5 L188.7,295.4 L190.7,293.8 L189.5,291.1 L188.1,293.0 L188.4,289.5 Z M190.2,270.1 L190.4,269.7 L190.6,270.0 L190.6,270.0 L190.2,270.1 L190.2,270.1 Z M61.9,163.4 L68.6,166.9 L69.5,169.2 L67.2,172.6 L64.1,171.1 L62.5,169.2 Z M8.3,213.3 L12.5,215.1 L16.7,212.1 L21.6,215.4 L23.2,214.7 L24.1,216.8 L16.9,215.9 L18.0,217.4 L10.1,214.9 Z M199.8,318.2 L198.6,323.3 L197.1,323.7 L196.8,318.9 L194.5,318.7 L195.9,316.6 L194.3,315.9 L193.2,322.1 L192.8,317.3 L193.6,313.0 L191.3,315.1 L191.2,312.6 L193.0,312.5 L196.1,309.7 L196.9,307.0 L196.2,308.3 L192.4,307.7 L196.2,306.7 L196.0,304.2 L198.2,305.5 L197.7,308.5 L199.2,309.8 Z M93.6,243.0 L90.3,240.2 L93.5,241.5 L94.6,240.0 L98.4,238.0 L96.8,237.1 L94.8,238.7 L94.1,236.9 L95.9,232.4 L99.8,232.1 L100.6,233.2 L105.2,232.0 L107.8,234.4 L106.4,235.7 L109.6,235.4 L107.0,240.5 L104.6,237.7 L104.7,240.6 L102.6,238.8 L98.2,239.7 L94.4,241.2 Z M76.4,131.5 L75.5,126.5 L74.4,124.7 L72.4,124.3 L72.7,121.3 L75.3,119.7 L74.6,121.7 L75.8,123.2 L79.4,125.7 L78.4,128.1 L79.3,131.0 L81.8,134.4 L80.3,135.2 L78.8,133.3 L75.3,133.3 Z M190.2,270.1 L189.7,271.5 L191.6,272.9 L192.6,277.3 L191.7,279.0 L189.3,277.7 L188.2,278.6 L185.1,272.3 L184.2,266.5 L178.8,258.0 L181.5,257.3 L181.6,255.3 L177.3,255.3 L172.8,250.8 L174.3,249.9 L171.8,249.2 L167.6,244.9 L161.6,243.0 L158.7,237.5 L161.5,234.3 L159.4,235.0 L157.3,237.3 L156.5,234.1 L154.2,232.4 L150.6,233.1 L151.7,231.0 L156.0,232.0 L156.0,230.0 L153.9,229.4 L154.0,226.0 L151.7,224.3 L147.8,224.0 L148.7,220.6 L146.2,223.5 L145.8,226.9 L142.9,228.4 L143.9,230.5 L140.5,230.4 L137.3,227.6 L134.5,227.4 L126.4,229.3 L119.7,227.0 L120.4,225.2 L123.7,225.4 L127.8,224.2 L124.7,224.0 L123.8,221.4 L128.2,219.1 L131.2,216.5 L131.7,214.5 L137.9,214.6 L139.0,216.9 L141.4,217.4 L139.1,212.0 L132.8,211.6 L123.3,215.2 L120.8,217.6 L116.5,218.1 L116.9,216.3 L113.6,218.3 L111.1,217.6 L108.7,220.5 L111.1,221.7 L111.5,225.1 L105.7,225.5 L100.4,227.8 L98.3,226.3 L94.8,227.6 L94.3,226.3 L92.1,227.9 L91.0,226.7 L84.7,229.8 L83.9,228.5 L80.4,229.2 L78.3,228.3 L71.5,227.9 L72.5,229.5 L68.3,230.4 L63.1,228.8 L62.2,226.9 L55.7,226.7 L54.9,225.3 L52.2,225.2 L52.5,221.8 L47.5,224.3 L45.0,224.0 L46.0,220.4 L42.5,222.5 L42.5,220.2 L39.2,221.3 L41.2,219.0 L46.9,220.2 L47.2,219.3 L53.4,218.9 L59.7,222.9 L62.7,221.4 L67.5,221.3 L72.9,222.2 L73.7,224.0 L75.3,221.7 L78.9,220.6 L83.5,220.8 L90.3,214.0 L94.0,213.3 L95.0,211.9 L88.4,210.4 L88.1,207.3 L90.3,205.5 L86.3,206.4 L85.1,209.0 L83.2,208.8 L84.3,202.9 L81.9,202.9 L81.1,201.1 L82.2,198.8 L75.4,200.4 L75.0,198.4 L71.5,195.5 L74.2,196.3 L76.5,190.9 L79.5,190.3 L81.5,183.1 L83.0,180.6 L79.8,183.3 L74.0,180.9 L72.3,178.8 L73.5,177.4 L73.4,173.0 L72.4,168.2 L77.4,168.8 L79.9,171.8 L79.8,174.4 L81.8,173.9 L80.5,171.1 L76.4,166.4 L77.8,166.2 L77.7,163.2 L76.5,164.3 L76.9,159.7 L78.4,159.3 L77.4,157.1 L79.7,157.9 L79.5,155.7 L81.6,157.2 L83.3,154.7 L88.5,153.6 L89.6,154.3 L91.9,151.8 L95.2,150.5 L97.9,151.0 L99.0,152.6 L99.1,155.6 L106.5,156.3 L110.8,158.9 L114.0,158.2 L117.1,153.3 L116.8,150.2 L120.6,150.4 L121.5,146.7 L119.4,147.3 L116.5,145.7 L113.0,145.8 L110.4,144.8 L110.1,142.2 L107.1,139.3 L103.8,138.2 L100.8,133.1 L100.9,131.0 L102.6,129.9 L102.7,125.9 L104.0,127.5 L106.6,127.6 L103.2,122.4 L102.5,118.5 L104.5,117.9 L108.2,119.6 L110.8,119.0 L118.3,120.6 L122.5,122.0 L125.3,124.3 L121.6,127.2 L121.3,129.0 L126.5,133.7 L126.8,135.5 L130.1,134.0 L132.0,136.0 L131.4,132.9 L129.3,132.2 L130.8,131.2 L131.4,125.2 L132.9,125.6 L131.5,128.9 L131.5,132.2 L133.5,132.8 L133.7,135.4 L135.8,136.8 L136.9,135.8 L135.7,132.5 L132.5,131.9 L132.5,129.2 L135.3,126.3 L132.8,125.0 L129.4,120.2 L132.0,114.3 L131.4,106.5 L130.5,104.4 L130.4,100.5 L133.0,99.7 L135.7,97.1 L142.0,102.3 L145.9,102.7 L149.7,101.7 L151.7,99.2 L157.3,96.9 L157.5,97.9 L161.2,96.5 L161.0,97.8 L164.6,99.3 L172.0,98.2 L173.9,100.3 L177.3,102.1 L181.7,101.9 L184.8,100.7 L187.7,104.8 L184.6,105.8 L185.3,108.3 L188.5,106.5 L189.6,109.2 L188.2,110.7 L189.6,112.4 L193.3,113.0 L196.1,116.7 L192.8,118.3 L195.8,120.5 L194.2,121.0 L200.0,124.3 L199.3,125.0 L203.2,126.1 L206.7,130.8 L207.1,132.8 L209.0,135.1 L213.5,137.7 L214.4,140.8 L216.9,142.5 L219.4,142.5 L222.4,143.8 L224.3,146.4 L224.6,148.7 L226.1,150.0 L226.5,152.7 L228.0,153.5 L177.2,247.6 L181.2,251.4 L183.8,251.0 L186.4,252.2 L184.9,255.6 L188.3,266.6 L187.7,270.3 L190.2,270.1 L190.2,270.1 Z"
              },

              {
                  "enable": true,
                  "name": "Ohio",
                  "abbreviation": "OH",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Ohio</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M505.1,492.8 L512.7,495.1 L518.8,492.9 L520.9,490.5 L526.6,486.9 L528.9,500.2 L527.9,510.7 L525.6,513.4 L523.6,513.7 L521.2,519.5 L519.8,518.4 L518.5,524.2 L516.5,524.8 L516.5,524.8 L516.5,524.8 L516.5,524.8 L513.7,521.9 L510.7,523.8 L503.4,522.6 L501.1,520.0 L498.2,520.4 L495.7,498.5 L495.1,494.5 L498.9,493.9 Z"
              },
              {
                  "enable": true,
                  "name": "British Columbia",
                  "abbreviation": "BC",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>British Columbia</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M189.9,337.9 L188.1,336.2 L189.8,335.2 L187.6,333.0 L188.0,330.2 L190.2,326.5 L193.9,329.0 L194.0,331.2 L194.4,330.4 L197.6,330.1 L195.0,333.2 L193.1,337.2 L191.0,338.1 L193.3,338.5 L193.6,341.0 L192.1,344.3 L192.2,349.0 L193.7,351.6 L192.4,352.1 L189.1,339.9 L188.4,337.6 Z M194.0,331.2 L193.7,331.8 L193.7,331.8 L193.7,331.8 L191.0,332.4 L192.6,333.6 L193.7,331.8 L193.7,331.8 L193.7,331.8 L194.0,331.7 Z M211.8,357.7 L210.1,360.8 L209.7,362.0 L209.1,356.0 Z M201.2,339.2 L202.3,337.8 L204.9,341.5 L204.5,343.7 L201.8,338.6 Z M261.7,287.2 L281.6,293.1 L264.6,356.1 L264.8,361.0 L267.2,364.0 L270.1,365.6 L271.7,370.7 L271.5,374.0 L273.0,373.1 L274.7,377.3 L276.6,377.4 L277.8,382.4 L279.6,381.9 L284.0,393.0 L288.5,399.2 L288.3,405.1 L287.1,407.0 L290.3,413.8 L290.3,413.8 L290.2,413.8 L277.3,411.0 L270.8,409.5 L234.3,399.7 L233.7,399.5 L232.7,398.3 L231.9,399.0 L231.5,398.9 L231.5,393.6 L229.7,394.1 L227.3,390.7 L229.1,388.9 L224.1,387.8 L224.7,384.8 L222.5,385.0 L224.0,382.4 L222.0,379.1 L219.9,379.5 L214.2,376.5 L216.5,374.4 L216.5,372.7 L212.7,372.9 L210.2,370.0 L209.4,367.2 L210.5,362.8 L212.7,357.8 L212.2,354.1 L210.7,355.6 L213.4,350.0 L210.0,354.8 L211.7,347.1 L209.1,344.0 L210.0,340.9 L212.1,340.8 L214.6,338.2 L209.6,340.7 L208.1,342.8 L205.7,335.7 L205.0,331.4 L207.1,327.7 L206.2,327.4 L211.7,323.1 L212.1,319.7 L213.8,316.7 L214.0,314.6 L207.9,306.5 L206.7,306.1 L206.2,302.8 L207.3,301.3 L205.9,284.7 L203.6,276.0 L201.7,270.8 L202.7,269.8 L201.5,266.2 L196.2,266.2 L192.9,269.8 L190.6,270.0 L190.6,270.0 L190.6,270.0 L190.6,270.0 L190.2,270.1 L190.2,270.1 L190.2,270.1 L190.2,270.1 L187.7,270.3 L188.3,266.6 L184.9,255.6 L185.0,255.7 Z M207.1,349.8 L208.0,346.1 L208.7,343.9 L211.3,346.6 L209.6,353.9 L207.8,355.2 L209.7,348.8 L206.7,352.7 L206.0,347.9 Z M202.3,336.0 L203.6,330.2 L203.2,333.8 L204.9,334.0 L208.0,343.1 L206.8,343.2 L206.3,346.5 L205.2,340.7 Z M222.9,391.7 L227.4,395.4 L229.6,399.7 L228.5,403.1 L226.5,404.6 L220.1,399.7 L217.5,396.4 L220.3,395.0 L216.8,395.1 L212.4,389.6 L211.6,384.4 L209.9,384.9 L207.8,378.1 L206.2,376.7 L204.0,372.0 L204.0,370.3 L207.7,370.3 L209.5,373.1 L215.0,377.5 L222.7,381.1 L221.1,385.5 Z"
              },
              {
                  "enable": true,
                  "name": "Nunavut",
                  "abbreviation": "NU",
                  "textX": -35,
                  "textY": 70,
                  "color": "black",
                  "hoverColor": "grey",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Nunavut</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M563.2,241.7 L563.1,242.1 L565.6,242.8 L566.9,247.0 L565.5,246.6 L563.5,243.7 L563.1,244.8 L567.8,250.8 L564.3,251.1 L568.1,254.9 L570.3,254.3 L570.0,256.4 L568.2,256.5 L565.0,254.2 L565.3,253.2 L556.9,252.5 L549.8,248.1 L551.4,250.6 L545.0,248.1 L543.9,248.9 L549.3,253.1 L553.3,254.2 L561.1,258.6 L565.0,263.8 L563.6,264.7 L557.4,263.4 L551.0,264.2 L548.2,263.5 L544.6,261.4 L545.2,260.1 L541.0,261.3 L532.5,258.8 L531.9,256.1 L533.5,254.0 L531.7,252.8 L529.6,253.8 L527.7,251.0 L525.9,252.7 L523.9,249.6 L520.0,246.3 L516.9,244.8 L514.8,249.4 L508.9,248.0 L507.8,251.9 L502.3,253.7 L499.6,252.8 L497.3,250.0 L496.9,246.5 L500.3,243.0 L499.1,240.2 L502.8,240.0 L507.6,241.3 L507.9,241.5 L506.4,240.2 L510.0,240.2 L510.1,238.6 L512.6,238.6 L514.7,235.8 L517.6,236.0 L516.0,233.3 L511.1,229.4 L515.9,220.6 L516.0,217.4 L517.8,216.0 L514.6,208.6 L512.8,207.4 L511.6,203.9 L507.0,202.9 L507.4,199.8 L505.1,199.5 L506.9,201.2 L505.1,203.3 L502.6,198.3 L498.8,197.4 L498.7,199.1 L494.9,202.4 L494.0,198.5 L498.1,196.7 L497.3,194.5 L490.0,191.6 L490.9,189.4 L487.6,189.8 L486.7,185.5 L483.8,185.7 L480.2,182.4 L478.6,184.5 L481.1,184.9 L483.1,188.4 L482.5,190.0 L479.3,191.2 L478.1,189.7 L470.1,189.3 L472.7,190.4 L474.4,193.7 L471.1,191.0 L469.1,193.2 L465.0,191.5 L462.5,192.6 L453.5,191.8 L453.7,193.1 L450.3,190.6 L450.7,193.6 L448.3,193.8 L446.9,192.5 L450.1,192.0 L450.0,189.1 L448.2,190.1 L444.6,190.1 L441.1,188.5 L437.6,183.3 L437.0,181.0 L440.7,181.2 L442.1,182.3 L446.2,181.3 L442.8,179.1 L435.7,178.2 L434.9,176.6 L435.4,172.7 L434.1,170.9 L435.9,167.6 L434.4,166.5 L435.4,159.6 L436.5,160.0 L436.1,156.3 L436.9,153.5 L441.2,147.1 L444.8,145.0 L450.7,144.8 L451.5,146.7 L449.5,148.9 L448.1,151.8 L446.3,158.4 L446.5,160.5 L448.5,163.5 L448.0,166.0 L449.8,171.1 L452.7,174.3 L455.0,175.1 L455.6,176.9 L451.3,178.7 L455.8,178.4 L456.6,174.3 L455.5,171.8 L453.4,172.2 L451.8,169.4 L450.0,168.0 L451.9,167.1 L451.7,164.8 L453.4,164.8 L457.1,167.3 L451.2,162.4 L450.3,160.3 L450.4,155.8 L455.6,157.5 L451.7,155.2 L451.3,152.4 L453.0,150.0 L459.1,144.7 L463.9,144.3 L465.3,146.4 L466.3,150.1 L468.3,150.7 L468.8,153.8 L470.7,156.0 L470.5,160.6 L469.1,163.2 L471.6,164.7 L471.0,163.1 L472.8,158.6 L474.1,160.5 L476.7,160.9 L476.3,164.8 L478.4,165.1 L477.1,161.4 L477.9,159.6 L481.2,160.4 L477.9,158.7 L477.8,156.6 L480.6,153.9 L483.3,153.5 L484.4,154.6 L490.3,155.1 L491.9,157.9 L491.8,159.6 L495.1,159.5 L495.8,162.7 L493.0,164.8 L494.9,165.0 L498.5,162.7 L497.7,166.5 L501.0,167.3 L500.2,165.3 L501.5,164.6 L502.1,163.1 L507.0,163.7 L509.7,166.2 L509.0,168.9 L506.7,169.4 L506.6,171.0 L507.6,169.4 L509.6,170.8 L507.2,172.6 L506.6,171.7 L506.6,173.6 L510.1,171.0 L511.5,167.7 L513.1,169.5 L511.8,174.9 L512.5,180.1 L512.3,173.6 L515.7,169.5 L516.0,171.3 L514.4,173.3 L516.2,173.0 L517.3,170.4 L522.8,171.1 L523.1,173.8 L519.6,176.4 L517.7,180.9 L519.5,180.0 L519.2,178.0 L522.8,176.0 L523.3,176.6 L521.1,181.5 L525.2,176.3 L525.0,173.8 L529.7,177.1 L531.0,179.5 L528.2,179.7 L528.4,183.8 L529.8,181.5 L533.8,183.6 L534.9,185.2 L530.8,186.6 L528.1,185.8 L524.6,186.3 L528.8,186.9 L527.3,187.4 L531.0,188.3 L530.0,189.5 L531.8,191.3 L525.9,192.5 L531.0,192.8 L530.0,194.2 L536.8,194.2 L539.3,198.3 L540.3,194.9 L541.2,198.5 L542.2,197.3 L547.6,196.0 L546.5,198.1 L549.9,197.8 L553.5,199.8 L553.8,202.4 L550.4,204.6 L554.0,203.7 L554.9,201.3 L558.1,201.7 L557.9,206.0 L559.9,203.3 L563.0,206.0 L561.9,202.5 L564.0,202.6 L567.6,204.9 L568.2,208.5 L564.2,211.8 L567.6,213.1 L565.7,214.4 L566.8,217.8 L563.7,219.4 L562.3,221.9 L564.8,224.0 L565.2,227.8 L562.9,225.4 L561.0,226.9 L559.4,224.7 L559.7,227.5 L553.4,222.5 L552.5,219.1 L550.6,220.2 L549.5,218.6 L543.9,215.2 L541.6,215.9 L543.6,218.1 L539.7,217.5 L541.0,219.7 L544.5,221.2 L544.8,222.4 L541.5,223.8 L540.7,221.9 L537.8,221.3 L540.6,225.4 L542.7,226.6 L544.2,225.3 L545.0,227.5 L546.9,227.3 L548.7,231.1 L556.3,232.7 L556.7,234.7 L559.4,234.6 L558.2,237.2 L561.4,239.2 L563.6,239.6 L563.2,241.3 L564.4,240.2 L565.8,241.2 L567.9,245.8 L565.2,242.1 Z M507.9,241.5 L509.3,242.6 L509.3,242.6 L508.8,244.0 L510.5,246.3 L509.9,243.1 L509.3,242.6 L509.3,242.6 L509.3,242.4 Z M501.6,374.9 L503.5,374.9 L506.0,377.1 L507.0,379.6 L498.0,377.6 L498.8,375.8 Z M558.9,280.9 L560.6,281.8 L560.4,283.8 L558.1,284.9 Z M570.0,263.5 L572.0,264.0 L572.6,267.7 L568.4,266.0 Z M496.0,276.3 L497.4,280.4 L496.0,285.2 L493.4,283.6 L492.5,279.6 L494.0,276.3 Z M538.1,261.2 L541.9,263.0 L539.2,264.1 L535.9,261.2 Z M498.8,263.1 L502.5,263.0 L503.7,265.6 L502.0,267.1 L498.5,264.3 Z M504.6,259.9 L508.1,261.5 L506.1,262.6 L503.5,261.0 Z M462.2,239.3 L465.2,243.8 L464.7,244.8 L462.5,242.7 Z M469.8,241.1 L467.0,242.0 L466.9,240.4 L464.9,238.0 Z M506.6,207.2 L510.6,207.5 L511.2,209.7 L506.9,210.7 L504.6,207.8 Z M453.8,218.0 L453.1,220.6 L451.0,216.8 L452.0,213.8 L453.4,214.9 Z M502.6,202.3 L503.6,204.9 L500.5,203.1 L500.7,200.6 Z M393.0,208.1 L392.0,210.5 L390.8,209.5 L391.0,207.1 Z M485.4,204.6 L487.2,204.8 L485.7,208.3 L484.4,202.0 L482.4,201.9 L484.8,196.0 L485.8,197.6 L484.8,201.8 Z M491.2,194.1 L493.0,194.1 L491.0,197.6 L490.1,194.4 Z M412.3,200.2 L413.6,201.3 L412.2,203.7 L412.1,200.9 Z M486.8,191.8 L484.9,194.6 L483.5,194.6 L485.9,191.1 Z M478.3,196.9 L475.2,193.0 L479.4,191.5 L481.1,192.6 L478.8,194.3 Z M408.1,156.3 L408.8,157.1 L407.4,158.7 L406.7,156.8 Z M405.0,143.8 L403.1,146.3 L400.2,147.1 L398.4,145.7 L401.0,144.2 L404.7,143.1 Z M384.3,126.4 L384.8,128.0 L382.4,129.9 L380.1,128.3 L381.2,125.4 L383.2,124.3 Z M410.0,122.6 L411.3,123.9 L408.0,126.6 L407.4,124.7 Z M390.7,117.5 L388.3,120.3 L386.3,120.3 L387.4,118.2 Z M389.9,116.2 L389.8,116.9 L385.2,118.3 L384.3,117.4 Z M467.0,110.8 L466.9,112.9 L468.1,114.4 L465.3,114.9 Z M389.1,113.3 L388.3,115.9 L385.0,116.3 L383.2,115.5 L383.6,113.6 L388.9,112.7 Z M385.3,108.1 L387.9,110.5 L386.9,112.3 L383.5,112.1 L383.0,108.1 Z M431.4,109.9 L430.3,110.5 L428.5,107.4 L430.2,105.5 L431.2,106.7 Z M428.5,94.4 L430.5,96.7 L430.8,98.6 L429.6,100.4 L425.9,97.7 L425.9,94.7 Z M382.9,96.6 L384.6,98.3 L383.3,101.0 L381.1,98.0 L380.1,91.6 L381.9,92.1 L383.2,94.9 Z M395.9,92.8 L393.2,93.6 L391.2,92.7 L391.5,90.5 L393.8,90.6 Z M401.7,57.6 L402.6,57.3 L403.7,60.0 L403.3,64.4 L401.3,60.9 L399.9,61.2 L399.7,58.8 Z M378.3,309.2 L378.3,309.1 L381.4,262.3 L350.4,253.3 L346.9,252.0 L345.4,250.4 L341.0,243.1 L332.6,241.6 L302.5,204.9 L302.4,204.6 L307.4,186.7 L308.6,188.9 L314.7,192.8 L316.7,195.8 L324.8,200.4 L323.8,198.4 L325.5,198.1 L329.0,200.5 L330.8,202.8 L332.7,207.1 L331.8,208.7 L327.8,207.5 L326.4,208.4 L326.5,210.5 L324.5,211.0 L326.0,212.9 L337.5,216.7 L338.1,216.0 L343.8,216.8 L348.6,214.0 L349.6,218.3 L352.5,218.7 L353.0,223.1 L353.7,220.4 L356.6,224.5 L356.7,227.2 L355.3,229.3 L357.5,232.7 L357.0,227.7 L358.5,230.2 L358.8,222.1 L357.2,219.7 L356.8,224.1 L356.3,221.5 L358.3,215.0 L360.3,215.9 L363.3,215.5 L365.0,212.7 L368.2,212.3 L368.9,209.7 L364.9,210.6 L361.9,213.3 L360.2,212.1 L359.5,214.3 L356.4,214.0 L356.2,212.1 L354.5,212.3 L357.4,208.5 L361.8,208.1 L366.5,206.2 L368.7,206.9 L369.8,208.8 L369.1,212.5 L370.8,214.4 L373.0,210.9 L371.7,214.9 L373.3,217.4 L377.5,217.3 L382.7,221.9 L384.2,221.2 L386.1,222.6 L389.9,220.8 L395.6,221.7 L396.5,222.7 L400.4,221.7 L397.3,218.7 L399.6,218.4 L401.6,222.3 L403.9,223.1 L405.9,222.2 L403.4,219.2 L401.8,220.5 L400.4,219.4 L400.7,217.4 L399.0,215.0 L401.2,215.8 L403.3,215.1 L402.3,212.9 L405.4,213.9 L406.2,216.4 L408.8,217.0 L407.4,219.2 L411.4,216.0 L408.9,225.8 L410.7,226.2 L409.8,228.5 L412.2,226.9 L414.2,232.5 L414.7,227.9 L413.4,223.8 L412.3,223.0 L413.4,218.7 L416.0,219.2 L418.9,215.0 L422.3,211.9 L420.9,212.1 L421.5,209.1 L420.0,207.6 L419.2,210.4 L416.9,210.5 L417.0,207.9 L418.9,206.7 L418.5,203.5 L421.5,202.1 L421.3,201.0 L418.1,202.1 L416.8,199.2 L415.7,200.7 L410.1,197.1 L408.6,191.6 L410.2,187.8 L408.5,185.3 L409.4,181.8 L409.2,179.4 L411.0,177.9 L412.3,179.5 L413.1,177.1 L411.2,176.2 L414.0,171.2 L416.3,170.6 L414.3,171.0 L414.0,163.9 L412.1,159.9 L412.5,155.7 L412.0,149.5 L413.7,147.9 L413.7,144.6 L415.6,143.4 L419.4,142.4 L422.5,142.8 L424.5,144.6 L427.0,143.9 L432.1,145.4 L428.3,154.6 L426.7,159.4 L424.8,161.3 L420.8,160.3 L418.0,160.7 L420.7,164.5 L418.3,170.2 L416.7,170.5 L417.3,174.7 L418.0,173.1 L423.0,178.5 L423.6,180.9 L423.4,185.2 L425.7,187.0 L427.7,191.9 L428.6,190.6 L429.7,193.0 L426.7,192.9 L425.5,194.2 L427.9,194.8 L424.2,198.9 L426.8,199.2 L428.8,201.3 L429.9,197.0 L430.7,200.4 L433.7,200.4 L435.6,201.6 L433.9,202.4 L434.7,204.1 L431.3,203.5 L435.1,208.4 L434.7,213.6 L436.3,215.9 L438.4,210.9 L438.3,206.1 L439.5,203.5 L441.2,203.6 L445.6,208.4 L447.1,214.0 L444.5,214.9 L445.7,220.7 L450.2,226.7 L454.0,224.7 L453.5,221.1 L455.8,216.4 L455.9,208.3 L459.7,207.8 L458.0,206.8 L460.4,204.2 L456.6,202.5 L455.2,197.1 L455.8,194.7 L459.9,194.0 L462.9,195.5 L467.1,195.2 L470.1,199.5 L472.3,199.7 L474.2,201.4 L472.2,203.9 L475.0,205.1 L475.1,206.7 L472.2,209.7 L470.2,209.4 L471.2,212.9 L472.8,213.3 L472.9,216.0 L477.5,220.5 L477.0,226.1 L475.1,226.7 L472.8,231.9 L471.1,232.3 L470.2,234.8 L464.1,229.3 L461.9,228.9 L465.6,231.5 L468.4,236.9 L463.9,235.7 L465.3,237.3 L461.0,236.7 L460.0,233.6 L455.8,234.2 L453.8,235.9 L454.7,237.1 L458.5,238.5 L456.2,241.7 L456.1,243.7 L452.3,248.8 L449.6,249.0 L440.7,242.6 L439.1,243.3 L434.2,243.2 L439.6,244.4 L444.3,249.5 L454.0,249.7 L454.6,250.7 L452.0,257.7 L451.1,258.2 L450.5,262.0 L447.0,264.8 L444.1,263.1 L445.5,265.2 L442.8,263.9 L441.6,262.0 L441.7,265.3 L439.7,269.4 L438.1,268.8 L437.6,271.4 L435.2,269.3 L431.9,268.6 L434.2,271.1 L437.2,271.9 L438.2,275.6 L434.7,278.7 L430.7,278.1 L429.1,279.1 L431.6,280.5 L431.6,281.9 L427.9,282.8 L428.0,284.9 L426.1,286.1 L426.3,289.9 L421.6,294.1 L422.4,295.6 L419.8,300.8 L417.5,310.2 L415.1,310.2 Z M357.3,160.6 L358.0,160.8 L357.3,160.1 L357.4,159.8 L358.2,160.1 L357.6,158.5 L357.7,157.4 L358.6,157.3 L357.8,156.8 L358.3,153.9 L362.7,160.0 L362.2,162.6 L363.3,168.0 L362.7,169.8 L364.6,172.2 L366.8,169.0 L365.2,165.8 L365.0,161.0 L365.5,152.1 L366.4,150.2 L369.2,152.7 L370.5,151.3 L374.0,155.6 L375.4,158.6 L375.2,162.9 L375.8,167.4 L377.7,174.1 L377.9,177.1 L376.1,180.0 L378.4,184.8 L381.6,188.0 L382.8,188.1 L387.9,193.4 L390.2,192.9 L390.4,197.3 L388.6,199.9 L388.0,196.1 L386.9,199.0 L385.1,196.6 L383.2,197.6 L382.2,200.0 L379.6,197.7 L379.2,198.8 L381.8,201.8 L385.2,200.9 L384.6,202.4 L386.2,204.9 L385.0,208.8 L386.2,209.4 L385.3,211.9 L383.3,210.4 L385.1,207.1 L380.5,208.8 L378.6,208.8 L374.4,206.6 L373.7,207.5 L370.9,206.1 L372.5,205.1 L366.3,202.8 L367.0,200.2 L366.0,198.9 L362.1,204.2 L356.8,204.5 L354.7,206.7 L351.7,207.5 L344.0,206.9 L337.8,207.3 L335.5,205.3 L334.7,202.6 L335.4,197.9 L332.7,196.2 L329.3,196.0 L326.1,194.6 L323.8,192.1 L323.4,189.7 L323.3,185.2 L340.6,188.9 L340.3,190.9 L342.1,191.0 L342.2,189.2 L352.6,191.0 Z M364.3,115.5 L367.0,113.2 L364.9,111.2 L365.5,107.6 L368.8,103.3 L370.2,102.9 L370.8,105.5 L369.9,106.0 L371.3,111.2 L369.5,114.4 L371.7,114.4 L371.2,116.6 L374.0,117.1 L375.8,114.9 L378.5,116.2 L379.2,120.9 L377.8,123.0 L377.9,124.9 L376.2,128.8 L370.9,129.7 L370.5,128.2 L367.7,129.6 L366.6,127.4 L363.5,129.8 L362.1,129.7 L363.5,120.4 L367.1,121.7 L366.9,118.1 L364.2,115.9 Z M369.0,84.9 L370.2,85.7 L368.6,87.3 Z M370.3,76.3 L372.0,80.0 L371.2,82.1 L369.5,81.5 L370.3,76.6 Z M578.0,277.0 L578.0,277.5 L575.7,276.6 L578.2,276.8 Z M476.5,274.2 L481.4,272.1 L482.7,274.6 L477.5,281.6 L474.8,282.3 L473.1,278.7 L475.5,273.4 Z M494.3,214.4 L495.7,207.4 L497.2,206.2 L500.2,205.8 L502.4,206.2 L504.6,214.0 L503.7,216.6 L501.7,218.3 L496.9,219.5 Z M372.1,146.3 L377.4,146.3 L379.6,149.0 L379.0,152.2 L375.7,157.9 L372.0,150.2 L370.2,149.0 Z M505.3,345.9 L507.4,341.5 L506.5,336.7 L505.3,336.1 L506.6,336.1 L507.6,341.9 L509.3,338.2 L511.7,338.8 L512.6,341.5 L510.1,340.2 L508.6,345.5 L507.5,343.2 L506.1,346.5 Z M486.0,265.9 L480.4,264.0 L478.3,264.4 L477.6,261.2 L475.1,261.8 L474.9,259.1 L471.9,261.6 L472.4,264.4 L469.5,266.3 L468.4,270.0 L465.2,272.5 L463.3,271.4 L463.0,267.3 L461.9,266.3 L455.2,268.4 L456.2,264.4 L459.4,262.1 L457.7,256.6 L458.6,252.6 L458.1,248.7 L458.6,243.1 L460.5,241.0 L463.0,244.3 L461.8,245.3 L464.5,248.8 L465.4,245.5 L468.1,248.4 L471.5,248.7 L472.7,250.8 L477.1,252.2 L480.4,254.6 L482.1,257.7 L480.2,260.4 L483.1,259.2 L487.5,259.7 L489.4,261.2 Z M411.8,210.9 L408.7,214.2 L404.5,213.1 L403.3,211.7 L400.0,210.5 L398.0,207.9 L397.1,209.4 L395.5,207.1 L400.7,203.6 L399.8,202.1 L401.6,197.8 L404.8,196.6 L407.2,201.6 L410.3,200.8 L409.6,202.8 L411.6,208.9 L414.4,209.4 L413.0,211.5 Z M467.6,149.4 L466.5,143.8 L467.7,142.9 L471.6,144.0 L476.3,142.7 L480.0,144.0 L484.7,148.5 L485.2,152.1 L480.9,152.1 L478.1,152.5 L474.7,155.0 L471.6,154.4 L469.9,149.6 Z M402.8,176.4 L400.1,179.6 L398.0,178.5 L395.8,172.0 L392.9,167.7 L390.8,165.7 L388.4,165.7 L388.0,163.5 L385.7,161.2 L385.3,159.3 L386.6,156.4 L388.2,156.0 L390.8,160.8 L394.0,160.7 L395.7,157.9 L395.1,155.7 L393.7,155.4 L394.8,153.2 L392.8,153.9 L390.1,150.8 L392.8,149.5 L393.1,146.5 L396.2,147.5 L395.6,145.5 L397.1,145.3 L399.2,148.0 L403.3,147.1 L404.0,146.0 L406.4,146.6 L407.3,149.6 L405.7,150.8 L406.7,152.6 L404.5,153.8 L402.1,157.1 L406.2,158.3 L407.1,160.6 L408.1,159.1 L409.8,165.1 L408.8,167.2 L408.8,172.6 L407.2,173.0 L405.2,175.4 L402.2,174.8 Z M419.4,136.0 L415.5,136.4 L413.4,134.1 L412.7,134.9 L413.3,138.2 L411.4,137.1 L412.7,133.9 L411.3,133.8 L409.8,131.3 L409.3,128.8 L411.7,124.7 L414.7,122.7 L415.0,120.8 L414.6,118.7 L415.9,117.9 L416.6,121.0 L415.5,121.3 L419.6,127.7 L420.0,132.8 Z M401.6,109.0 L405.5,111.0 L405.1,113.3 L406.0,115.6 L405.7,119.6 L404.4,121.3 L406.3,122.2 L403.5,126.8 L405.5,129.4 L403.9,131.0 L398.3,131.5 L395.9,130.9 L394.8,125.1 L397.2,125.0 L398.0,122.3 L392.5,122.7 L388.4,123.9 L388.4,121.4 L389.9,120.9 L390.0,118.9 L391.4,118.5 L392.9,120.3 L391.4,116.0 L393.2,113.8 L390.8,114.1 L392.0,110.9 L394.3,112.6 L394.1,114.1 L398.2,118.2 L396.2,114.2 L397.7,113.3 L395.7,112.2 L394.7,110.4 L395.6,108.4 L392.5,109.1 L395.0,107.2 L397.3,107.2 L399.2,108.7 L400.7,111.4 Z M432.8,114.5 L426.7,115.2 L430.3,116.3 L427.3,116.9 L430.6,118.1 L431.2,117.1 L433.8,119.8 L433.8,122.0 L435.2,124.7 L436.1,121.5 L437.5,123.9 L440.2,121.7 L443.8,123.9 L448.0,120.3 L449.6,120.6 L452.1,117.4 L454.4,118.3 L456.7,116.5 L460.9,116.8 L460.6,118.4 L463.2,118.0 L466.5,120.1 L467.3,123.9 L464.8,126.3 L467.8,126.0 L468.8,127.8 L466.1,129.9 L466.8,131.6 L462.8,133.1 L461.4,134.7 L457.2,134.1 L456.0,130.5 L455.2,134.1 L452.6,135.4 L444.4,136.8 L437.6,137.0 L437.1,131.7 L436.1,135.0 L432.5,137.0 L428.5,134.9 L429.3,132.4 L426.8,135.8 L425.0,134.1 L424.4,129.3 L423.1,128.3 L423.6,124.3 L424.5,123.0 L423.7,119.0 L420.4,112.6 L417.3,114.2 L411.5,112.3 L409.4,108.2 L410.0,106.6 L408.4,104.1 L411.7,102.8 L418.3,104.9 L420.4,109.0 L421.7,109.4 L425.7,107.8 L428.6,109.5 L428.9,110.8 L426.0,111.1 L433.0,112.9 Z M418.7,97.2 L411.0,97.1 L410.0,95.4 L411.3,93.0 L412.7,92.3 L418.3,92.6 L419.5,93.4 Z M404.8,77.4 L406.8,77.8 L410.5,80.4 L414.4,84.2 L412.8,85.9 L414.3,87.9 L413.8,89.9 L407.6,91.6 L408.0,90.6 L405.6,88.9 L408.4,87.5 L405.5,86.2 L403.9,82.2 Z M385.7,79.8 L388.9,81.2 L389.3,77.1 L387.2,76.9 L388.4,75.6 L387.9,74.0 L384.9,76.1 L386.2,73.4 L383.7,73.0 L384.6,68.4 L385.3,69.0 L389.4,68.4 L391.6,70.5 L392.6,73.9 L394.9,73.1 L396.6,75.4 L395.9,77.0 L398.3,77.0 L400.6,80.6 L399.5,82.9 L401.8,88.2 L401.8,90.9 L398.9,92.4 L396.9,91.2 L395.7,86.1 L392.6,84.7 L390.7,85.3 L391.0,83.2 L385.8,84.4 L384.4,80.8 Z M415.1,42.0 L418.1,42.1 L417.9,40.2 L414.9,39.5 L415.4,37.8 L417.7,37.6 L421.4,40.9 L424.6,50.3 L428.3,50.5 L429.1,51.5 L428.8,54.2 L429.5,55.8 L432.0,57.1 L430.2,54.3 L430.7,51.9 L432.7,52.1 L433.4,55.7 L432.6,57.5 L434.4,57.3 L435.4,59.7 L435.4,64.9 L436.7,63.6 L439.8,64.4 L442.1,68.4 L440.6,70.6 L438.0,72.3 L435.6,78.5 L434.6,78.3 L433.9,74.4 L433.3,74.5 L433.8,78.6 L434.7,80.4 L433.9,85.0 L433.9,81.8 L432.1,79.6 L432.9,82.3 L432.6,86.0 L431.8,86.1 L428.5,80.0 L428.7,82.5 L430.6,86.4 L428.4,84.2 L427.9,86.9 L422.9,86.2 L421.0,84.4 L420.1,82.0 L423.5,81.1 L420.3,80.0 L419.1,80.8 L415.9,75.2 L418.8,72.1 L422.6,72.1 L426.8,70.7 L422.0,71.5 L420.6,69.9 L422.7,69.3 L420.4,67.8 L416.8,70.8 L417.0,68.7 L415.1,69.6 L411.7,68.7 L412.0,66.3 L414.5,65.5 L415.6,63.2 L413.2,65.0 L411.4,64.9 L409.3,61.3 L409.1,57.2 L410.9,58.4 L414.1,58.8 L416.1,56.7 L414.6,56.1 L412.6,57.6 L409.5,55.2 L411.1,53.4 L410.7,51.8 L411.9,49.2 L413.1,48.5 L414.8,50.0 L414.8,48.1 L412.2,46.8 L412.3,45.3 L413.8,42.7 L415.1,44.1 Z M471.4,79.8 L468.4,79.7 L467.6,80.6 L471.8,81.0 L471.3,83.5 L470.2,82.8 L468.6,84.8 L464.6,84.8 L467.0,89.7 L465.9,93.1 L463.6,94.9 L458.4,95.1 L455.5,93.0 L455.2,94.2 L457.1,95.5 L455.2,96.3 L455.7,98.0 L457.5,96.0 L461.1,96.8 L462.8,95.8 L464.4,97.4 L463.7,100.1 L466.8,98.3 L468.2,98.6 L469.5,102.7 L467.7,106.0 L466.6,104.5 L465.4,108.7 L460.2,112.0 L460.5,107.9 L458.9,107.0 L456.6,107.4 L455.7,108.9 L451.1,109.1 L449.1,106.8 L449.3,109.2 L447.0,109.8 L449.0,111.1 L446.2,111.4 L442.3,110.5 L441.4,111.5 L439.0,110.2 L438.4,111.9 L435.8,111.3 L434.9,105.5 L434.1,111.2 L431.5,109.1 L431.7,105.2 L435.3,100.9 L437.5,101.2 L439.4,98.7 L436.9,97.7 L436.9,95.8 L435.0,93.7 L434.8,91.4 L437.7,89.6 L440.8,90.9 L442.6,94.9 L443.9,96.3 L447.0,97.3 L446.4,96.2 L450.0,96.2 L448.7,94.6 L449.8,94.0 L451.7,87.1 L450.7,86.4 L449.7,92.5 L448.4,94.4 L443.9,93.6 L444.0,90.4 L442.2,88.5 L443.8,86.7 L444.2,82.5 L442.5,86.0 L440.4,87.1 L439.2,85.1 L438.6,86.4 L436.5,86.5 L436.1,81.8 L438.1,76.2 L440.5,75.6 L441.8,74.2 L446.2,74.8 L449.3,76.6 L447.8,74.4 L451.8,73.6 L452.2,70.8 L449.6,73.6 L448.3,73.0 L444.5,73.3 L443.0,72.2 L443.5,70.5 L446.7,71.9 L443.9,69.8 L443.0,66.5 L441.2,63.6 L436.9,61.7 L437.1,58.6 L435.9,55.9 L436.1,53.2 L439.2,53.7 L443.2,53.5 L448.4,58.7 L450.4,62.7 L453.2,62.1 L455.3,60.1 L452.4,61.4 L450.5,60.8 L449.6,57.9 L444.6,52.2 L447.6,50.4 L451.6,48.6 L452.3,47.7 L457.2,45.6 L452.2,46.3 L455.4,43.0 L460.1,40.9 L459.8,40.1 L456.3,40.8 L454.4,41.9 L453.8,39.5 L455.9,34.0 L457.3,31.5 L454.6,34.5 L452.7,39.9 L452.5,42.8 L449.0,46.6 L444.9,48.7 L444.3,46.9 L446.4,45.4 L446.6,43.6 L443.5,46.3 L442.4,45.6 L442.5,48.7 L441.1,49.6 L436.6,49.7 L434.9,48.9 L436.7,43.2 L438.1,41.8 L443.9,39.2 L444.7,38.2 L437.5,41.2 L435.8,42.5 L433.5,48.6 L431.3,48.0 L427.8,45.1 L428.0,43.9 L430.1,43.0 L434.4,42.5 L438.7,37.4 L437.4,37.3 L434.6,40.5 L426.5,43.0 L425.0,40.5 L427.3,39.1 L425.9,37.7 L428.2,34.9 L430.5,34.2 L429.3,33.4 L424.5,37.3 L423.5,35.8 L426.4,32.9 L423.7,32.3 L422.1,34.6 L420.7,33.2 L422.8,29.6 L425.6,28.1 L426.7,29.8 L428.0,25.6 L429.5,24.7 L434.9,26.1 L437.2,25.8 L432.4,23.9 L432.0,22.5 L435.2,21.0 L434.0,18.1 L438.9,19.5 L441.1,23.0 L442.0,23.4 L440.6,20.1 L444.2,22.7 L448.2,24.6 L450.5,26.7 L448.4,23.5 L445.7,22.7 L441.0,18.6 L441.1,16.4 L443.4,16.3 L441.4,15.1 L441.7,13.4 L444.6,15.4 L445.2,14.9 L442.4,11.3 L445.2,10.9 L448.1,12.4 L449.4,11.9 L446.1,11.1 L445.0,8.2 L446.6,7.3 L447.7,8.8 L450.0,7.5 L451.7,8.2 L453.6,11.2 L455.4,12.2 L452.6,7.8 L450.7,6.2 L453.1,4.5 L457.4,4.5 L458.7,6.6 L462.1,8.7 L458.8,5.5 L459.6,2.6 L462.2,1.4 L463.1,4.0 L464.9,4.6 L462.9,2.7 L463.9,0.8 L466.1,0.0 L466.9,2.1 L469.8,1.0 L473.8,0.8 L474.1,1.6 L470.8,7.5 L473.2,6.2 L475.5,2.1 L476.7,2.9 L477.5,0.1 L478.9,2.4 L480.5,0.6 L480.8,2.5 L483.7,5.1 L486.5,4.5 L488.1,5.9 L488.9,8.9 L487.7,10.4 L487.9,12.5 L485.0,18.9 L482.5,19.1 L483.0,20.4 L477.1,24.4 L479.3,23.6 L481.0,24.2 L474.7,32.0 L476.0,31.2 L483.2,23.6 L485.6,21.7 L486.2,24.3 L484.0,27.9 L483.4,31.3 L480.9,36.9 L479.8,40.9 L479.9,43.2 L477.4,44.8 L479.0,45.7 L474.2,50.3 L477.8,48.0 L478.3,50.3 L477.3,54.6 L475.6,56.2 L473.6,56.0 L472.8,54.6 L469.4,54.1 L468.0,55.2 L472.1,55.4 L473.6,58.7 L471.6,60.6 L468.6,60.7 L469.1,62.4 L465.6,61.4 L466.8,63.4 L464.3,63.8 L462.4,62.7 L463.2,65.4 L471.2,64.2 L470.4,64.9 L471.8,67.0 L467.7,66.9 L466.8,65.6 L461.4,67.1 L466.9,66.8 L463.4,69.1 L462.2,68.8 L461.9,72.9 L463.0,70.0 L465.6,68.4 L468.4,68.6 L466.9,70.7 L470.1,69.8 L472.3,71.5 L472.5,73.7 L471.0,75.2 L467.8,75.4 L472.3,77.0 Z"
              },
              {
                  "enable": true,
                  "name": "Northwest Territories",
                  "abbreviation": "NT",
                  "textX": 0,
                  "textY": 60,
                  "color": "black",
                  "hoverColor": "grey",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Northwest Territories</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M354.6,100.0 L354.3,102.5 L350.7,100.9 L352.4,99.6 Z M356.0,83.8 L357.5,87.1 L355.6,88.2 L353.5,84.1 Z M378.3,309.2 L334.9,304.4 L281.6,293.1 L261.7,287.2 L259.8,278.8 L260.9,275.9 L256.6,276.5 L254.0,274.4 L253.1,275.2 L248.7,273.8 L249.9,266.3 L246.6,262.5 L245.5,257.0 L242.6,255.9 L243.9,252.1 L242.5,247.1 L244.1,245.1 L242.7,241.6 L244.8,240.5 L244.8,236.8 L242.6,233.6 L242.6,228.1 L239.4,227.3 L240.6,226.1 L239.7,223.6 L237.8,221.8 L239.9,219.5 L238.8,217.5 L243.1,213.9 L242.6,210.5 L243.4,208.5 L239.3,207.8 L239.3,203.2 L241.4,200.9 L241.6,195.6 L232.8,191.3 L234.9,187.4 L235.3,183.1 L241.4,170.3 L242.7,171.3 L244.4,174.9 L244.0,169.2 L245.8,167.1 L250.8,166.8 L251.8,168.0 L253.8,165.2 L254.7,168.7 L251.6,170.6 L254.9,170.0 L256.5,170.7 L259.0,168.3 L263.6,168.8 L266.2,167.4 L266.4,169.3 L270.0,166.5 L272.7,168.3 L274.3,166.5 L274.7,168.5 L273.4,169.8 L266.1,171.5 L262.0,171.2 L260.6,173.0 L258.3,172.9 L253.1,176.5 L255.5,178.3 L256.2,175.1 L261.2,174.2 L263.0,172.5 L264.8,176.0 L269.2,172.0 L274.6,172.1 L274.4,174.3 L278.4,171.8 L280.8,168.7 L281.4,164.3 L284.1,170.4 L283.9,176.6 L285.5,181.7 L287.2,183.5 L287.7,181.2 L290.4,179.1 L291.6,176.0 L294.5,175.2 L292.6,180.2 L294.2,180.6 L291.4,184.3 L294.5,185.4 L297.0,184.4 L299.1,180.7 L305.1,183.4 L307.4,186.7 L302.4,204.6 L302.5,204.9 L332.6,241.6 L341.0,243.1 L345.4,250.4 L346.9,252.0 L350.4,253.3 L381.4,262.3 L378.3,309.1 Z M357.3,160.1 L356.5,159.2 L357.4,159.8 Z M357.7,157.4 L357.6,158.5 L357.3,158.0 Z M357.8,156.8 L356.2,155.5 L355.7,153.2 L358.3,153.9 Z M364.2,115.9 L364.1,115.6 L364.3,115.5 Z M364.9,111.2 L364.1,108.2 L365.5,107.6 Z M363.5,120.4 L362.1,129.7 L355.5,133.3 L350.5,133.8 L348.3,132.8 L346.3,129.1 L352.7,126.3 L357.1,126.7 L359.7,123.8 L354.6,124.7 L349.0,124.3 L350.3,120.9 L349.5,120.4 L347.3,124.1 L345.3,125.0 L344.9,122.1 L342.7,124.4 L341.2,122.7 L341.6,120.8 L340.0,121.6 L337.3,120.0 L337.7,117.9 L339.3,116.5 L343.1,117.4 L346.1,116.4 L347.1,115.1 L343.2,116.1 L339.6,115.3 L341.3,112.7 L348.1,113.1 L348.3,112.5 L343.8,112.1 L342.2,111.3 L342.7,109.2 L346.2,107.5 L346.1,105.9 L347.7,104.7 L352.0,105.4 L352.0,109.4 L355.3,108.8 L356.9,110.6 L356.8,112.5 L358.5,114.0 L356.9,115.1 L359.3,115.6 L359.3,120.0 Z M369.0,84.9 L368.6,87.3 L366.0,87.8 L366.1,89.3 L367.9,89.4 L367.0,93.3 L360.8,94.8 L358.0,91.3 L358.9,86.0 L362.1,84.9 L366.9,84.5 Z M370.3,76.3 L370.3,76.6 L369.5,81.5 L368.5,82.0 L366.3,80.1 L365.2,81.6 L363.3,79.8 L360.4,80.8 L360.4,78.8 L363.8,77.2 L364.8,77.5 L367.0,75.6 L369.3,75.0 Z M336.0,109.5 L339.8,107.6 L340.3,108.2 L337.7,112.5 L334.7,115.1 L332.4,113.1 Z M357.3,160.6 L352.6,191.0 L342.2,189.2 L342.1,191.0 L340.3,190.9 L340.6,188.9 L323.3,185.2 L323.4,189.7 L322.1,187.9 L322.0,185.0 L324.3,183.8 L328.3,183.6 L336.1,184.1 L342.3,186.7 L346.3,186.0 L344.8,183.5 L342.0,182.4 L339.8,180.2 L336.9,179.8 L325.9,179.6 L326.8,178.4 L324.2,178.5 L321.5,174.1 L321.2,171.7 L331.2,169.6 L332.7,167.7 L325.5,168.3 L322.9,166.4 L325.7,165.8 L324.4,164.2 L320.5,163.7 L321.5,160.0 L323.5,157.8 L325.9,157.3 L324.8,154.4 L326.9,152.2 L330.8,149.4 L342.3,145.8 L343.9,149.6 L342.9,153.6 L340.2,155.6 L343.5,156.1 L345.5,152.7 L347.2,151.6 L350.4,153.7 L353.2,156.5 L352.6,158.4 L350.1,160.4 L350.6,161.6 L354.7,158.7 Z M310.8,132.4 L309.8,130.9 L309.7,124.0 L317.4,124.8 L321.4,124.7 L325.3,129.6 L328.5,131.4 L328.4,134.2 L330.0,131.7 L332.5,131.5 L334.6,132.7 L336.1,135.0 L339.9,144.0 L335.2,145.8 L323.3,151.3 L321.7,154.6 L319.7,155.7 L317.9,155.0 L316.3,158.2 L315.6,161.5 L314.0,163.8 L310.6,164.2 L309.8,162.9 L307.3,164.8 L303.1,165.9 L301.7,157.3 L298.2,152.8 L295.8,151.9 L300.2,146.3 L301.8,145.8 L302.6,141.8 L304.9,142.0 L304.2,139.5 L307.0,136.0 Z M330.9,97.4 L333.7,96.1 L335.2,93.7 L340.4,89.8 L343.4,90.2 L345.0,92.1 L347.1,91.0 L345.8,89.7 L348.4,88.8 L350.7,93.1 L347.1,94.9 L348.5,97.6 L347.5,98.3 L347.3,101.1 L345.5,102.4 L343.0,102.6 L342.9,105.0 L341.3,106.0 L339.6,103.6 L341.7,98.7 L339.2,98.9 L339.3,101.1 L336.9,101.6 L337.7,103.9 L334.7,106.5 L334.8,103.0 L333.7,104.0 L333.6,107.3 L331.8,109.3 L329.7,108.9 L329.8,103.9 L328.5,107.3 L327.3,107.3 L326.1,105.1 L323.8,106.0 L323.7,101.6 L325.8,99.7 L328.6,100.1 Z"
              },
              {
                  "enable": true,
                  "name": "Alberta",
                  "abbreviation": "AB",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Alberta</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M281.6,293.1 L334.9,304.4 L317.2,418.5 L317.2,418.6 L317.2,418.6 L316.4,418.5 L300.4,415.7 L290.3,413.8 L290.3,413.8 L287.1,407.0 L288.3,405.1 L288.5,399.2 L284.0,393.0 L279.6,381.9 L277.8,382.4 L276.6,377.4 L274.7,377.3 L273.0,373.1 L271.5,374.0 L271.7,370.7 L270.1,365.6 L267.2,364.0 L264.8,361.0 L264.6,356.1 Z"
              },
              {
                  "enable": true,
                  "name": "Massachusetts",
                  "abbreviation": "MA",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Massachusetts</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M595.7,474.5 L595.6,474.0 L595.3,474.3 L593.3,471.6 L590.4,472.5 L583.4,474.1 L578.1,475.3 L577.8,475.1 L577.9,468.1 L580.5,467.5 L583.7,466.8 L583.7,466.8 L592.1,464.8 L595.1,462.1 L597.3,464.0 L595.1,468.1 L597.6,468.3 L600.1,471.8 L604.8,471.9 L599.0,475.9 L599.4,473.0 L596.6,475.9 L596.2,474.5 Z"
              },
              {
                  "enable": true,
                  "name": "Vermont",
                  "abbreviation": "VT",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Vermont</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M580.5,467.5 L577.9,468.1 L576.0,460.2 L574.7,460.1 L573.4,455.7 L573.4,451.3 L571.7,446.2 L576.2,445.0 L584.4,442.7 L584.8,448.6 L582.7,450.9 L582.1,458.8 L582.7,465.5 L583.7,466.8 L583.7,466.8 Z"
              },
              {
                  "enable": true,
                  "name": "Minnesota",
                  "abbreviation": "MN",
                  "textX": -7,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Minnesota</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M454.8,434.4 L448.5,437.8 L445.3,440.2 L438.1,447.9 L436.9,449.0 L437.1,454.9 L434.3,456.7 L433.1,460.2 L434.7,461.4 L433.9,468.4 L439.1,471.5 L442.5,475.0 L445.3,476.4 L445.8,480.6 L433.9,481.1 L407.6,481.5 L407.7,463.4 L404.8,460.3 L407.0,456.8 L406.7,453.0 L405.4,449.7 L405.1,441.1 L403.3,434.2 L403.5,429.3 L402.7,425.8 L416.5,425.8 L416.6,421.9 L418.8,422.7 L419.7,427.6 L426.2,430.5 L429.5,429.2 L433.7,430.1 L435.6,433.1 L437.9,432.0 L442.2,434.8 L445.5,432.7 L446.5,433.9 L450.7,433.5 Z"
              },
              {
                  "enable": true,
                  "name": "Washington",
                  "abbreviation": "WA",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Washington</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M231.9,399.0 L231.5,399.1 L231.5,398.9 Z M222.5,426.0 L218.0,424.0 L217.1,422.5 L219.4,419.0 L218.3,417.2 L219.0,408.3 L218.4,403.5 L220.0,401.9 L222.8,404.9 L231.0,407.8 L231.9,410.6 L230.6,413.5 L231.5,416.0 L228.5,415.1 L226.3,417.2 L228.8,417.9 L231.8,416.0 L233.2,410.5 L231.5,406.8 L232.6,405.5 L229.7,403.4 L233.7,402.0 L233.7,399.5 L234.3,399.7 L270.8,409.5 L264.6,435.4 L264.9,439.4 L250.3,435.8 L246.1,435.5 L241.3,436.2 L234.5,435.4 L230.5,433.3 L226.9,433.9 L223.9,432.0 L224.1,427.3 Z"
              },
              {
                  "enable": true,
                  "name": "Idaho",
                  "abbreviation": "ID",
                  "textX": 0,
                  "textY": 20,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Idaho</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M270.8,409.5 L277.3,411.0 L275.0,420.9 L276.6,424.4 L276.0,427.0 L278.2,429.2 L282.1,436.5 L283.6,436.5 L282.1,440.4 L281.8,444.2 L280.1,447.2 L281.4,448.4 L284.4,446.8 L287.1,456.6 L288.8,460.4 L293.3,461.1 L294.4,460.3 L299.6,461.1 L301.3,459.8 L302.7,462.5 L299.9,479.5 L298.6,487.3 L288.9,485.6 L276.5,483.2 L269.7,481.8 L254.7,478.5 L258.8,461.0 L260.6,457.2 L258.7,455.6 L259.1,453.8 L262.7,450.1 L266.8,444.2 L264.9,439.4 L264.6,435.4 Z"
              },
              {
                  "enable": true,
                  "name": "Arkansas",
                  "abbreviation": "AR",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Arkansas</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M427.6,586.8 L427.4,581.3 L423.7,580.4 L423.8,562.9 L422.2,551.8 L458.3,550.3 L459.2,552.4 L456.9,555.6 L462.2,555.1 L459.5,561.5 L458.1,565.5 L455.9,569.2 L456.0,571.4 L452.2,575.9 L451.2,579.1 L452.1,581.2 L452.0,585.8 L450.4,585.9 Z"
              },
              {
                  "enable": true,
                  "name": "Texas",
                  "abbreviation": "TX",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Texas</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M423.7,580.4 L427.4,581.3 L427.6,586.8 L427.8,597.0 L432.6,606.6 L430.9,611.4 L430.4,617.3 L428.2,620.5 L422.9,622.9 L422.5,619.9 L419.6,622.0 L422.3,624.1 L414.5,630.0 L411.4,630.7 L402.5,637.9 L398.3,645.6 L398.6,650.4 L400.4,658.5 L397.7,659.6 L394.3,657.4 L390.4,657.2 L385.1,654.1 L382.5,653.6 L381.9,650.3 L379.3,646.8 L379.0,641.5 L377.3,640.6 L372.3,633.8 L369.3,625.3 L363.1,618.2 L356.9,617.6 L355.1,616.6 L351.8,617.8 L347.1,625.2 L339.3,621.0 L335.4,617.2 L334.6,611.8 L332.2,606.6 L329.3,604.6 L320.5,594.3 L319.4,591.8 L350.2,594.8 L353.9,549.8 L354.2,549.7 L378.5,551.1 L377.7,570.5 L380.3,572.4 L383.7,572.4 L384.3,574.2 L390.1,576.0 L393.5,575.4 L394.5,577.9 L396.9,577.0 L401.6,579.7 L403.3,577.4 L408.2,580.0 L411.5,578.1 L417.5,577.3 Z"
              },
              {
                  "enable": true,
                  "name": "Rhode Island",
                  "abbreviation": "RI",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Rhode Island</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M596.6,475.9 L596.1,476.2 L595.7,474.5 L596.2,474.5 Z M590.4,472.5 L593.3,471.6 L595.3,474.3 L595.9,476.4 L591.9,479.4 L591.7,477.2 Z"
              },
              {
                  "enable": true,
                  "name": "Florida",
                  "abbreviation": "FL",
                  "textX": 20,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Florida</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M486.2,609.0 L484.2,603.9 L506.6,601.5 L508.2,604.2 L531.2,602.6 L533.1,604.2 L533.6,599.6 L537.3,600.1 L541.2,609.5 L545.1,615.7 L549.6,621.1 L550.3,625.7 L556.3,635.5 L557.6,646.4 L555.9,655.4 L555.3,653.6 L550.2,655.8 L547.5,650.2 L542.9,648.6 L541.2,643.8 L538.8,644.1 L538.5,639.6 L536.2,640.1 L532.2,634.7 L534.0,630.6 L530.1,631.1 L530.3,620.1 L528.3,617.3 L526.4,617.5 L519.5,610.8 L516.3,609.4 L513.2,610.5 L508.6,615.4 L501.9,611.0 L494.2,608.9 L485.4,611.1 Z"
              },
              {
                  "enable": true,
                  "name": "Mississippi",
                  "abbreviation": "MS",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Mississippi</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M477.7,610.7 L469.6,611.4 L468.0,613.4 L464.8,608.7 L465.6,605.4 L448.8,606.4 L448.8,603.6 L451.2,597.6 L454.5,592.5 L452.9,591.5 L452.0,585.8 L452.1,581.2 L451.2,579.1 L452.2,575.9 L456.0,571.4 L455.9,569.2 L458.1,565.5 L472.0,564.5 L475.6,564.2 L476.5,565.2 L475.7,595.6 Z"
              },
              {
                  "enable": true,
                  "name": "Utah",
                  "abbreviation": "UT",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Utah</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M298.6,487.3 L296.9,497.2 L312.0,499.6 L311.1,505.8 L306.2,539.3 L292.6,537.2 L266.6,532.4 L270.9,510.9 L276.5,483.2 L288.9,485.6 Z"
              },
              {
                  "enable": true,
                  "name": "North Carolina",
                  "abbreviation": "NC",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>North Carolina</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M572.5,533.4 L572.7,533.9 L571.7,533.6 L571.7,533.6 L572.0,533.5 L572.1,533.6 L572.2,533.5 L572.3,533.5 Z M517.3,559.4 L514.2,559.9 L507.4,560.9 L507.5,558.1 L511.1,554.6 L513.3,554.2 L519.7,548.3 L524.0,547.2 L526.6,541.6 L539.3,540.2 L571.5,533.6 L574.5,537.8 L572.1,537.4 L567.3,540.8 L574.2,538.9 L575.6,540.2 L573.8,545.1 L569.5,544.9 L570.4,548.6 L567.6,550.7 L572.7,550.4 L570.7,553.0 L566.6,553.9 L562.9,557.8 L561.5,563.5 L556.5,564.2 L545.9,556.8 L536.7,558.1 L533.7,555.3 L523.7,556.3 Z M572.9,533.3 L575.0,537.9 L572.7,533.4 L572.8,533.4 Z"
              },
              {
                  "enable": true,
                  "name": "Georgia",
                  "abbreviation": "GA",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Georgia</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M507.4,560.9 L514.2,559.9 L517.3,559.4 L515.7,562.6 L520.1,564.5 L523.2,569.0 L529.3,573.1 L531.2,576.1 L533.5,576.9 L535.1,580.9 L537.0,582.0 L538.7,585.8 L540.4,586.1 L537.4,591.5 L538.4,594.2 L536.9,595.3 L537.3,600.1 L533.6,599.6 L533.1,604.2 L531.2,602.6 L508.2,604.2 L506.6,601.5 L504.4,593.4 L506.0,588.6 L502.6,582.2 L496.8,562.2 L502.9,561.4 Z"
              },
              {
                  "enable": true,
                  "name": "Virginia",
                  "abbreviation": "VA",
                  "textX": 8,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Virginia</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M572.2,533.5 L572.4,533.2 L572.5,533.4 L572.3,533.5 Z M572.7,533.4 L571.7,532.0 L572.0,533.5 L571.7,533.6 L571.7,533.6 L571.3,533.3 L571.5,533.6 L539.3,540.2 L526.6,541.6 L524.3,542.1 L510.5,544.0 L514.6,542.0 L518.0,537.3 L522.7,532.8 L524.3,535.1 L529.1,534.8 L536.0,530.9 L535.7,529.1 L538.6,522.6 L539.2,519.3 L542.1,520.4 L543.8,515.8 L544.7,516.3 L547.6,511.8 L547.7,508.9 L552.0,511.2 L552.4,509.2 L554.5,510.6 L558.0,512.1 L558.2,512.3 L558.4,512.3 L557.3,517.6 L559.3,517.3 L559.7,517.2 L560.0,517.6 L561.4,519.1 L563.5,519.0 L566.9,520.8 L566.9,523.6 L561.5,521.1 L567.9,525.2 L566.5,526.3 L568.4,529.6 L571.1,530.0 L572.9,533.3 L572.8,533.4 Z M574.4,517.8 L574.1,519.2 L574.2,517.9 Z M573.4,518.1 L570.9,525.5 L569.1,520.9 L571.4,519.1 L571.5,518.8 Z"
              },
              {
                  "enable": true,
                  "name": "Tennessee",
                  "abbreviation": "TN",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Tennessee</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M510.5,544.0 L524.3,542.1 L526.6,541.6 L524.0,547.2 L519.7,548.3 L513.3,554.2 L511.1,554.6 L507.5,558.1 L507.4,560.9 L502.9,561.4 L496.8,562.2 L475.6,564.1 L475.6,564.2 L472.0,564.5 L458.1,565.5 L459.5,561.5 L462.2,555.1 L462.2,552.6 L463.2,550.0 L463.7,550.0 L463.8,550.4 L464.3,549.9 L475.4,549.0 L477.0,547.4 L487.3,546.3 L510.1,544.3 Z"
              },
              {
                  "enable": true,
                  "name": "Iowa",
                  "abbreviation": "IA",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Iowa</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M412.7,510.7 L412.0,503.6 L410.3,501.1 L410.5,498.7 L407.4,491.4 L406.2,489.0 L407.6,485.3 L406.6,481.5 L407.6,481.5 L433.9,481.1 L445.8,480.6 L447.7,488.1 L450.9,490.3 L450.8,490.3 L454.6,494.0 L453.6,499.3 L448.8,501.3 L449.3,506.1 L446.0,512.0 L446.0,512.0 L446.0,512.0 L443.6,509.7 L422.6,510.9 L412.8,510.7 Z"
              },
              {
                  "enable": true,
                  "name": "Maryland",
                  "abbreviation": "MD",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Maryland</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M574.2,517.9 L574.5,516.9 L574.4,517.8 Z M574.9,513.2 L575.0,514.5 L574.8,513.3 L574.8,513.3 Z M558.0,512.1 L554.5,510.6 L552.4,509.2 L551.0,506.6 L548.7,506.1 L546.4,508.3 L543.9,507.7 L539.2,513.0 L538.4,507.9 L551.6,505.3 L566.4,502.2 L569.9,514.3 L574.6,513.3 L574.6,515.5 L573.4,518.1 L571.5,518.8 L571.4,519.1 L570.0,517.5 L565.1,515.3 L567.3,513.9 L564.5,512.4 L565.9,511.0 L564.0,508.6 L565.6,503.5 L562.9,507.8 L562.5,511.6 L563.5,515.1 L565.8,518.6 L561.5,518.3 L560.0,517.6 L559.3,517.3 L557.7,516.7 L559.0,513.2 L559.7,512.2 Z"
              },
              {
                  "enable": true,
                  "name": "Delaware",
                  "abbreviation": "DE",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Delaware</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M574.8,513.3 L574.6,513.3 L574.6,513.3 L569.9,514.3 L566.4,502.2 L567.6,500.7 L569.0,500.7 L568.0,502.9 L570.9,508.0 L573.9,510.0 L574.9,513.2 L574.8,513.3 Z"
              },
              {
                  "enable": true,
                  "name": "Missouri",
                  "abbreviation": "MO",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Missouri</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M416.2,516.7 L413.8,513.2 L412.7,510.7 L412.7,510.7 L412.8,510.7 L422.6,510.9 L443.6,509.7 L446.0,512.0 L446.0,512.0 L446.0,512.0 L445.5,514.1 L447.0,518.7 L451.3,522.4 L453.4,526.7 L457.1,527.0 L455.4,532.4 L457.7,535.1 L462.4,538.0 L462.9,542.3 L466.3,544.9 L466.4,547.4 L464.3,549.9 L463.8,550.4 L463.7,550.0 L463.0,549.4 L463.2,550.0 L462.2,552.6 L462.2,555.1 L456.9,555.6 L459.2,552.4 L458.3,550.3 L422.2,551.8 L422.1,548.0 L422.1,546.8 L421.8,525.4 L418.0,521.4 L419.6,518.5 Z"
              },
              {
                  "enable": true,
                  "name": "Pennsylvania",
                  "abbreviation": "PA",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Pennsylvania</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M568.4,488.7 L569.8,492.7 L573.4,496.0 L571.5,497.9 L570.8,499.3 L569.6,500.2 L569.0,500.7 L567.6,500.7 L566.4,502.2 L551.6,505.3 L538.4,507.9 L530.4,509.3 L528.9,500.2 L528.9,500.2 L526.6,486.9 L527.6,486.3 L531.7,483.1 L532.1,485.8 L564.7,479.1 L567.5,482.4 L570.8,484.3 L570.8,484.3 Z"
              },
              {
                  "enable": true,
                  "name": "New Jersey",
                  "abbreviation": "NJ",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>New Jersey</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M568.4,488.7 L570.8,484.3 L574.2,485.3 L577.5,486.4 L575.9,491.9 L578.7,493.0 L579.1,499.1 L575.1,508.1 L568.9,504.1 L568.9,501.0 L569.6,500.2 L571.5,497.9 L573.4,496.0 L569.8,492.7 Z"
              },
              {
                  "enable": true,
                  "name": "New York",
                  "abbreviation": "NY",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>New York</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M570.8,484.3 L567.5,482.4 L564.7,479.1 L532.1,485.8 L531.7,483.1 L535.6,479.2 L537.2,476.2 L536.4,475.3 L535.3,473.9 L535.2,473.9 L535.2,473.2 L535.0,472.2 L541.6,469.7 L546.0,470.2 L551.8,468.1 L555.0,464.9 L552.6,459.8 L555.8,455.3 L558.6,450.8 L562.2,448.6 L562.3,448.6 L571.7,446.2 L573.4,451.3 L573.4,455.7 L574.7,460.1 L576.0,460.2 L577.9,468.1 L577.8,475.1 L578.1,475.3 L579.5,482.8 L579.5,485.8 L577.4,488.9 L577.5,486.4 L574.2,485.3 L571.7,484.5 L570.8,484.3 Z M580.8,486.1 L587.1,484.0 L588.7,482.0 L590.2,483.0 L590.6,480.2 L590.6,482.8 L584.7,487.9 L576.2,491.8 L578.0,488.4 Z"
              },
              {
                  "enable": true,
                  "name": "Louisiana",
                  "abbreviation": "LA",
                  "textX": -10,
                  "textY": -10,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Louisiana</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M427.6,586.8 L450.4,585.9 L452.0,585.8 L452.9,591.5 L454.5,592.5 L451.2,597.6 L448.8,603.6 L448.8,606.4 L465.6,605.4 L464.8,608.7 L468.0,613.4 L461.7,611.9 L460.0,614.5 L463.6,615.3 L467.0,614.0 L469.9,616.1 L466.6,619.2 L468.4,621.4 L473.1,623.0 L472.1,624.8 L466.0,622.5 L463.5,620.7 L463.9,623.7 L462.5,625.1 L460.0,623.0 L456.6,624.9 L452.6,623.5 L453.0,621.4 L450.6,621.2 L447.7,618.3 L445.5,620.5 L447.9,621.8 L440.4,620.9 L435.8,619.3 L430.2,620.2 L430.4,617.3 L430.9,611.4 L432.6,606.6 L427.8,597.0 Z"
              },
              {
                  "enable": true,
                  "name": "New Hampshire",
                  "abbreviation": "NH",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>New Hampshire</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M592.2,455.8 L595.0,460.0 L595.3,460.1 L595.1,462.1 L592.1,464.8 L583.7,466.8 L583.7,466.8 L582.7,465.5 L582.1,458.8 L582.7,450.9 L584.8,448.6 L584.4,442.7 L584.9,439.7 L586.5,439.1 L586.5,439.1 Z"
              },
              {
                  "enable": true,
                  "name": "Maine",
                  "abbreviation": "ME",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Maine</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M592.2,455.8 L586.5,439.1 L586.5,439.1 L587.9,439.3 L588.5,435.7 L590.0,433.6 L589.9,423.3 L592.7,414.7 L594.5,415.8 L595.8,416.4 L600.1,413.5 L603.6,415.6 L607.5,427.9 L609.1,429.0 L610.5,428.6 L611.3,431.8 L613.6,432.2 L616.5,434.9 L615.2,437.3 L609.4,440.9 L608.2,444.5 L607.2,441.6 L606.3,443.8 L603.5,443.4 L604.0,447.1 L599.8,452.1 L598.5,450.9 L595.0,460.0 Z"
              },
              {
                  "enable": true,
                  "name": "South Dakota",
                  "abbreviation": "SD",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>South Dakota</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M407.0,456.8 L404.8,460.3 L407.7,463.4 L407.6,481.5 L406.6,481.5 L407.6,485.3 L406.2,489.0 L407.4,491.4 L401.3,487.6 L395.6,488.4 L392.6,486.3 L351.5,483.9 L351.8,480.1 L353.3,463.8 L353.4,463.8 L354.2,454.3 L398.8,456.7 Z"
              },
              {
                  "enable": true,
                  "name": "Connecticut",
                  "abbreviation": "CT",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Connecticut</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M591.9,479.4 L584.4,482.0 L579.5,485.8 L579.5,482.8 L578.1,475.3 L583.4,474.1 L590.4,472.5 L591.7,477.2 Z"
              },
              {
                  "enable": true,
                  "name": "Illinois",
                  "abbreviation": "IL",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Illinois</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M471.9,488.9 L472.0,491.1 L474.7,496.4 L476.9,520.1 L476.1,522.6 L477.6,526.0 L474.1,533.0 L474.3,536.0 L473.9,539.3 L471.3,540.2 L471.4,543.6 L467.9,542.4 L466.3,544.9 L462.9,542.3 L462.4,538.0 L457.7,535.1 L455.4,532.4 L457.1,527.0 L453.4,526.7 L451.3,522.4 L447.0,518.7 L445.5,514.1 L446.0,512.0 L446.0,512.0 L446.0,512.0 L449.3,506.1 L448.8,501.3 L453.6,499.3 L454.6,494.0 L450.8,490.3 L450.9,490.3 L461.4,489.7 Z"
              },
              {
                  "enable": true,
                  "name": "Indiana",
                  "abbreviation": "IN",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Indiana</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M474.7,496.4 L476.6,497.2 L479.8,495.6 L495.0,493.9 L495.1,494.5 L495.7,498.5 L498.2,520.4 L498.6,523.5 L493.7,524.7 L494.1,526.5 L491.4,529.4 L489.9,532.8 L487.9,531.3 L484.5,534.0 L481.2,534.9 L475.4,534.6 L474.3,536.0 L474.1,533.0 L477.6,526.0 L476.1,522.6 L476.9,520.1 Z"
              },
              {
                  "enable": true,
                  "name": "Kentucky",
                  "abbreviation": "KY",
                  "textX": 10,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Kentucky</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M463.2,550.0 L463.0,549.4 L463.7,550.0 Z M464.3,549.9 L466.4,547.4 L466.3,544.9 L467.9,542.4 L471.4,543.6 L471.3,540.2 L473.9,539.3 L474.3,536.0 L475.4,534.6 L481.2,534.9 L484.5,534.0 L487.9,531.3 L489.9,532.8 L491.4,529.4 L494.1,526.5 L493.7,524.7 L498.6,523.5 L498.2,520.4 L501.1,520.0 L503.4,522.6 L510.7,523.8 L513.7,521.9 L516.5,524.8 L516.5,524.8 L516.5,524.8 L516.5,524.8 L516.6,527.5 L519.9,531.7 L522.7,532.8 L518.0,537.3 L514.6,542.0 L510.5,544.0 L510.1,544.3 L487.3,546.3 L477.0,547.4 L475.4,549.0 Z M516.5,524.8 L516.5,524.8 L516.5,524.8 L516.5,524.8 Z"
              },
              {
                  "enable": true,
                  "name": "West Virginia",
                  "abbreviation": "WV",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>West Virginia</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M516.5,524.8 L516.5,524.8 L518.5,524.2 L519.8,518.4 L521.2,519.5 L523.6,513.7 L525.6,513.4 L527.9,510.7 L528.9,500.2 L530.4,509.3 L538.4,507.9 L539.2,513.0 L543.9,507.7 L546.4,508.3 L548.7,506.1 L551.0,506.6 L552.4,509.2 L552.0,511.2 L547.7,508.9 L547.6,511.8 L544.7,516.3 L543.8,515.8 L542.1,520.4 L539.2,519.3 L538.6,522.6 L535.7,529.1 L536.0,530.9 L529.1,534.8 L524.3,535.1 L522.7,532.8 L519.9,531.7 L516.6,527.5 L516.5,524.8 L516.5,524.8 Z"
              },
              {
                  "enable": true,
                  "name": "District of Columbia",
                  "abbreviation": "DC",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>District of Columbia</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M559.0,513.2 L558.9,512.7 L558.4,512.3 L558.2,512.3 L558.0,512.1 L559.7,512.2 Z"
              },
              {
                  "enable": true,
                  "name": "Ontario",
                  "abbreviation": "ON",
                  "textX": -5,
                  "textY": -10,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Ontario</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M517.5,395.9 L515.6,393.8 L516.6,390.8 L516.8,391.9 Z M564.2,445.8 L563.3,447.4 L562.2,448.6 L558.6,450.8 L555.8,455.3 L553.1,458.1 L550.4,459.2 L548.1,462.4 L543.9,462.5 L533.7,466.8 L531.3,469.0 L529.7,472.6 L533.2,473.4 L535.0,472.2 L535.2,473.2 L535.2,473.9 L535.3,473.9 L536.5,475.3 L536.4,475.3 L527.6,478.5 L525.6,481.1 L519.3,481.3 L516.3,485.6 L510.9,488.9 L507.2,489.1 L507.2,487.1 L507.2,486.7 L507.3,486.7 L511.8,485.7 L510.0,483.7 L510.8,482.7 L511.0,478.9 L515.4,474.5 L514.2,467.5 L516.7,461.8 L515.6,458.1 L512.7,455.7 L515.5,455.4 L516.2,457.8 L518.4,457.8 L519.2,461.5 L520.2,460.0 L525.3,461.7 L527.4,458.0 L524.1,455.1 L524.3,453.1 L522.1,452.9 L518.2,448.0 L515.3,448.4 L511.8,447.0 L502.3,447.9 L494.2,447.3 L494.0,445.5 L491.4,446.5 L490.5,442.3 L488.8,441.4 L489.7,438.1 L486.3,435.2 L486.5,431.6 L481.0,432.5 L478.5,430.6 L475.4,424.7 L469.6,425.2 L462.9,423.6 L467.5,425.6 L465.0,425.9 L461.1,428.9 L462.7,426.7 L461.5,425.2 L460.3,430.1 L459.6,428.2 L457.0,429.7 L456.4,433.0 L454.8,434.4 L450.7,433.5 L446.5,433.9 L445.5,432.7 L442.2,434.8 L437.9,432.0 L435.6,433.1 L433.7,430.1 L429.5,429.2 L426.2,430.5 L419.7,427.6 L418.8,422.7 L416.6,421.9 L416.3,386.4 L425.0,377.4 L438.7,359.6 L452.0,342.5 L458.0,346.3 L460.7,350.3 L472.3,353.8 L474.1,355.5 L479.2,356.8 L483.2,355.4 L484.9,356.0 L493.5,356.2 L494.3,359.1 L493.8,365.5 L496.3,369.6 L497.2,375.1 L496.6,378.4 L502.0,382.9 L503.9,386.3 L506.4,387.0 L509.3,389.5 L511.0,393.0 L513.2,393.2 L517.6,396.1 L523.8,430.1 L525.3,434.8 L529.5,439.7 L531.7,441.3 L539.2,441.4 L544.8,444.3 L545.8,443.2 L547.4,445.9 L553.2,446.5 L556.9,443.8 L561.1,442.0 L563.1,442.4 Z M504.3,451.0 L507.6,448.7 L509.7,448.7 L512.6,450.7 L511.4,453.1 L504.9,451.4 L499.2,451.3 L503.8,449.6 Z"
              },
              {
                  "enable": true,
                  "name": "Québec",
                  "abbreviation": "QC",
                  "textX": -20,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Québec</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M597.8,320.6 L600.1,325.1 L602.5,324.5 L602.0,326.8 L602.9,330.1 L601.9,332.1 L601.0,333.8 L594.2,332.7 L591.6,336.2 L590.1,334.7 L584.1,333.2 L585.7,338.0 L580.5,336.1 L583.5,338.8 L583.3,341.6 L581.6,340.9 L580.7,343.1 L582.1,345.2 L581.6,347.1 L586.0,350.8 L589.0,351.5 L589.5,355.0 L587.1,355.5 L588.3,357.7 L591.6,358.8 L593.0,354.3 L596.2,361.4 L598.9,363.0 L601.7,361.6 L604.7,364.1 L607.2,363.3 L609.3,364.4 L610.3,362.5 L607.8,352.5 L610.6,350.8 L612.3,351.4 L608.9,354.9 L611.2,355.6 L612.6,358.7 L651.8,342.6 L654.3,348.0 L650.6,349.0 L647.8,352.0 L645.0,356.8 L645.7,358.5 L643.9,361.1 L641.1,367.3 L636.7,368.7 L631.9,372.3 L630.5,371.4 L618.2,375.2 L615.7,376.6 L609.2,378.3 L604.5,381.4 L602.2,381.4 L599.1,387.1 L599.2,392.4 L595.0,394.2 L594.7,396.1 L592.3,397.6 L590.1,401.5 L589.0,406.7 L587.6,409.0 L586.2,416.1 L584.6,417.1 L584.0,420.7 L581.0,425.3 L585.5,421.4 L587.6,415.9 L591.8,406.6 L596.0,400.9 L604.7,392.9 L610.9,389.2 L617.9,388.6 L621.5,390.9 L621.5,394.7 L616.0,401.1 L612.2,400.0 L611.4,401.7 L609.9,402.6 L606.9,404.3 L603.6,406.6 L601.9,405.9 L597.1,408.2 L598.2,411.8 L594.5,415.8 L592.7,414.7 L589.9,423.3 L590.0,433.6 L588.5,435.7 L587.9,439.3 L586.5,439.1 L586.5,439.1 L584.9,439.7 L584.4,442.7 L576.2,445.0 L571.7,446.2 L562.3,448.6 L562.2,448.6 L567.8,443.1 L564.2,445.8 L563.1,442.4 L561.1,442.0 L556.9,443.8 L553.2,446.5 L547.4,445.9 L545.8,443.2 L544.8,444.3 L539.2,441.4 L531.7,441.3 L529.5,439.7 L525.3,434.8 L523.8,430.1 L517.6,396.1 L519.0,397.4 L517.5,395.9 L516.8,391.9 L516.6,390.8 L517.3,388.6 L519.9,390.3 L520.8,392.5 L520.9,388.5 L519.1,387.2 L521.2,383.2 L521.3,380.6 L517.0,374.3 L516.5,370.6 L515.2,369.5 L515.1,364.1 L512.3,362.8 L509.1,358.5 L516.6,353.1 L519.7,349.8 L522.8,344.9 L524.5,340.2 L523.8,332.7 L522.2,327.7 L517.9,321.1 L514.4,318.4 L511.7,317.7 L508.1,315.2 L507.8,312.8 L511.0,307.9 L510.2,303.7 L512.7,301.9 L512.5,299.7 L508.9,295.7 L509.7,294.2 L505.7,291.4 L507.1,288.7 L506.4,284.7 L507.6,284.1 L503.9,280.3 L502.7,275.9 L505.4,272.1 L508.1,272.0 L515.7,273.5 L517.0,272.6 L520.2,273.7 L524.8,268.9 L528.7,271.3 L531.1,271.4 L531.6,273.0 L534.4,273.4 L534.3,274.9 L537.3,275.1 L536.7,277.7 L540.2,280.0 L545.3,280.0 L545.7,279.0 L548.5,281.2 L549.8,278.1 L551.5,280.8 L550.1,284.3 L552.2,287.1 L552.1,290.0 L553.5,290.8 L554.9,296.7 L557.2,296.8 L555.9,298.4 L557.1,300.7 L554.9,302.7 L556.2,304.3 L558.1,300.3 L560.6,299.3 L563.3,300.1 L565.0,302.2 L568.8,302.5 L568.9,305.5 L571.8,300.6 L573.1,299.6 L573.6,295.9 L575.3,296.2 L576.7,292.3 L575.5,290.5 L577.4,289.7 L574.9,285.4 L576.5,282.0 L576.2,277.7 L578.0,277.7 L578.0,278.0 L578.1,278.4 L578.2,279.7 L578.9,285.9 L581.5,285.4 L581.7,288.1 L583.5,291.0 L585.8,292.8 L587.5,290.7 L589.1,291.9 L586.6,293.3 L588.5,294.9 L586.5,299.0 L589.9,302.5 L592.2,302.9 L594.1,311.0 L593.4,313.5 L595.7,315.3 L594.2,316.0 L596.3,319.4 L599.6,318.8 Z M570.7,435.4 L573.0,433.6 L577.7,427.2 L578.7,427.3 L580.6,425.7 L577.4,427.0 L573.5,432.2 L571.1,433.7 Z M577.5,278.0 L577.5,278.0 L577.5,278.0 L577.5,278.0 Z M577.5,278.0 L577.5,278.0 L577.5,278.0 L577.5,278.0 Z M632.4,383.4 L622.9,383.6 L619.8,381.6 L616.2,381.5 L617.5,379.4 L622.6,378.8 L628.7,379.0 L633.7,379.8 L635.7,381.8 Z"
              },
              {
                  "enable": true,
                  "name": "New Brunswick",
                  "abbreviation": "NB",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>New Brunswick</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M631.0,419.1 L629.0,419.1 L628.5,422.3 L622.1,429.0 L616.0,432.6 L613.6,432.2 L611.3,431.8 L610.5,428.6 L608.6,428.6 L607.5,427.9 L603.6,415.6 L600.1,413.5 L595.8,416.4 L594.5,415.8 L598.2,411.8 L597.1,408.2 L601.9,405.9 L603.6,406.6 L606.9,404.3 L609.6,402.5 L609.9,402.6 L613.8,402.9 L615.8,404.7 L618.0,402.4 L621.7,401.4 L620.7,408.1 L619.5,409.7 L623.0,408.5 L623.2,410.6 L628.0,415.9 L633.3,415.2 L632.0,417.1 L631.3,417.6 Z"
              },
              {
                  "enable": true,
                  "name": "Nova Scotia",
                  "abbreviation": "NS",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Nova Scotia</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M631.0,419.1 L631.3,417.6 L632.0,417.1 L638.8,416.5 L643.7,416.7 L646.3,412.7 L647.2,414.4 L650.1,413.5 L651.2,414.0 L648.3,410.3 L649.6,405.3 L650.6,398.5 L652.0,398.1 L653.8,401.8 L653.1,410.4 L654.9,411.4 L655.9,407.7 L653.6,409.1 L655.4,404.3 L659.1,404.5 L659.9,405.9 L657.3,411.0 L654.2,413.8 L651.6,414.2 L654.5,415.5 L654.2,417.0 L650.5,418.9 L648.8,421.7 L643.2,427.1 L639.7,428.5 L640.6,430.3 L635.1,431.3 L635.9,433.9 L634.0,439.6 L631.3,443.3 L629.0,444.8 L626.7,442.2 L625.5,443.5 L623.7,440.4 L623.6,435.2 L629.4,427.2 L632.2,424.2 L632.8,426.3 L637.0,421.6 L628.2,424.5 Z"
              },
              {
                  "enable": true,
                  "name": "Newfoundland and Labrador",
                  "abbreviation": "NL",
                  "textX": -20,
                  "textY": 5,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Newfoundland and Labrador</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M578.2,276.8 L578.2,277.3 L578.0,277.5 L578.0,277.0 Z M602.9,330.1 L602.0,326.8 L602.5,324.5 L600.1,325.1 L599.2,321.9 L597.8,320.6 L599.6,318.8 L596.3,319.4 L594.2,316.0 L595.7,315.3 L593.4,313.5 L594.1,311.0 L592.2,302.9 L589.9,302.5 L586.5,299.0 L588.5,294.9 L586.6,293.3 L589.1,291.9 L587.5,290.7 L585.8,292.8 L583.5,291.0 L581.7,288.1 L581.5,285.4 L578.9,285.9 L578.3,279.7 L578.2,279.7 L576.5,278.7 L577.5,278.0 L577.5,278.0 L577.5,278.0 L577.5,278.0 L578.1,278.4 L581.1,280.3 L582.3,283.3 L584.0,283.5 L588.4,287.8 L592.9,291.1 L591.4,293.9 L594.9,292.2 L595.7,295.7 L596.9,295.3 L600.3,297.8 L601.6,299.9 L603.8,300.2 L602.7,303.5 L606.7,303.5 L607.4,307.0 L608.6,308.4 L605.2,307.7 L605.6,309.7 L610.3,309.7 L605.9,310.8 L605.6,311.8 L609.4,310.9 L607.2,313.6 L612.0,312.2 L613.4,315.3 L617.8,314.5 L617.4,315.9 L619.9,317.5 L619.0,322.6 L620.8,318.7 L622.6,317.4 L623.4,319.6 L627.5,317.3 L629.4,320.0 L635.8,318.5 L640.0,319.3 L638.3,321.5 L635.5,323.0 L634.5,326.9 L630.5,331.2 L627.3,333.3 L628.0,338.5 L629.6,335.4 L633.5,331.2 L633.5,328.6 L637.0,325.3 L635.8,324.2 L640.5,322.8 L644.1,326.2 L642.4,328.3 L647.5,324.1 L647.3,325.4 L652.9,325.1 L654.5,328.2 L653.4,330.3 L655.0,330.5 L656.8,332.9 L654.5,335.1 L658.2,334.5 L657.7,336.0 L659.5,337.7 L658.9,340.1 L654.3,348.0 L651.8,342.6 L612.6,358.7 L611.2,355.6 L608.9,354.9 L612.3,351.4 L610.6,350.8 L607.8,352.5 L610.3,362.5 L609.3,364.4 L607.2,363.3 L604.7,364.1 L601.7,361.6 L598.9,363.0 L596.2,361.4 L593.0,354.3 L591.6,358.8 L588.3,357.7 L587.1,355.5 L589.5,355.0 L589.0,351.5 L586.0,350.8 L581.6,347.1 L582.1,345.2 L580.7,343.1 L581.6,340.9 L583.3,341.6 L583.5,338.8 L580.5,336.1 L585.7,338.0 L584.1,333.2 L590.1,334.7 L591.6,336.2 L594.2,332.7 L601.0,333.8 L603.1,332.9 L601.9,332.1 L601.6,331.9 Z M578.0,277.7 L579.0,278.0 L578.0,278.0 L577.5,278.0 L577.5,278.0 Z M577.5,278.0 L577.5,278.0 L577.5,278.0 L577.5,278.0 L577.5,278.0 L577.5,278.0 L577.5,278.0 Z M670.3,357.6 L667.8,361.2 L669.8,362.3 L674.2,361.7 L674.8,363.5 L677.2,361.5 L678.2,358.0 L679.2,360.3 L680.9,357.4 L685.6,357.8 L684.1,361.5 L685.9,365.3 L688.4,364.9 L691.3,362.2 L691.3,365.1 L689.6,367.2 L690.2,373.0 L692.8,373.6 L692.3,368.4 L694.2,366.5 L694.2,371.9 L695.4,373.4 L696.2,369.0 L698.6,370.8 L698.5,373.7 L700.0,378.4 L697.0,382.0 L694.4,377.1 L693.0,381.8 L691.8,381.5 L691.4,376.0 L688.7,372.6 L687.4,372.4 L687.5,376.7 L685.4,378.6 L685.0,384.4 L680.7,386.7 L680.5,384.9 L682.6,383.1 L682.8,378.0 L680.8,377.3 L681.4,379.9 L678.5,381.5 L679.0,379.8 L676.2,380.5 L672.3,383.5 L664.2,385.3 L658.0,389.6 L654.9,387.4 L658.6,378.9 L656.5,379.2 L653.4,381.4 L654.6,378.9 L656.5,378.7 L656.0,372.9 L658.7,373.5 L656.1,369.5 L657.7,367.8 L656.5,366.3 L656.1,355.5 L657.4,352.3 L656.9,347.9 L660.8,342.6 L661.0,344.0 L663.4,341.9 L663.4,345.1 L660.7,345.5 L664.9,348.2 L663.7,347.6 L662.4,360.1 L663.8,364.7 L665.4,357.2 Z"
              },
              {
                  "enable": true,
                  "name": "Manitoba",
                  "abbreviation": "MB",
                  "textX": -10,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Manitoba</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M374.9,424.8 L374.9,424.8 L375.3,353.9 L378.3,309.2 L415.1,310.2 L417.5,310.2 L418.0,317.3 L417.6,320.8 L419.7,324.0 L421.0,323.1 L426.9,323.6 L427.1,325.9 L429.1,330.7 L431.6,338.3 L430.1,342.6 L439.7,338.9 L442.2,339.1 L446.8,341.5 L452.0,342.5 L438.7,359.6 L425.0,377.4 L416.3,386.4 L416.6,421.9 L416.5,425.8 L402.7,425.8 L401.7,425.7 Z"
              },
              {
                  "enable": true,
                  "name": "South Carolina",
                  "abbreviation": "SC",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>South Carolina</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M556.5,564.2 L553.9,567.1 L552.7,572.1 L546.9,578.9 L544.4,580.7 L540.4,586.1 L538.7,585.8 L537.0,582.0 L535.1,580.9 L533.5,576.9 L531.2,576.1 L529.3,573.1 L523.2,569.0 L520.1,564.5 L515.7,562.6 L517.3,559.4 L523.7,556.3 L533.7,555.3 L536.7,558.1 L545.9,556.8 Z"
              },
              {
                  "enable": true,
                  "name": "Yukon",
                  "abbreviation": "YT",
                  "textX": 0,
                  "textY": 0,
                  "color": "black",
                  "hoverColor": "grey",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Yukon</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M241.4,170.3 L235.3,183.1 L234.9,187.4 L232.8,191.3 L241.6,195.6 L241.4,200.9 L239.3,203.2 L239.3,207.8 L243.4,208.5 L242.6,210.5 L243.1,213.9 L238.8,217.5 L239.9,219.5 L237.8,221.8 L239.7,223.6 L240.6,226.1 L239.4,227.3 L242.6,228.1 L242.6,233.6 L244.8,236.8 L244.8,240.5 L242.7,241.6 L244.1,245.1 L242.5,247.1 L243.9,252.1 L242.6,255.9 L245.5,257.0 L246.6,262.5 L249.9,266.3 L248.7,273.8 L253.1,275.2 L254.0,274.4 L256.6,276.5 L260.9,275.9 L259.8,278.8 L261.7,287.2 L185.0,255.7 L184.9,255.6 L186.4,252.2 L183.8,251.0 L181.2,251.4 L177.2,247.6 L228.0,153.5 L231.9,156.0 L234.2,158.6 L236.2,164.7 L238.7,168.5 Z"
              },
              {
                  "enable": true,
                  "name": "Prince Edward Island",
                  "abbreviation": "PE",
                  "textX": 0,
                  "textY": 0,
                  "color": "#FFFFFF",
                  "hoverColor": "#E32F02",
                  "selectedColor": "#feb41c",
                  "url": "http://jsmaps.io/",
                  "text": "<h1>Prince Edward Island</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>",
                  "path": "M635.8,411.2 L643.9,407.5 L641.7,409.4 L641.9,413.5 L639.9,414.2 L638.5,412.5 L633.9,413.9 L632.6,412.5 L630.0,413.3 L629.3,411.5 L627.1,411.4 L628.5,406.7 L628.9,409.7 L632.6,411.8 L632.6,410.6 Z"
              }
            ],
            "pins": [
                //{
                //	"name": "Sample pin",
                //	"xPos": 259,
                //	"yPos": 344,
                //	"color": "#ffc90e",
                //	"hoverColor": "#E32F02",
                //	"selectedColor": "#feb41c",
                //	"url": "http://jsmaps.io",
                //	"text": "<h1>Sample pin</h1><br /><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>"
                //}
            ]
        }

        console.log('assignment ctrl start');

    }

})();