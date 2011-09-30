/* Author: Dean Brettle
 * Copyright 2011
 * Licensed under the terms of the AGPL3.
 */
as = {
  timeSinceAttemptStart: 0,
  timeSincePromptStart: 0,
  timeBetweenPrompts: 300000,
  attentionSpanMedian: 300000,
  attentionSpanMean: 300000,
  factor: 1.2,
  history: [],
  timeoutID: null,
  intervalID: null,
  
  start: function() {
      as.wait();
  },
  pause: function() {
      if (as.timeoutID) {
          window.clearTimeout(as.timeoutID);
          window.clearInterval(as.intervalID);          
      }
      as.timeoutID = null;
      as.intervalID = null;
      as.updateTimes();
  },
  updateTimes: function() {
      if (!as.startTime) {
          return;
      }
      var timeSinceStart = Date.now() - as.startTime;
      as.estimatedFocusTime = as.timeSinceAttemptStart + timeSinceStart/2.0;
      as.timeSincePromptStart += timeSinceStart;
      as.timeSinceAttemptStart += timeSinceStart;
      as.startTime = null;
  },
  calcNextPromptTime: function () {
      as.timeSincePromptStart = 0;
      as.timeBetweenPrompts = Math.min(3*as.attentionSpanMedian, -1.0*as.attentionSpanMedian*Math.log(1.0-Math.random()));
      as.wait();
  },
  wait: function() {
      if (as.timeoutID)
        return;
      var delay = as.timeBetweenPrompts - as.timeSincePromptStart;
      as.startTime = Date.now();
      as.timeoutID = window.setTimeout(as.playAudio, 10000 + delay);
      as.intervalID = window.setInterval(as.displayElapsedTime, 1000);
  },
  playAudio: function() {
      var audioPrompt;
      as.pause();
      if (!audioPrompt) {
          audioPrompt = $("#audioPrompt")[0];
          audioPrompt.addEventListener("ended", as.prompt);
      }
      audioPrompt.currentTime = 0.0;
      audioPrompt.play();      
  },
  promptPopup: function() {
      var popup = window.open('','promptPopup','height=200,width=150');
      var popupDoc = popup.document;
      popupDoc.write("<html><head><title>How's it going?</title></head><body>");
      popupDoc.write($("#promptContent").html());
      popupDoc.write('<script src="//ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js"></script>');
      popupDoc.write('<script>');
      popupDoc.write('$(function() {');
      popupDoc.write('var parent = window.parent;');
      popupDoc.write('$("#distracted").click(function() { window.opener.$("#distracted").click(); window.close(); });');
      popupDoc.write('$("#focused").click(function() { window.opener.$("#focused").click(); window.close(); });');
      popupDoc.write('});');
      popupDoc.write('</script></body></html>');
      popupDoc.close();
      popup.focus();
  },
  promptConfirm: function() {
      var focused = window.confirm("How's it going?");
      if (focused) {
          as.focused();
      } else {
          as.distracted();
      }
  },
  focused: function() {
      var mostRecent = as.history.slice(Math.max(-10, -1*as.history.length));
      mostRecent.push(as.estimatedFocusTime);
      var median = as.getMedian(mostRecent);
      var mean = as.getMean(mostRecent);
      as.attentionSpanMedian = Math.max(median, as.attentionSpanMedian);
      as.attentionSpanMean = Math.max(mean, as.attentionSpanMean);
      as.calcNextPromptTime();
      as.displayAttentionSpan();
  },
  distracted: function() {      
      as.history.push(as.estimatedFocusTime);
      var mostRecent = as.history.slice(Math.max(-10, -1*as.history.length));
      var median = as.getMedian(mostRecent);
      var mean = as.getMean(mostRecent);
      as.attentionSpanMedian = median;
      as.attentionSpanMean = mean;
      as.timeSinceAttemptStart = 0;
      as.calcNextPromptTime();
      as.displayAttentionSpan();
  },
  getMedian: function(arr) {
      var sortedArr = arr.slice(0).sort(function(a,b) {return a-b;});
      if (sortedArr.length % 2 == 1) {
          return sortedArr[(sortedArr.length - 1) / 2];
      } else {
          return (sortedArr[sortedArr.length / 2] + sortedArr[sortedArr.length / 2 - 1]) / 2.0;
      }
  },
  getMean: function(arr) {
      var sum = 0;
      arr.forEach(function(v) {sum += v});
      return 1.0 * sum / arr.length;
  },
  displayAttentionSpan: function() {
      $("#attentionSpanMins").html(Math.round(as.attentionSpanMean/600)/100);
  },
  displayElapsedTime: function() {
      $("#elapsedSecs").html(Math.round((as.timeSinceAttemptStart + (Date.now() - as.startTime))/1000));
  }
};

$(function() {
    as.timeBetweenPrompts = 5*60000;
    as.history.push(as.timeBetweenPrompts * Math.pow(1.1, 1));
    as.history.push(as.timeBetweenPrompts * Math.pow(1.1, -1));
    as.history.push(as.timeBetweenPrompts * Math.pow(1.1, 5));
    as.history.push(as.timeBetweenPrompts * Math.pow(1.1, -5));
    as.history.push(as.timeBetweenPrompts * Math.pow(1.1, 3));
    as.history.push(as.timeBetweenPrompts * Math.pow(1.1, -3));
    as.history.push(as.timeBetweenPrompts * Math.pow(1.1, 2));
    as.history.push(as.timeBetweenPrompts * Math.pow(1.1, -2));
    as.history.push(as.timeBetweenPrompts * Math.pow(1.1, 4));
    as.history.push(as.timeBetweenPrompts * Math.pow(1.1, -4));
    as.prompt = as.promptPopup;
    $("#running").change(function() {
        if ($(this).prop("checked")) {
            as.wait();            
        } else {
            as.pause();
        }
    });
    $("#promptMe").click(function() { as.playAudio(); });
    $("#distracted").click(function() { as.pause(); as.distracted(); });
    $("#focused").click(function() { as.pause(); as.focused(); });
    as.calcNextPromptTime();
    as.displayAttentionSpan();
    as.displayElapsedTime();
    as.pause();
});


