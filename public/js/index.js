angular.module('index', [])
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

function EventCtrl($scope, $http, $templateCache, $filter) {
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
    $scope.filterEvents = $scope.events;
  }).
  error(function(data, status) {
    $scope.data = data || "Request failed";
    $scope.status = status;
  });

  $scope.TagFilter = function($filter) {
    $scope.filterEvents = [];
    if ($filter == '' || typeof($filter) == "undefined") {
      $scope.filterLength = $scope.events.length;
      $scope.filterEvents = $scope.events;
    }
    else {
      $matchcount = 0;
      for (i = 0; i < $scope.events.length; i++) {
        for (j = 0; j < $scope.events[i].tag.length; j++) {
          if ($scope.events[i].tag[j].match($filter)) {
            $matchcount = $matchcount + 1;
            $scope.filterEvents.push($scope.events[i]);
          }
        }
      }
      $scope.filterLength = $matchcount;
    }
  }

  $scope.YearFilter = function($filter) {
    $scope.filterEvents = [];
    if ($filter == '' || typeof($filter) == "undefined") {
      $scope.filterLength = $scope.events.length;
      $scope.filterEvents = $scope.events;
    }
    else {
      $matchcount = 0;
      for (i = 0; i < $scope.events.length; i++) {
        if($scope.events[i].startDate.match($filter) || $scope.events[i].endDate.match($filter)){
          $scope.filterEvents.push($scope.events[i]);
        }
      }
      $scope.filterLength = $matchcount;
    }
  }

  $scope.QueryFilter = function($filter) {
    $scope.filterEvents = [];
    if ($filter == '' || typeof($filter) == "undefined") {
      $scope.filterLength = $scope.events.length;
      $scope.filterEvents = $scope.events;
    }
    else {
      $matchcount = 0;
      for (i = 0; i < $scope.events.length; i++) {
        if($scope.events[i].headline.match($filter) || $scope.events[i].text.match($filter)){
          $scope.filterEvents.push($scope.events[i]);
        }
      }
      $scope.filterLength = $matchcount;
    }
  }

  $scope.filterByTag = function() {
    return $scope.filterEvents;
  }

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

