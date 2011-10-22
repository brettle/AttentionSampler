/* Author: Dean Brettle
 * Copyright 2011
 * Licensed under the terms of the AGPL3.
 */

var Brettle = Brettle || {};
Brettle.AttentionSampler = function() {
    $.extend(this, {
        timeSinceAttemptStart: 0,
        timeSincePromptStart: 0,
        timeBetweenPrompts: 300000,
        factor: 1.2,
        history: [],
        timeoutID: null,
        intervalID: null,
        prompting: false
    });
};
$.extend(Brettle.AttentionSampler.prototype, {
    start: function() {
        this.wait();
    },
    pause: function() {
        if (this.timeoutID) {
            window.clearTimeout(this.timeoutID);
            window.clearInterval(this.intervalID);
        }
        this.timeoutID = null;
        this.intervalID = null;
        this.updateTimes();
    },
    updateTimes: function() {
        if (!this.startTime) {
            return;
        }
        var timeSinceStart = Date.now() - this.startTime;
        this.timeSincePromptStart += timeSinceStart;
        this.timeSinceAttemptStart += timeSinceStart;
        this.startTime = null;
    },
    calcNextPromptTime: function () {
        this.timeSincePromptStart = 0;
        var meanTimeBetweenPrompts = this.calcAttentiveness() * this.calcTimeToRefocus();
        this.timeBetweenPrompts = Math.min(3*meanTimeBetweenPrompts, -1.0*meanTimeBetweenPrompts*Math.log(1.0-Math.random()));
        this.wait();
    },
    wait: function() {
        if (this.timeoutID)
            return;
        var delay = this.timeBetweenPrompts - this.timeSincePromptStart;
        this.startTime = Date.now();
        var me = this;
        this.timeoutID = window.setTimeout(function() { me.playAudio(); }, 10000 + delay);
        this.intervalID = window.setInterval(function() { me.displayElapsedTime(); }, 1000);
    },
    playAudio: function() {
        var audioPrompt;
        this.prompting = true;
        this.pause();
        if (!audioPrompt) {
            audioPrompt = $("#audioPrompt")[0];
            audioPrompt.addEventListener("ended", this.prompt);
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
            this.focused();
        } else {
            this.distracted();
        }
    },
    focused: function() {
        this.history.push({
            wasPrompted: this.prompting,
            wasDistracted: false,
            timeSinceAttemptStart: this.timeSinceAttemptStart
        });
        this.calcNextPromptTime();
        this.displayAttentiveness();
        this.prompting = false;
    },
    distracted: function() {
        this.history.push({
            wasPrompted: this.prompting,
            wasDistracted: true,
            timeSinceAttemptStart: this.timeSinceAttemptStart
        });
        this.calcNextPromptTime();
        this.displayAttentiveness();
        this.timeSinceAttemptStart = 0;
        this.prompting = false;
    },
    getMedian: function(arr) {
        var sortedArr = arr.slice(0).sort( function(a,b) {
            return a-b;
        });
        if (sortedArr.length % 2 == 1) {
            return sortedArr[(sortedArr.length - 1) / 2];
        } else {
            return (sortedArr[sortedArr.length / 2] + sortedArr[sortedArr.length / 2 - 1]) / 2.0;
        }
    },
    getMean: function(arr) {
        var sum = 0;
        arr.forEach( function(v) {
            sum += v
        });
        return 1.0 * sum / arr.length;
    },
    displayAttentiveness: function() {
        var attentiveness = this.calcAttentiveness();
        $("#attentiveness").html(Math.round(attentiveness*100));
    },
    displayElapsedTime: function() {
        $("#elapsedSecs").html(Math.round((this.timeSinceAttemptStart + (Date.now() - this.startTime))/1000));
    },
    calcAttentiveness: function() {
        var prompts = 0;
        var attentives = 0;
        for(var i = this.history.length - 1; i >= 0 && prompts < 10; i--) {
            var ev = this.history[i];
            if (ev.wasPrompted) {
                prompts++;
                if (!ev.wasDistracted)
                    attentives ++;
            }
        }
        if (prompts == 0) {
            return 0.5;
        }
        return 1.0*attentives/prompts;
    },
    calcTimeToRefocus: function() {
        var refocusTimes = [];
        var refocuses = 0;
        for(var i = this.history.length - 1; i >= 0 && refocuses < 10; i--) {
            var ev = this.history[i];
            if (!ev.wasPrompted && ev.wasDistracted) {
                refocusTimes.push(ev.timeSinceAttemptStart);
                refocuses++;
            }
        }
        if (refocusTimes.length == 0) {
            return 300000; /* 5 minutes */
        }
        return this.getMedian(refocusTimes);
    }
});

$( function() {
    var as = new Brettle.AttentionSampler();
    as.timeBetweenPrompts = 5*60000;
    var timeToRefocus = 5*60000;
    for (var i = 0; i < 5; i++) {
        as.history.push({
            wasPrompted: true,
            wasDistracted: true,
            timeSinceAttemptStart: 300000
        });
        as.history.push({
            wasPrompted: true,
            wasDistracted: false,
            timeSinceAttemptStart: 300000
        });
        as.history.push({
            wasPrompted: false,
            wasDistracted: true,
            timeSinceAttemptStart: timeToRefocus * Math.pow(1.1, i)
        });
        as.history.push({
            wasPrompted: false,
            wasDistracted: false,
            timeSinceAttemptStart: timeToRefocus * Math.pow(1.1, -i)
        });
    }
    as.prompt = as.promptPopup;
    $("#running").change( function() {
        if ($(this).prop("checked")) {
            as.wait();
        } else {
            as.pause();
        }
    });
    $("#promptMe").click( function() {
        as.playAudio();
    });
    $("#distracted").click( function() {
        as.pause();
        as.distracted();
    });
    $("#focused").click( function() {
        as.pause();
        as.focused();
    });
    as.calcNextPromptTime();
    as.displayAttentiveness();
    as.displayElapsedTime();
    as.pause();
});