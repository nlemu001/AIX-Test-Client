var wsUri = "ws://localhost:1234";
var connection = null;
var timerId = null;

var time;
var durationText = "";
var duration = 0;
var mediaId = 0;

var timerPaused = false;
var timerStarted = false;

var volumeTestTimerId = null;
var volumeTestTimerUp = true;
var volumeTestTimerCount = 0;

var brightnessTestTimerId = null;
var brightnessTestTimerUp = true;
var brightnessTestTimerCount = 0;

var backlightTestTimerId = null;
var backlightTestTimerUp = true;
var backlightTestTimerCount = 0;

var Command = {
    PLAY_VIDEO: 1,
    PAUSE_VIDEO: 2,
    RESUME_VIDEO: 3,
    STOP_VIDEO: 4,
    SKIP_BACK: 5,
    SEEK_PLAYER: 6,
    SET_VOLUME: 7,
    SET_BRIGHTNESS: 8,
    TOGGLE_DISPLAY: 9,
    SET_DO_NOT_DISTURB: 10
};

var playerState = Command.STOP_VIDEO;

window.loggedin = false;

window.onload = function() {
    $('#txtUri').val(wsUri);
    $("#pairButton").button();
    $("#connectButton").button();
    $("#volumeTestButton").button();
    $("#brightnessTestButton").button();
    $("#backlightTestButton").button();
    $("#button-backlight").button();
    $("#button-play").button();
    $("#button-stop").button();
    $("#button-skipback").button();
    initializeControls();
}

function initializeControls() {
    if (connection) {
        $('#slider-volume').slider('enable');
        $('#slider-brightness').slider('enable');
        $("#txtMediaId").prop( "disabled", false );
        $("#button-backlight").button('enable');
        $("#button-play").button('enable');
        $('#volumeTestButton').button('enable');
        $("#txtVolumeTestInterval").prop( "disabled", false );
        $('#brightnessTestButton').button('enable');
        $("#txtBrightnessTestInterval").prop( "disabled", false );
        $('#backlightTestButton').button('enable');
        $("#txtBacklightTestInterval").prop( "disabled", false );
    } else {
        $("#button-backlight").button('disable');
        $("#button-play").button('disable');
        $("#button-stop").button('disable');
        $("#button-skipback").button('disable');
        $('#slider-volume').slider('disable');
        $("#slider-volume").val(0).slider("refresh");
        $('#slider-brightness').slider('disable');
        $("#slider-brightness").val(0).slider("refresh");
        $('#slider-seek').slider('disable');
        $("#slider-seek").val(0).slider("refresh");
        $("#txtMediaId").prop( "disabled", true );
        $('#volumeTestButton').button('disable');
        $("#txtVolumeTestInterval").prop( "disabled", true );
        $('#brightnessTestButton').button('disable');
        $("#txtBrightnessTestInterval").prop( "disabled", true );
        $('#backlightTestButton').button('disable');
        $("#txtBacklightTestInterval").prop( "disabled", true );
    }
}

function setPlayerControls(playerActive) {
    $( "#txtMediaId" ).prop( "disabled", playerActive );

    if (playerActive) {
        $("#button-stop").button('enable');
        $("#button-skipback").button('enable');
        $('#slider-seek').slider('enable');
    } else {
        $("#button-stop").button('disable');
        $("#button-skipback").button('disable');
        $('#slider-seek').slider('disable');
        $("#slider-seek").val(0).slider("refresh");
    }
}

function startPairing() {
    setStatus("Checking pairing config");
    $.ajax('http://jsonplaceholder.typicode.com/posts/1', {
      method: 'PUT',
      data: {
         "api_version":  1,
         "unpair_timeout": 0
      }
    }).then(function(data) {
      processPairingConfig(data);
      console.log(data);
    });
}

function processPairingConfig(s) {
    if (s["api_version"] !== undefined)
    {
        setStatus("Checking if paired");
        isPaired();
    } else {
        setStatus("Error - Pairing Configuration missing");
    }
}



