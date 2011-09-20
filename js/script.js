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
      window.setTimeout(as.playAudio, 10000 + as.interval * Math.random());
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
      var focused = window.confirm("How's it going?");
      if (focused) {
          as.interval = as.interval * as.factor;
      }
      else {
          as.interval = as.interval / as.factor;
      }
      as.history.push(focused);
      as.focusedCount += focused;
      as.efficiency = 1.0*as.focusedCount/as.history.length;
      as.displayStats();
      as.start();
  },
  displayStats: function() {
      $("#efficiency").html(Math.round(as.efficiency*100));
      $("#samples").html(as.history.length);      
  }
};

$(function() {
    as.displayStats();
    as.start(); 
});


