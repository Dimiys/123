angular.module('app').factory('$exceptionHandler', function($log, SimpleErrorsFactory) {
  return function(exception, cause) {
    exception.message += ' (caused by "' + cause + '")';
    $log.error(exception);

    SimpleErrorsFactory.push({
      type: "danger",
      text:  exception.message
    });
  };
});
