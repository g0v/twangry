angular.module('index', [])
.directive('postRepeatMasonry', function() {
  return function(scope, element, attrs) {
    scope.$watch("events", function (value) {
      var center = $(".timeline_container").offset().left;
      var $e = $(element);
      var $c = $e.find('.content');
      var $t = $e.find('.time');
      if($t.text().match(/-[^0-9]/)){
        var cut = $t.text().replace('-','');
        $t.html(cut);
      }
      $c.readmore({maxHeight:60});
      /* still buggy
      $e.find('span.rightCorner').remove();
      $e.find('span.leftCorner').remove();
      var offset = $(element).offset();
      if(offset.left < center){
        $e.prepend('<span class="rightCorner"></span>'); 
      }
      else {
        $e.prepend('<span class="leftCorner"></span>');
      }
      */
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

// jquery
$(document).ready(function(){
  $('form .textfield').click(function(){
    this.select();
  });
});