function isPaired() {
    $.ajax('http://jsonplaceholder.typicode.com/posts/1', {
      method: 'PUT',
      data: {
         "virtual_pcu_uri": "https://pairing.rave.zii.aero:50123",
         "ped_server_uri": "https://pairing.rave.zii.aero:50523",
         "seat_id": "31C",
         "seat_zone": "-1,0,2",
         "is_paired": true,
         "reason": ""
      }
    }).then(function(data) {
      processIsPaired(data);
      console.log(data);
    });
}

function processIsPaired(s) {
    if (s["is_paired"]) {
        wsUri = s.ped_server_uri;
        $('#txtUri').val(wsUri);
        setStatus("PED Server URI found");
    }
}

function getPairingConfiguration() {
    $.ajax('http://jsonplaceholder.typicode.com/posts/1', {
      method: 'PUT',
      data: {
         "virtual_pcu_uri": "https://pairing.rave.zii.aero:50123",
         "ped_server_uri": "https://pairing.rave.zii.aero:50523",
         "seat_id": "31C",
         "seat_zone": "-1,0,2",
         "is_paired": true,
         "reason": ""
      }
    }).then(function(data) {
      processIsPaired(data);
      console.log(data);
    });
}

function getConnectionEventDescription(code) {
    var reason;

            if (code === 1000)
                reason = "OK";
            else if(code === 1001)
                reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
            else if(code === 1002)
                reason = "An endpoint is terminating the connection due to a protocol error";
            else if(code === 1003)
                reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
            else if(code === 1004)
                reason = "Reserved. The specific meaning might be defined in the future.";
            else if(code === 1005)
                reason = "No status code was actually present.";
            else if(code === 1006)
               reason = "The connection was closed abnormally.";
            else if(code === 1007)
                reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).";
            else if(code === 1008)
                reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
            else if(code === 1009)
               reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
            else if(code === 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
                reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
            else if(code === 1011)
                reason = "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
            else if(code === 1015)
                reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
            else
                reason = "Unknown reason";

    return reason;

}

function connect() {
    if (connection) {
        connection.close();
    }
    else
    {
        //connection=new WebSocket("ws://localhost:1234");
        connection=new WebSocket($("#txtUri").val());
        connection.onopen = function () {
            console.log("Connected To Server");
            setStatus("Connected");
            $("#connectButton").attr('style', "background:green; color:white");
            $("#connectButton").html("Disconnect");
            $( "#txtUri" ).prop( "disabled", true );
            $('#volumeTestButton').button('enable');
            $('#txtMediaId').val(mediaId);
            initializeControls();
        };
        connection.onerror = function (error) {
          console.log('Error Logged: ' + error); //log errors
        };
        connection.onmessage = function (e) {
          processMessage(e.data);
        };
        connection.onclose = function (e) {
            connection = null;
            console.log("Disconnected To Server");
            setStatus("Disconnected " + getConnectionEventDescription(e.code));
            $("#connectButton").attr('style', "background:lightgrey; color:black");
            $("#connectButton").html("Connect");
            $( "#txtUri" ).prop( "disabled", false );
            $("#button-play").attr("src", "images/play_small.png");
            $("#status").html("");
            time = 0;
            clearInterval(timerId);
            clearTimeout(timerId);
            timerStarted = false;
            initializeControls();
        }
    }
}

function sendVolume() {
    sendSeatControlMessage(Command.SET_VOLUME, $("#slider-volume").val());
}

function sendBrightness() {
    sendSeatControlMessage(Command.SET_BRIGHTNESS, $("#slider-brightness").val());
}

function sendToggleBacklight() {
    sendSeatControlMessage(Command.TOGGLE_DISPLAY, 0);
}

function sendSeek() {
    sendVideoPlayerMessage(Command.SEEK_PLAYER, mediaId, $("#slider-seek").val());
}

