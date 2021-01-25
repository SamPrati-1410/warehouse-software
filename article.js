exports = module.exports = function(app, config, express) {
  var mod = {
    name: "article",
    key: "inventory",
    idKey: "art"
  };
  mod.route = require("./route")(app, config, express, mod);
  return mod;
};