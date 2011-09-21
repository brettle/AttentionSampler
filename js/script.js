/* Author: Dean Brettle
 * Copyright 2011
 * Licensed under the terms of the AGPL3.
 */
as = {
  interval: 60000,
  factor: 1.2,
  efficiency: 0.0,
  history: [],
  focusedCount: 0,
  start: function() {
      as.startTime = Date.now();
      as.wait();
  },
  wait: function() {
      as.timeSinceStart = Date.now() - as.startTime;
      var delay = Math.min(3*as.interval, -1.0*as.interval*Math.log(1.0-Math.random()));
      window.setTimeout(as.playAudio, 10000 + delay);
  },
  playAudio: function() {
      var audioPrompt;
      if (!audioPrompt) {
          audioPrompt = $("#audioPrompt")[0];
          audioPrompt.addEventListener("ended", as.prompt);
      }
      audioPrompt.currentTime = 0.0;
      audioPrompt.play();      
  },
  prompt: function() {
      var timeSinceStart = Date.now() - as.startTime;
      var estimatedFocusTime = (timeSinceStart + as.timeSinceStart)/2.0;
      as.history.push(estimatedFocusTime);
      var interval = getMedian(as.history.slice(Math.max(-10, -1*as.history.length)));
      var focused = window.confirm("How's it going?");
      if (focused) {
          interval = Math.max(interval, as.interval);
          as.history.pop();
          as.wait();
      } else {
          as.interval = interval;
          as.start();
      }
      as.displayInterval(interval);
      function getMedian(arr) {
          var sortedArr = arr.slice(0).sort(function(a,b) {return a-b;});
          if (sortedArr.length % 2 == 1) {
              return sortedArr[(sortedArr.length - 1) / 2];
          } else {
              return (sortedArr[sortedArr.length / 2] + sortedArr[sortedArr.length / 2 - 1]) / 2.0;
          }
      }
  },
  displayInterval: function(interval) {
      $("#attentionSpan").html(Math.round(interval/600)/100);
  }
};

$(function() {
    as.displayInterval(60000);
    as.start(); 
});