function sendPlayCommand() {
        if (playerState === Command.STOP_VIDEO) {
            mediaId = Number($("#txtMediaId").val());
            console.log("MEDIA ID = " + mediaId);
            sendVideoPlayerMessage(Command.PLAY_VIDEO, mediaId, 0);
        } else if (playerState === Command.PAUSE_VIDEO) {
            sendVideoPlayerMessage(Command.RESUME_VIDEO, mediaId, 0);
        } else {
            sendVideoPlayerMessage(Command.PAUSE_VIDEO, mediaId, 0);
        }    
}

function sendStopCommand() {
  if (playerState !== Command.STOP_VIDEO) {
    sendVideoPlayerMessage(Command.STOP_VIDEO, mediaId, 0);
  }
}

function sendSkipBackCommand() {
  if (playerState !== Command.STOP_VIDEO) {
    sendVideoPlayerMessage(Command.SKIP_BACK, mediaId, 0);
  }
}

function sendVideoPlayerMessage(command, mediaId, value)
{
    if (connection) {
        var eventObject = {};
        var dataObject = {};

        switch (command) {
            case Command.PLAY_VIDEO:
                eventObject["event"] = "play_video";
                dataObject["media_id"] = mediaId;
                dataObject["is_preview"] = false;
                dataObject["resume_saved"] = false;
                eventObject["data"] = dataObject;
                break;
            case Command.PAUSE_VIDEO:
                eventObject["event"] = "pause_video";
                dataObject["media_id"] = mediaId;
                dataObject["is_preview"] = false;
                eventObject["data"] = dataObject;
                break;
            case Command.RESUME_VIDEO:
                eventObject["event"] = "resume_video";
                dataObject["media_id"] = mediaId;
                dataObject["is_preview"] = false;
                eventObject["data"] = dataObject;
                break;
            case Command.STOP_VIDEO:
                eventObject["event"] = "stop_video";
                dataObject["media_id"] = mediaId;
                dataObject["is_preview"] = false;
                eventObject["data"] = dataObject;
                break;
            case Command.SEEK_PLAYER:
                eventObject["event"] = "set_video_playback_position";
                dataObject["media_id"] = mediaId;
                dataObject["is_preview"] = false;
                console.log("SEEK PLAYER VALUE = " +value);
                dataObject["position"] = value;
                eventObject["data"] = dataObject;
                break;
            case Command.SKIP_BACK:
                eventObject["event"] = "video_skip_back";
                dataObject["media_id"] = mediaId;
                dataObject["is_preview"] = false;
                eventObject["data"] = dataObject;
                break;
            default:
                break;
        }

        console.log("Message sent: " + JSON.stringify(eventObject));
        connection.send(JSON.stringify(eventObject));
    }
}

function sendSeatControlMessage(command, value)
{
    if (connection) {
        var eventObject = {};
        var dataObject = {};

        switch (command) {
            case Command.SET_VOLUME:
                eventObject["event"] = "set_volume";
                dataObject["volume"] = value;
                eventObject["data"] = dataObject;
                break;
            case Command.SET_BRIGHTNESS:
                eventObject["event"] = "set_brightness";
                dataObject["brightness"] = value;
                eventObject["data"] = dataObject;
                break;
            case Command.TOGGLE_DISPLAY:
                eventObject["event"] = "toggle_display";
                eventObject["data"] = dataObject;
                break;
            case Command.SET_DO_NOT_DISTURB:
                eventObject["event"] = "set_dnd";
                dataObject["enabled"] = value;
                dataObject["option_id"] = "";
                eventObject["data"] = dataObject;
                break;
            default:
                break;
        }

        console.log("Message sent: " + JSON.stringify(eventObject));
        connection.send(JSON.stringify(eventObject));
    }
}


