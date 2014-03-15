angular.module('index', ['firebase'])
.directive('onFinishRender', function($timeout) {
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
      if (scope.$last === true) {
      $timeout(function() {
        scope.$emit('ngRepeatFinished');
        });
      }
    }
  }
})
.directive('onKeyup', function() {
  return function(scope, element, attr) {
    element.bind("keyup", function() {
      scope.$apply(attr.onKeyup);
    });
  };
});
;

function EventCtrl($scope, $http, $templateCache, $filter, angularFire) {
  $scope.method = 'GET';
  $scope.url = '/index.json';
 
  $http({
    method: $scope.method,
    url: $scope.url,
    cache: $templateCache
  }).
  success(function(data, status) {
    $scope.status = status;
    $scope.events = data.date;
    $scope.tags = data.tags;
    $scope.years = data.years;
    $scope.filterLength = $scope.events.length;
    $scope.filterEvents = [];
    var year = '2013';
    var i = 0;
    for (i = 0; i < $scope.events.length; i++) {
      if($scope.events[i].startDate.match(year) || $scope.events[i].endDate.match(year)){
        $scope.filterEvents.push($scope.events[i]);
      }
    }
    $scope.filterLength = i;
  }).
  error(function(data, status) {
    $scope.data = data || "Request failed";
    $scope.status = status;
  });

  var closeItem = function ($elem) {
    $elem.removeClass('open');
  };

  var openItem = function ($elem) {
    closeItem($elem.siblings('.open'));
    $elem.addClass('open');
  };

  var openDelayTimer;

  $scope.tmlabelMouseEnter = function (e) {
    clearTimeout(openDelayTimer);
    openDelayTimer = setTimeout(function () {
      openItem($(e.currentTarget).parent('li'));
    }, 200);
  };

  $scope.tmlabelClick = function (e) {
    var $this = $(e.currentTarget);
    var $a = $this.find('h2 a');
    window.location = $a.attr('href');
  };

  $scope.plusSignClick = function (e) {
    clearTimeout(openDelayTimer);
    openItem($(e.currentTarget).parents('li'));
  };

  $scope.minusSignClick = function (e) {
    closeItem($(e.currentTarget).parents('li'));
  };
  
  $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
    $("#spinner").hide();
    $("ul.cbp_tmtimeline").show();
    $('.cbp_tmtime').find('span:visible:eq(1)').addClass('last-child');
  });
}



// jquery
$(document).ready(function() {
  $('form .textfield').click(function() {
    this.select();
  });
  $("#to-top").click(function() {
    var $body = (window.opera) ? (document.compatMode == "CSS1Compat" ? $('html') : $('body')) : $('html,body');
    $body.animate({
      scrollTop: 0
    },
    600);
  });
});


