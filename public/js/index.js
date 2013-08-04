angular.module('index', [])
.directive('postRepeatMasonry', function() {
  return function(scope, element, attrs) {
    scope.$watch("events", function (value) {
      var center = $(".timeline_container").offset().left;
      var $e = $(element);
      $e.find('span.rightCorner').remove();
      $e.find('span.leftCorner').remove();
      var offset = $(element).offset();
      if(offset.left < center){
        $e.prepend('<span class="rightCorner"></span>'); 
      }
      else {

        $e.prepend('<span class="leftCorner"></span>');
      }
    });
  };
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
}

/*
function runMasonry() { 
  var $container = $('#container');
  $container.find('span.rightCorner').remove();
  $container.find('span.leftCorner').remove();
  $container.masonry({itemSelector : '.item'});
  $container.masonry('reloadItems');
  $container.find('.item').each(function() {
    var offset = $(this).offset();
    console.log(offset);
  });
}
*/
