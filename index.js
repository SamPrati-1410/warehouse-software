exports = module.exports = async function(config) {
  /* load configuration data from config.js file */
  config = require("node-file-config")().get(config);
  var expressApp = require("express");
  var app = {
    /* to wrap promise requests without errors */
    wrapper: require("node-promise-wrapper"),
    start: async function() {
      var express = new expressApp();
      express.use(expressApp.json());
      express.use(expressApp.static("public"));
      /* load all collections, aricle and product*/
      app.article = require("./article")(app, config, express);
      app.product = require("./product")(app, config, express);
      /* start the server */
      express.listen(config.port, config.host, function() {
        console.log("Application is listening on " + config.host + ":" + config.port);
      });
    }
  };
  /* connect to database first using the module, do not start the app if not connected */
  var {error, db} = await app.wrapper("db", require("./db")(app, config));
  if (typeof db !== "undefined") {
    app.db = db;
    app.start();
  } else {
    console.log("Oops! Something went wrong while connecting to database,please check ", error);
  }
};
exports();