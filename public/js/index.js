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
  
  $scope.addEmail = function (e) {
	var eventtitle=$('#bookId').text();
	var encodeTitle=encodeURIComponent(eventtitle);
	var emailAddress=String($scope.email);
	
	if(emailAddress!='undefined'){
      //query value
	  var firebaseQuery='https://twangrytest.firebaseio.com/subscribe/'+encodeTitle;
	  var ref= new Firebase(firebaseQuery);
	  ref.once('value', function(snapshot) {
	    if(snapshot.val()==null) {	
		  ref.set({title:encodeTitle, email:emailAddress, revision:0}, function(error) {
	        if (error) {
			  ref.off();	 
	  		} 
			else {
	  		  var targeturl='/updateWikiRev/'+encodeTitle;
	  	   	  $http({
	  	   	    method: 'GET',
	  	   	    url: targeturl,
	  	   		data: encodeTitle,
	  	   	    cache: $templateCache
	  	   	  }).
	  	   	  success(function(data, status) {
				console.log("updateWikiRev success");  
	  	   	  }).
	  	   	  error(function(data, status) {
	  	   	    console.log("updateWikiRev error");
	  	   	  });			 
			  ref.off();	 		 
	       	}
		  });
		}
		else{
		  var isMatched=snapshot.child('email').val().match(emailAddress);
		  if(isMatched==null){
		    var newEmailValue=snapshot.child('email').val()+','+emailAddress;
			var rev=snapshot.child('revision').val();
			ref.set({title:encodeTitle, email:newEmailValue, revision:rev}, function(error) {
		      if(error) {	
			    ref.off();	 
		  	  } 
			  else {	     
				ref.off();	 
		      }
			});
		  }
				/*
				//may need to change transaction later 
				var oldvalue=snapshot.child('email').val();
				ref.transaction( function(oldvalue) {
				  var newEmailValue=oldvalue+','+emailAddress;
				  var newValue={title:encodeTitle,email:newEmailValue};
				  console.log("email address update from %s to %s",oldvalue, newEmailValue);
				  return newValue;
				}, function(error, committed, snapshot) {
				  console.log('Was there an error? ' + error);
				  console.log('Did we commit the transaction? ' + committed);
				  console.log('The final value is: ' + snapshot.child('email').val());
				  ref.off();
				});
				*/
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

	$(document).on("click", ".openSubscribe", function () {
	     var $myBookId = $(this).parents('div');
		 var $a = $myBookId.find('h2 a');
	     var title=String($a.attr('href'));
		 if(title.indexOf('/')>= 0)
		   title=title.split("/").pop();
		 console.log(title);
		 $(".modal-header h2").text(title);  
	});
