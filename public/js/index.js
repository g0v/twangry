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

function SubscribeCtrl($scope, $http, $templateCache, $filter, angularFire){
  $scope.addEmail = function (event) {
    if(typeof($scope.email) !== 'undefined' && typeof(event.headline) !== 'undefined'){
      var encodeTitle = encodeURIComponent(event.headline);
      var emailAddress = $scope.email;
      //query value
      var firebaseQuery='https://twangrytest.firebaseio.com/subscribe/'+encodeTitle;
      var fb = new Firebase(firebaseQuery);
      fb.once('value', function(snapshot) {
        // doesn't have this entry
        if(snapshot.val() == null) {
          fb.set({title:encodeTitle, email:emailAddress, revision:0}, function(error) {
            if (error) {
              fb.off();
            } 
            else {
            // after update firebase, obtain wikipedia revision number for further usage
              var targeturl='/updateWikiRev/'+encodeTitle;
              $http({
                method: 'GET',
                url: targeturl,
                data: encodeTitle,
                cache: $templateCache
              })
              .success(function(data, status) {
                console.log("updateWikiRev success");  
              })
              .error(function(data, status) {
                console.log("updateWikiRev error");
              });			 
              fb.off();
            }
          });
        }
        else{
          // already have entry, just add email
          var isMatched = snapshot.child('email').val().match(emailAddress);
          if(isMatched == null){
            var newEmailValue = snapshot.child('email').val()+','+emailAddress;
            var rev = snapshot.child('revision').val();
            fb.set({title:encodeTitle, email:newEmailValue, revision:rev}, function(error) {
              if(error){
                fb.off();
              }
              else {
                fb.off();
              }
            });
          }
        }
      }); 
    }
  };
  
  $scope.UpdateSubscribe = function (e) {
    var eventtitle=$('#bookId').text();
    var encodeTitle=JSON.stringify(encodeURIComponent(eventtitle));
    var targeturl='/updateSubscribe/'+encodeTitle;
      
    $http({
      method: 'GET',
      url: targeturl,
      data: encodeTitle,
      cache: $templateCache
    }).
    success(function(data, status) {
      console.log("updateSubscribe success"); 
    }).
    error(function(data, status) {
      console.log("updateSubscribe error");
    });		  
  }
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


