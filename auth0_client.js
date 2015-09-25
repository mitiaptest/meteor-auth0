Auth0 = {};

// Request credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on error.
Auth0.requestCredential = function (options, credentialRequestCompleteCallback) {

  // support both (options, callback) and (callback).
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  }

  var config = ServiceConfiguration.configurations.findOne({ service: 'auth0' });

  if (!config) {
    credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError('Service not configured.'));
    return;
  }

  options = options || {};
  options.response_type = options.response_type || 'code';
  options.client_id = config.clientId;
  options.redirect_uri = Meteor.absoluteUrl('_oauth/auth0?close');
  options.state = Random.id();

  var loginUrl = 'https://' + config.domain + '/authorize?';

  for (var k in options) {
    loginUrl += '&' + k + '=' + options[k];
  }

  options.popupOptions = options.popupOptions || {};
  var popupOptions = {
    width:  options.popupOptions.width || 320,
    height: options.popupOptions.height || 450
  };
  if (options.loginStyle === 'redirect') {
    var redirectOptions = {};
    redirectOptions['loginService'] = 'auth0';
    redirectOptions['credentialToken'] = options.state;
    redirectOptions['loginUrl'] = loginUrl;
    redirectOptions['credentialRequestCompleteCallback'] = credentialRequestCompleteCallback;
    redirectOptions['loginStyle'] = 'redirect';
    OAuth.launchLogin(redirectOptions);
  } else {
    Oauth.initiateLogin(options.state, loginUrl, credentialRequestCompleteCallback, popupOptions);
  }
};

Auth0.checkUserLogin = function (callback) {
  var oAuthData = OAuth.getDataAfterRedirect();
  if (oAuthData !== null) {
    Accounts.oauth.tryLoginAfterPopupClosed(oAuthData.credentialToken);
  }
};