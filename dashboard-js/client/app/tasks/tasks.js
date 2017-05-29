﻿(function() {
  'use strict';

  angular
    .module('dashboardJsApp')
    .config(tasksConfig);

  tasksConfig.$inject = ['$stateProvider'];
  function tasksConfig($stateProvider) {
    $stateProvider
      .state('tasks', {
        url: '/tasks',
        controller: 'TasksBaseCtrl',
        access: {
          requiresLogin: true
        },
        resolve: {
          tasksStateModel: function () {
            return {};
          },
          stateModel: function () {
            return {
              printTemplate: null,
              taskDefinition: null,
              strictTaskDefinition: null,
              userProcess: null
            }
          },
          processesList: [
            'processes',
            function (processes) {
              return processes.list();
            }
          ]
        }
      })
      .state('tasks.ecp', {
        url: '/ecp',
        access: {
          requiresLogin: true
        },
        views: {
          '@': {
            templateUrl: 'app/tasks/edsView.html',
            controller: 'edsViewCtrl'
          }
        },
        resolve: {
          unsignedDocsList: [
            'tasks',
            function (tasks) {
              return tasks.getUnsignedDocsList();
            }
          ]
        }
      })
      .state('tasks.typeof', {
        url: '/:type',
        access: {
          requiresLogin: true
        },
        views: {
          '@': {
            templateUrl: 'app/tasks/tasks.html',
            controller: 'TasksCtrl'
          }
        }
      })
      .state('tasks.typeof.view', {
        url: '/:id',
        templateUrl: 'app/tasks/taskView.html',
        controller: 'TaskViewCtrl',
        access: {
          requiresLogin: true
        },
        resolve: {
          taskData: [
            'tasks',
            '$stateParams',
            function(tasks, $stateParams) {
              var params = {
                nID_Task: $stateParams.id,
                bIncludeGroups: true,
                bIncludeStartForm: true,
                bIncludeAttachments: true,
                bIncludeProcessVariables: $stateParams.type === 'documents',
                bIncludeMessages: true
              };
              return tasks.getTaskData(params, false)
            }
          ],
          oTask: [
            'tasks',
            '$stateParams',
            'tasksStateModel',
            '$q',
            function (tasks, $stateParams, tasksStateModel, $q) {
              tasksStateModel.taskId = $stateParams.id;
              if ($stateParams.type == 'finished'){
                var defer = $q.defer();
                tasks.taskFormFromHistory($stateParams.id).then(function(response){
                  defer.resolve(JSON.parse(response).data[0]);
                }, defer.reject);
                return defer.promise;
              }
              else {
                return tasks.getTask($stateParams.id);
              }
            }
          ],
          taskForm: [
            'oTask',
            'tasks',
            '$q',
            function (oTask, tasks, $q) {
              var defer = $q.defer();
              if (oTask.endTime) {
                tasks.taskFormFromHistory(oTask.id).then(function (result) {
                  defer.resolve(JSON.parse(result).data[0].variables)
                }, defer.reject)
              } else {
                tasks.taskForm(oTask.id).then(function (result) {
                  defer.resolve(result.formProperties);
                }, defer.reject);
              }
              return defer.promise;
            }
          ],
          documentRights: [
            'oTask',
            'tasks',
            'taskForm',
            function (oTask, tasks, taskForm) {
            var searchResult = taskForm.filter(function (item) {
              return item.id === 'sKey_Step_Document';
            });
            if(searchResult.length !== 0) {
              return tasks.getDocumentStepRights(oTask.processInstanceId);
            } else {
              return false;
            }
            }
          ],
          documentLogins: [
            'oTask',
            'tasks',
            'documentRights',
            function (oTask, tasks, documentRights) {
              if(documentRights) {
                return tasks.getDocumentStepLogins(oTask.processInstanceId);
              }
            }
          ],
          processSubject: [
            'oTask',
            'tasks',
            'documentRights',
            'taskForm',
            function (oTask, tasks, documentRights) {
              // if(documentRights) {
                return tasks.getProcessSubject(oTask.processInstanceId);
              // }
            }
          ]
        }
      })
      .state('tasks.typeof.create', {
        url: '/create/:id',
        templateUrl: 'app/tasks/createTask.html',
        controller: 'createTask',
        access: {
          requiresLogin: true
        }
      });
  }
})();
