'use strict';

angular.module('dashboardJsApp')
  .factory('processes', function processes($http, $q) {
    var idToProcessMap = function (data) {
      var map = {};
      for (var i = 0; i < data.length; i++) {
          //"_test_dependence_form:2:87617"
          //var sID=data[i].id;
          var sKey=data[i].key;
          //var nAt=sID.indexOf("\:")
          //if(nAt)
          //sID=
          map[sKey] = data[i];
          console.log("sKey="+sKey);
        //map[data[i].id] = data[i];
      }
      return map;
    };

    var processesDefinitions;

    return {
      getUserProcesses: function () {

        return $http.get('/api/processes/getLoginBPs')
          .then(function (response) {
            return JSON.parse(response.data);
          });
      },

      list: function (callback) {
        var cb = callback || angular.noop;
        var deferred = $q.defer();

        if (processesDefinitions) {
          deferred.resolve(processesDefinitions);
        } else {
          var req = {
            method: 'GET',
            url: '/api/processes',
            cache: true,
            data: {}
          };

          $http(req).
            success(function (result) {
              processesDefinitions = idToProcessMap(JSON.parse(result).data);
              deferred.resolve(processesDefinitions);
              return cb();
            }).
            error(function (err) {
              deferred.reject(err);
              return cb(err);
            }.bind(this));

        }

        return deferred.promise;
      },

      getProcessName: function (processDefinitionId) {
        var sID=processDefinitionId;
        console.log("[getProcessName]sID(before)="+sID);
        if(sID!==null){//"_test_dependence_form:2:87617"
          var nAt=sID.indexOf("\:");
          if(nAt>=0){
            sID=sID.substr(0,nAt);
          }
        }
        console.log("[getProcessName]sID(after)="+sID);
        /*if (processesDefinitions && processesDefinitions[processDefinitionId]) {
          return processesDefinitions[processDefinitionId].name;
        } else {
          return processDefinitionId;
        }*/
        if (processesDefinitions && processesDefinitions[sID]) {
          return processesDefinitions[sID].name;
        } else {
          return sID+"("+processesDefinitions.length+")";
        }
      },

      getProcessDescription: function (processDefinitionId) {
        var sID=processDefinitionId;
        console.log("[getProcessDescription]sID(before)="+sID);
        if(sID!==null){//"_test_dependence_form:2:87617"
          var nAt=sID.indexOf("\:");
          if(nAt>=0){
            sID=sID.substr(0,nAt);
          }
        }
        console.log("[getProcessDescription]sID(after)="+sID);
        /*if (processesDefinitions && processesDefinitions[processDefinitionId]) {
          return processesDefinitions[processDefinitionId].description;
        } else {
          return processDefinitionId;ґ
        }*/
        if (processesDefinitions && processesDefinitions[sID]) {
          return processesDefinitions[sID].description;
        } else {
          return sID+"("+processesDefinitions.length+")";
        }
      }
    };
  });
