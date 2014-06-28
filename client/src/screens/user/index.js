var _ = require("lodash");
var Q = require("q");
var GlslTransitionValidator = require("glsl-transition-validator");
var Images = require("../../images");
var Qstart = require("qstart");
var UserScreen = require("./UserScreen");
var validateTransition = require("../../glslio/validateTransition");

var imagesRequiredNow = Q.defer();
var imagesP =
  // Only preload images after a page time load or if it is required now
  Q.race([ Qstart.delay(400), imagesRequiredNow.promise ])
  .then(function () {
    return Q.all([
      Images.getImage(0, "gallery"),
      Images.getImage(1, "gallery")
    ]);
  });

function show (params, env) {
  imagesRequiredNow.resolve();
  var isMe = env.user === params.user;

  return imagesP.then(_.bind(function (images) {
    var validator = new GlslTransitionValidator(images[0], images[1], 50, 30);
    
    var groups = _.groupBy(params.transitions, function (transition) {
      if (isMe && validateTransition(validator, transition).length) {
        return 'invalid';
      }
      if (transition.name !== "TEMPLATE")
        return 'published';
      else {
        if (transition.owner === env.user)
          return 'unpublished';
      }
    }, this);

    validator.destroy();

    return UserScreen({
      env: env,
      images: images,
      user: params.user,
      page: params.page,
      groups: groups,
      pageSize: 12,
      thumbnailWidth: 300,
      thumbnailHeight: 200
    });
  }, this));
}

function init () {
  return {
    show: show
  };
}

module.exports = init;

