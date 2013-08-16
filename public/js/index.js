angular.module('index', [])
.directive('onFinishRender', function($timeout) {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function () {
          scope.$emit('ngRepeatFinished');
        });
      }
    }
  }
});

function EventCtrl($scope, $http, $templateCache, $filter){
  $scope.method = 'GET';
  $scope.url = '/index.json'; 
  $http({method: $scope.method, url: $scope.url, cache: $templateCache}).
    success(function(data, status) {
      $scope.status = status;
      $scope.events = data.date;
      $scope.tags = data.tags;
      $scope.years = data.years;
    }).
    error(function(data, status) {
      $scope.data = data || "Request failed";
      $scope.status = status;
  });
  $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent){
    $("#spinner").hide();
    $("ul.cbp_tmtimeline").show();
  });
}

// jquery
$(document).ready(function(){
  $('form .textfield').click(function(){
    this.select();
  });
  $("#to-top").click(function(){
    var $body = (window.opera) ? (document.compatMode == "CSS1Compat" ? $('html') : $('body')) : $('html,body');
    $body.animate({
      scrollTop: 0
    }, 600);
  });
});
