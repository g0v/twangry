<!DOCTYPE html>
<html lang="en"><!--
  	 
  	88888888888 d8b                        888 d8b                888888   d8888b  
  	    888     Y8P                        888 Y8P                   88b d88P  Y88b 
  	    888                                888                       888 Y88b
  	    888     888 88888b d88b     d88b   888 888 88888b     d88b   888   Y888b
  	    888     888 888  888  88b d8P  Y8b 888 888 888  88b d8P  Y8b 888      Y88b
  	    888     888 888  888  888 88888888 888 888 888  888 88888888 888        888 
  	    888     888 888  888  888 Y8b      888 888 888  888 Y8b      88P Y88b  d88P 
  	    888     888 888  888  888   Y8888  888 888 888  888   Y8888  888   Y8888P
  	                                                                d88P            
  	                                                              d88P             
  	                                                            888P              
  	 -->
  <head>
    <title>Timeline JS Example</title>
    <meta charset="utf-8">
    <meta name="description" content="TimelineJS example">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-touch-fullscreen" content="yes">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <link href="/css/other.css" media="all" rel="stylesheet" type="text/css" />
    <!-- HTML5 shim, for IE6-8 support of HTML elements--><!--[if lt IE 9]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
  </head>
</html>
<body>
  <!-- BEGIN Timeline Embed -->
  <div id="header">
    <div id="navbar">
      <ul>
        <li class="first"><a href="/">回到總表</a></li>
        <li><a href="http://zh.wikipedia.org/wiki/Template:%E5%8F%B0%E7%81%A3%E7%A4%BE%E6%9C%83%E9%81%8B%E5%8B%95" target="_blank">source: wikipedia</a></li>
        <li><a href="http://www.coolloud.org.tw/" target="_blank">source: 苦勞網</a></li>
        <li class="last"><a href="http://timeline.verite.co/" target="_blank">frontend: Timeline</a></li>
      </ul>
    </div>
    <h1>{title}</h1>
    <p class="mission">歷史事件時間軸</p>
  </div>
  <div id="timeline-embed"></div>
  <script type="text/javascript">
    var timeline_config = {
     width: "100%",
     height: "80%",
     source: 'example_json.json',
     hash_bookmark: true,
     start_zoom_adjust: -1,
     start_at_end: false,
     font: 'Merriweather-NewsCycle',
     lang: 'zh-tw',
     css: '/css/custom.css'
    }
  </script>
  <script type="text/javascript" src="/compiled/js/storyjs-embed.js"></script>
  <!-- END Timeline Embed-->
  <a href="https://github.com/jimyhuang/nodeprotest"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://s3.amazonaws.com/github/ribbons/forkme_right_red_aa0000.png" alt="Fork me on GitHub"></a>
</body>
