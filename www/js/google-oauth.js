var email;
var toggled = false;
var googleapi = {
    authorize: function(options) {
        var deferred = $.Deferred();

        //Build the OAuth consent page URL
        var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + $.param({
            client_id: options.client_id,
            redirect_uri: options.redirect_uri,
            response_type: 'code',
            scope: options.scope
        });

        //Open the OAuth consent page in the InAppBrowser
        var authWindow = window.open(authUrl, '_blank', 'location=no,toolbar=no');
        //The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
        //which sets the authorization code in the browser's title. However, we can't
        //access the title of the InAppBrowser.
        //
        //Instead, we pass a bogus redirect_uri of "http://localhost", which means the
        //authorization code will get set in the url. We can access the url in the
        //loadstart and loadstop events. So if we bind the loadstart event, we can
        //find the authorization code and close the InAppBrowser after the user
        //has granted us access to their data.
        $(authWindow).on('loadstop', function(e) {
            var url = e.originalEvent.url;
            var code = /\?code=(.+)$/.exec(url);
            var error = /\?error=(.+)$/.exec(url);

            if (url.indexOf('lc.ism.codes/') != -1) {
                authWindow.close();
                return deferred.promise();
            }

            if (code || error) {
                //Always close the browser when match is found
                authWindow.close();
            }

            if (code) {
                //Exchange the authorization code for an access token
                $.post('https://accounts.google.com/o/oauth2/token', {
                    code: code[1],
                    client_id: options.client_id,
                    client_secret: options.client_secret,
                    redirect_uri: options.redirect_uri,
                    grant_type: 'authorization_code'
                }).done(function(data) {
                    deferred.resolve(data);
                }).fail(function(response) {
                    deferred.reject(response.responseJSON);
                });
            } else if (error) {
                //The user denied access to the app
                deferred.reject({
                    error: error[1]
                });
            }
        });

        return deferred.promise();
    }
};

function successHandler(result) {
    alert('result = ' + result);
}

function errorHandler(result) {
    alert("error = " + result);
}

function onNotification(e) {
    alert("ON NOTIFICATION " + e.regid);
    $.post("http://nileswest.herokuapp.com/register?token=" + e.regid + "&email=" + email + "&platform=" + device.platform);
    alert("post http://nileswest.herokuapp.com/register?token=" + e.regid + "&email=" + email + "&platform=" + device.platform);
}


function checkEmail() {
	var r = $.Deferred();
    alert('checking')
    googleapi.authorize({
        client_id: '603675554006-hknct1dq9kuior5k8kq5st3gies7ipu3.apps.googleusercontent.com',
        client_secret: 'tMfSinE_Bi1c-LIcG9h2la4o',
        redirect_uri: 'http://lc.ism.codes',
        scope: 'https://www.googleapis.com/auth/userinfo.email'
    }).done(function(data) {
	alert('next ajax')
        $.ajax({
            url: "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=" + data.access_token,
            type: 'GET',
            dataType: 'json'
        }).done(function(data) {
		alert("DATA"+JSON.stringify(data));
            /*if (data.email.indexOf("nths219.org") == -1) {


                //log out, log back in again
                alert('school email only')
                var revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' + accessToken;

                // Perform an asynchronous GET request.
                $.ajax({
                    type: 'GET',
                    url: revokeUrl,
                    async: false,
                    contentType: "application/json",
                    dataType: 'jsonp',
                    success: function(nullResponse) {
                        // Do something now that user is disconnected
                        // The response is always undefined.
                        accessToken = null;
                        console.log(JSON.stringify(nullResponse));
                        console.log("-----signed out..!!----" + accessToken);
                        return checkEmail();

                    },
                    error: function(e) {
			alert('plus.google')
                        // Handle the error
                        // console.log(e);
                        // You could point users to manually disconnect if unsuccessful
                        // https://plus.google.com/apps
                    }
                });
            } else {*/
                alert('correct!')
		email = data.email;
		
            /*}*/
        }).fail(function(e) {
            alert("ajax error" + e);
        });
        console.log('Access Token: ' + data.access_token);
    }).fail(function(data) {
        alert('error' + data);
        console.log('error' + data);
    });

setTimeout(function () {
    // and call `resolve` on the deferred object, once you're done
    r.resolve();
  }, 2500);
return r;
}




$(document).on('deviceready', function() {
	checkEmail().done(function(){
email = "isamol1@nths219.org";
loginRails(email);
setupPush();
alert("email is "+email);
    //logged in as nths219.org and (add later) verified as tutor


    $('.toggle').on('toggle', function() {
        if (toggled) {
            //turning toggle off
            $.post("http://nileswest.herokuapp.com/change_status?email=" + email + "&secret_key=" + "43110" + "&status=1").done(function() {
                alert('busy');
            });
        } else {
            //turning toggle on
            $.post("http://nileswest.herokuapp.com/change_status?email=" + email + "&secret_key=" + "43110" + "&status=2").done(function() {
                alert('available');
            });
        }
	toggled=!toggled;
    });
});

});

function loginRails(email) {

    $.post("http://nileswest.herokuapp.com/change_status?email=" + email + "&secret_key=" + "43110" + "&status=2").done(function() {
        alert("post http://nileswest.herokuapp.com/change_status?email=" + email + "&secret_key=" + "43110" + "&status=2");
        alert('logged in and available');
    })

}

function setupPush() {
    //might as well set up here

    var pushNotification = window.plugins.pushNotification;
    if (device.platform == 'android' || device.platform == 'Android' || device.platform == "amazon-fireos") {
        alert('android')
        pushNotification.register(
            successHandler,
            errorHandler, {
                "senderID": "603675554006",
                "ecb": "onNotification"
            });
    } else if (device.platform == 'blackberry10') {
        //nah
    } else {
        pushNotification.register(
            tokenHandler,
            errorHandler, {
                "badge": "true",
                "sound": "true",
                "alert": "true",
                "ecb": "onNotificationAPN"
            });
    }




}

$(document).on('pause', function() {
    if(typeof email != "undefined"){
        $.post("http://nileswest.herokuapp.com/change_status?email=" + email + "&secret_key=" + "43110" + "&status=0");
    }
});