// A private method to process an incoming message over the websocket.
// params
//   incoming message in JSON format
//
// Example JSON message below:
//        {
//            "event": "video_started",
//            "data":
//            {
//                "media_id": 12345,
//                "is_preview": "false"
//                "position": 18000000,
//                "runtime": 3600000
//                "controls_enabled": true
//            }
//        }
function processMessage(s) {

        console.log("Message received: " + s);

        var eventObject = JSON.parse(s);
        var dataObject = eventObject["data"];
        var command = eventObject["event"];

        var elapsedTime = 0;
        switch (command) {
            case "video_started":

                playerState = Command.PLAY_VIDEO;
                setPlayerControls(true);
                console.log("video has started");
                $("#button-play").attr("src", "images/pause_small.png");

                // update the seek bar max based on the runtime
                $("#slider-seek").attr("max", dataObject.runtime/1000);
                $("#slider-seek").slider("refresh");

                // update the text to the current media id
                mediaId = dataObject.media_id;
                $('#txtMediaId').val(mediaId);

                // we are playing so start the timer
                if (!timerStarted) {
                  console.log("START TIMER!");
                  startTimer();
                }

                duration = dataObject["runtime"]/1000;
                durationText = getDurationString(duration);
                elapsedTime = dataObject.position/1000;
                console.log(dataObject.runtime);
                console.log(dataObject.position);

                time = elapsedTime;
                $("#status").html(getDurationString(time) + " / " + durationText);
                timerPaused = false;
                break;
            case "set_video_playback_position":
                timerPaused = false;
                console.log(dataObject.position);
                durationText = getDurationString(duration);
                elapsed_time = Number(dataObject.position)/1000;
                $("#status").html(getDurationString(time) + " / " + durationText);
                time = elapsed_time;
                timerPaused = false;
                break;

            case "pause_video":
                playerState = Command.PAUSE_VIDEO;
                $("#button-play").attr("src", "images/play_small.png");
                break;

            case "resume_video":
                playerState = Command.PLAY_VIDEO;
                $("#button-play").attr("src", "images/pause_small.png");
                break;

            case "stop_video":
                playerState = Command.STOP_VIDEO;
                setPlayerControls(false);
                $("#button-play").attr("src", "images/play_small.png");
                time = 0;
                clearInterval(timerId);
                clearTimeout(timerId);
                timerStarted = false;
                $("#status").html("");

                break;
            case "set_volume":
                $("#slider-volume").val(dataObject["volume"]).slider("refresh");
                break;
            case "set_brightness":
                $("#slider-brightness").val(dataObject["brightness"]).slider("refresh");
                break;
            case "display_changed":
                console.log("display changed " + dataObject["display_on"]);
                if (dataObject["display_on"]) {
                    console.log("turn on");
                    $("#button-backlight").attr('src', 'images/backlight_on.png');
                }
                else {
                    console.log("turn off");
                    $("#button-backlight").attr('src', 'images/backlight_off.png');
                }
                break;
            default:
                break;
        }
}

function sendRemoteCommand(command, value) {
    var name = "";


    switch (command) {
        case Command.BRIGHTNESS:
            name = "set_brightness";
            break;
        case Command.VOLUME:
            name = "set_volume";
            break;
        case Command.BACKLKGHT:
            name = "set_display";
            break;
        case Command.PLAY:
            name = "volume";
            break;
        case Command.RESUME:
            name = "volume";
            break;
        case Command.PAUSE:
            name = "set_volume";
            break;
        case Command.STOP:
            name = "stop_video";
            break;
        case Command.SKIP_BACK:
            name = "set_volume";
            break;
        default:
    }
    var jsonObject = { "name" : "tutorialspoint.com", "year"  : 2005 };

    connection.send(jsonObject);

}

function startTimer() {
    timerId = setInterval(myTimer, 1000);
}

function myTimer() {
    timerStarted = true;
    if (!timerPaused) {
        // check if we have reached the end
        if (time < $("#slider-seek").attr("max")) {
            // check if we are playing
            if (playerState === Command.PLAY_VIDEO) {
                // increment the time and update
                time++;
                $("#slider-seek").val(time).slider("refresh");
                $("#status").html(getDurationString(time) + " / " + durationText);
            }
        } else {
            clearInterval(timerId);
            clearTimeout(timerId);
            timerStarted = false;
        }
    }
}

