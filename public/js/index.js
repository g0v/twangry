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
    $(".cbp_tmlabel").click(function(){
      var $a = $(this).find("h2").find("a");
      var href = $a.attr('href');
      window.location = href;
    });
    $(".cbp_tmlabel.collapsed").hover(function(){
      var $p = $(this).find("p.content:hidden");
      $p.show();
      var $icon = $(this).prev();
      $icon.removeClass("icon-plus-sign");
      $icon.addClass("icon-minus-sign");
    },function(){
      if($(this).hasClass('collapsed')){
        var $p = $(this).find("p.content");
        $p.hide();
        var $icon = $(this).prev();
        $icon.removeClass("icon-minus-sign");
        $icon.addClass("icon-plus-sign");
      }
    });
    $(".cbp_tmicon").click(function(){
      var $next = $(this).next();
      var $p = $next.find("p.content");
      if($(this).hasClass('icon-minus-sign')){
        $p.slideUp();
        $(this).addClass("icon-plus-sign");
        $(this).removeClass("icon-minus-sign");
        $next.addClass('collapsed');
      }
      else{
        $p.slideDown();
        $(this).addClass("icon-minus-sign");
        $(this).removeClass("icon-plus-sign");
        $next.removeClass('collapsed');
      }
    });
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
