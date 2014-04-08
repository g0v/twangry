<?php
$c = file_get_contents('http://ecfa.speaking.tw/json.php?max=500');
$j = json_decode($c);
$date = $tmp = array();
$key = null;
foreach($j as $i){
  $o = new stdClass();
  $a = new stdClass();
  if(preg_match('/(jpg|png|gif|jpeg)$/i', $i->picture)){
    if(strstr($i->link, 'facebook')){
      $a->media = $i->picture;
      $a->credit = '<a href="'.$i->link.'">Facebook來源</a>';
    }
    else{
      $a->media = $i->link;
      $a->credit = '<a href="'.$i->post.'">Facebook來源</a>';
    }
    $a->caption = '';
    $o->asset = $a;
  }
  $o->startDate = date('Y,m,d,H,i,s', strtotime($i->created_time));
  $o->headline = $i->title;
  $o->text = $i->message .' [<a href="'.$i->link.'">source</a>]';
  $key = md5($i->link);
  $tmp[$key] = $o;
  $a = $o = null;
}
foreach($tmp as $t){
  $date[] = $t;
}
$timeline = new stdClass();
$timeline->headline = '服貿跑馬燈';
$timeline->type = 'default';
$timeline->startDate = '2014,03';
$timeline->text = '318青年佔領立法院是指在2014年3月18日晚間6時，臺灣反對《兩岸服務貿易協議》未經逐條審查的抗議群眾在立法院外舉行「守護民主之夜」。之後學生先是趁著警衛不備而進入立法院內靜坐抗議，接著在9時突破警方的封鎖線並且佔領立法院議場。進入議場後學生開始發表自己的主張，並且為了防止警方驅離而開始用椅子堵住議場門口。其中學生代表有國立清華大學學生陳為廷以及臺灣大學學生同時是黑色島國青年陣線的林飛帆等人，在參與人士部份警方估計大約有200人、而學生團體則表示有500人。這次事件也是中華民國歷史上，首次立法院的國會議場遭到大批學生夜宿佔領。';
$a = new stdClass();
$a->media = 'http://upload.wikimedia.org/wikipedia/zh/2/2d/318%E9%9D%92%E5%B9%B4%E4%BD%94%E9%A0%98%E7%AB%8B%E6%B3%95%E9%99%A2.jpg';
$a->credit = '<a href="http://zh.wikipedia.org/wiki/318%E9%9D%92%E5%B9%B4%E4%BD%94%E9%A0%98%E7%AB%8B%E6%B3%95%E9%99%A2">Wikipedia</a>';
$a->caption = '318青年佔領立法院照片';
$timeline->asset = $a;
$timeline->date = $date;
$t = new stdClass();
$t->timeline = $timeline;
echo json_encode($t);