function volumeTest() {
    var interval = $("#txtVolumeTestInterval").val();

    console.log("INTERVAL = " + interval);

    if (isNaN(interval) || interval === "") {
        interval = 1000;
        $("#txtVolumeTestInterval").val(interval);
    }

    if (!volumeTestTimerId)
    {
        $("#volumeTestButton").attr('style', "background:green; color:white");
        $("#txtVolumeTestInterval").prop( "disabled", true );
        volumeTestTimerId = setInterval(volumeTestTimer, interval);
    }
    else
    {
        $("#volumeTestButton").attr('style', "background:lightgrey; color:black");
        $("#txtVolumeTestInterval").prop( "disabled", false );
        clearInterval(volumeTestTimerId);
        clearTimeout(volumeTestTimerId);
        volumeTestTimerCount = 0;
        volumeTestTimerId = null;
    }

}

function volumeTestTimer() {
    if (volumeTestTimerUp)
    {
        volumeTestTimerCount++;
        if (volumeTestTimerCount > 100)
        {
            volumeTestTimerCount = 99;
            volumeTestTimerUp = false;
        }
    }
    else
    {
        volumeTestTimerCount--;
        if (volumeTestTimerCount < 1)
        {
            volumeTestTimerCount = 0;
            volumeTestTimerUp = true;
        }
    }
    sendSeatControlMessage(Command.SET_VOLUME, volumeTestTimerCount);
}

function brightnessTest() {
    var interval = $("#txtBrightnessTestInterval").val();

    if (isNaN(interval)  || interval === "") {
        interval = 1000;
        $("#txtBrightnessTestInterval").val(interval);
    }

    if (!brightnessTestTimerId)
    {
        $("#brightnessTestButton").attr('style', "background:green; color:white");
        $("#txtBrightnessTestInterval").prop( "disabled", true );
        brightnessTestTimerId = setInterval(brightnessTestTimer, interval);
    }
    else
    {
        $("#brightnessTestButton").attr('style', "background:lightgrey; color:black");
        $("#txtBrightnessTestInterval").prop( "disabled", false );
        clearInterval(brightnessTestTimerId);
        clearTimeout(brightnessTestTimerId);
        brightnessTestTimerCount = 0;
        brightnessTestTimerId = null;
    }

}

function brightnessTestTimer() {
    if (brightnessTestTimerUp)
    {
        brightnessTestTimerCount++;
        if (brightnessTestTimerCount > 100)
        {
            brightnessTestTimerCount = 99;
            brightnessTestTimerUp = false;
        }
    }
    else
    {
        brightnessTestTimerCount--;
        if (brightnessTestTimerCount < 1)
        {
            brightnessTestTimerCount = 0;
            brightnessTestTimerUp = true;
        }
    }
    sendSeatControlMessage(Command.SET_BRIGHTNESS, brightnessTestTimerCount);
}

function setStatus(status) {
    $("#txtStatus").html(status);
}

function backlightTest() {
    var interval = $("#txtBacklightTestInterval").val();

    if (isNaN(interval) || interval === "") {
        interval = 1000;
        $("#txtBacklightTestInterval").val(interval);
    }

    if (!backlightTestTimerId)
    {
        $("#backlightTestButton").attr('style', "background:green; color:white");
        backlightTestTimerId = setInterval(backlightTestTimer, interval);
        $("#txtBacklightTestInterval").prop( "disabled", true );
    }
    else
    {
        $("#backlightTestButton").attr('style', "background:lightgrey; color:black");
        $("#txtBacklightTestInterval").prop( "disabled", false );
        clearInterval(backlightTestTimerId);
        clearTimeout(backlightTestTimerId);
        backlightTestTimerId = null;
    }

}

function backlightTestTimer() {
    sendSeatControlMessage(Command.TOGGLE_DISPLAY, 0);
}

function getDurationString(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return twoDigitString(h) + " : " + twoDigitString(m) + " : " + twoDigitString(s);
}

function twoDigitString(number) {

    if (Number(String(number)) === 0) {
        return "00";
    }

    if (String(number).length === 1) {
        return "0" + String(number);
    }

    return String(number);
}


