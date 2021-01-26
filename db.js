/*
  (db.js)
  Connect to the mongodb server and perform add/edit/delete/search operations
*/
exports = module.exports = function(app, config) {
  return new Promise(function(resolve, reject) {
    var url = "mongodb://" + config.mongodb.host + ":" + config.mongodb.port;
    require('mongodb').MongoClient.connect(url, {
      useUnifiedTopology: true
    }, function(error, client) {
      if (!error) { // if connected successfully
        console.log("Successfully connected to server " + url);
        mod.client = client;
        mod.db = client.db(config.mongodb.dbname);
        /* start the module */
        mod.start();
        resolve(mod);
      } else { // could not connect
        reject(error);
      }
    });
    var mod = {
      /*
        a mix of add & update functions
        - searches for a particular item in the collection using it's id and adds or updates it accordingly.
      */
      addOrUpdate: function(collection, data) {
        // convert to array if it is a single object
        if (typeof data === "object" && typeof data.length === "undefined") data = [data];
        return new Promise(async function(resolve, reject) {
          for (var i=0; i<=data.length-1; i++) {
            var search = {};
            search[collection.idKey + "_id"] = data[i][collection.idKey + "_id"];
            var {error, found} = await app.wrapper("found", mod.find(collection, search));
            if (typeof found !== "undefined" && typeof found.length !== "undefined") {
              if (found.length === 0) { // add
                var {error, result} = await app.wrapper("result", mod.add(collection, data[i]));
                if (typeof result !== "undefined") resolve(result); else reject(error);
              } else { // update
                var {error, result} = await app.wrapper("result", mod.update(collection, search, data[i]));
                if (typeof result !== "undefined") resolve(result); else reject(error);
              }
            } else {
              reject(error);
            }
          }
        });
      },
      /* add single/multiple record(s) to a collection */
      add: function(collection, data) {
        // convert to array if it is a single object
        if (typeof data === "object" && typeof data.length === "undefined") data = [data];
        return new Promise(function(resolve, reject) {
          var dbCollection = mod.db.collection(collection.name);
          dbCollection.insertMany(data, function(error, result) {
            if (!error) {
              resolve(result);
            } else {
              reject(error);
            }
          });
        });
      },
      /* update single/multiple record(s) to a collection */
      update: function(collection, search, data) {
        return new Promise(function(resolve, reject) {
          var dbCollection = mod.db.collection(collection.name);
          dbCollection.updateMany(search, {$set: data}, function(error, result) {
            if (!error) {
              resolve(result);
            } else {
              reject(error);
            }
          });
        });
      },
      /* delete single/multiple record(s) from a collection */
      delete: function(collection, search) {
        return new Promise(function(resolve, reject) {
          var dbCollection = mod.db.collection(collection.name);
          dbCollection.deleteMany(search, function(error, result) {
            if (!error) {
              resolve(result);
            } else {
              reject(error);
            }
          });
        });
      },
      /* find single/multiple record(s) in a collection */
      find: function(collection, search) {
        return new Promise(function(resolve, reject) {
          var dbCollection = mod.db.collection(collection.name);
          dbCollection.find(search).toArray(function(error, result) {
            if (!error) {
              for (var i=0; i<=result.length-1; i++) {
                delete result[i]._id;
              }
              resolve(result);
            } else {
              reject(error);
            }
          });
        });
      },
      start: function() {}
    };
  });
};
