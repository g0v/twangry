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
