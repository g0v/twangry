function EventCtrl($scope, $http, $templateCache){
  $scope.method = 'GET';
  $scope.url = 'http://test.jimmyhub.net/index.json'; 
  $http({method: $scope.method, url: $scope.url, cache: $templateCache}).
    success(function(data, status) {
      $scope.status = status;
      $scope.events = data;
    }).
    error(function(data, status) {
      $scope.data = data || "Request failed";
      $scope.status = status;
  });
}
angular.module('index', [])
.directive('postRepeatMasonry', function() {
  return function(scope, element, attrs) {
    if (scope.$last){
      console.log('last');
      runMasonry();
    }
  };
});

function runMasonry() { 
  $('#container').masonry({itemSelector : '.item',});
  var s = $('#container').find('.item');
  $.each(s,function(i,obj) {
    var posLeft = $(obj).css("left");
    $(obj).addClass('borderclass');
    if(posLeft == "0px") {
      html = "<span class='rightCorner'></span>";
      $(obj).prepend(html); 
    } else {
      html = "<span class='leftCorner'></span>";
      $(obj).prepend(html);
    }
  });
}
