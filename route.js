exports = module.exports = function(app, config, express, collection) {
  /* handles API routes for different collections */
  var mod = {
    /*
      - fetch items from user request and normalize the request
      - find any errors and return them
    */
    item: function(request) {
      return new Promise(async function(resolve, reject) {
        var data = request.body;
        if (
          typeof data === "object" && data !== null
          && typeof data[collection.key] === "object"
          && typeof data[collection.key] !== null
        ) {
          data = data[collection.key];
          if (typeof data.length === "undefined") data = [data];
          var list = [];
          var found = {};
          for (var i=0; i<=data.length-1; i++) {
            var item = data[i];
            if (typeof item[collection.idKey + "_id"] === "number" && isNaN(Number(item[collection.idKey + "_id"])) !== true && Number(item[collection.idKey + "_id"]) > 0) {
              if (typeof collection.verifyItem === "function") {
                var {error, verify} = await app.wrapper("verify", collection.verifyItem(item));
                if (typeof verify === "undefined") {
                  reject(error);
                  return false;
                }
              }
              if (typeof found[item[collection.idKey + "_id"]] === "undefined") {
                if (typeof item._id !== "undefined") delete item._id;
                list.push(item);
                found[item[collection.idKey + "_id"]] = true;
              } else {
                reject("Duplicate " + collection.name + ": " + JSON.stringify(item));
                return false;
              }
            } else {
              reject(collection.name + " " + collection.idKey + "_id is invalid: " + JSON.stringify(item));
              return false;
            }
          }
          if (list.length > 0) {
            resolve(list);
          } else {
            reject("No such " + collection.name + " to add/update: " + JSON.stringify(item));
          }
        } else {
          reject("Invalid request.");
        }
      });
    },
    output: function(result) {
      if (typeof result === "object" && result !== null && typeof result.length === "undefined") result = [result];
      var output = {};
      output[collection.key] = result;
      return output;
    },
    start: function() {
      /* get single item */
      express.get("/api/" + collection.name + "/:id", async function(request, response) {
        request.body = {};
        request.body[collection.key] = {};
        request.body[collection.key][collection.idKey + "_id"] = typeof request.params !== "undefined" ? Number(request.params.id) : undefined
        if (config.logs.api === true) console.log("GET " + collection.name.toUpperCase(), JSON.stringify(request.body));
        var {error, list} = await app.wrapper("list", mod.item(request));
        if (typeof list !== "undefined" && typeof list.length !== "undefined") {
          var {error, result} = await app.wrapper("result", app.db.find(collection, list[0]));
          if (typeof result !== "undefined" && result.length > 0) {
            response.setHeader("content-type", "application/json");
            response.status(200).send(JSON.stringify(mod.output(result[0])));
          } else {
            response.status(400).send("Could not find " + collection.name + ".");
          }
        } else {
          response.status(400).send(error);
        }
      });
      /* get all items */
      express.get("/api/" + collection.name, async function(request, response) {
        if (config.logs.api === true) console.log("GET " + collection.name.toUpperCase() + "S");
        var {error, result} = await app.wrapper("result", app.db.find(collection, {}));
        if (typeof result !== "undefined") {
          response.setHeader("content-type", "application/json");
          response.status(200).send(JSON.stringify(mod.output(result)));
        } else {
          response.status(400).send("Could not find " + collection.name + "(s).");
        }
      });
      /* add/update single/multiple item(s) */
      express.post("/api/" + collection.name, async function(request, response) {
        if (config.logs.api === true) console.log("POST " + collection.name.toUpperCase(), JSON.stringify(request.body));
        var {error, list} = await app.wrapper("list", mod.item(request));
        if (typeof list !== "undefined" && typeof list.length !== "undefined") {
          var {error, result} = await app.wrapper("result", app.db.addOrUpdate(collection, list));
          if (typeof result !== "undefined") {
            response.status(200).send(JSON.stringify(mod.output(list)));
          } else {
            response.status(400).send("Could not add/update " + collection.name + "(s).");
          }
        } else {
          response.status(400).send(error);
        }
      });
      /* delete single/multiple item(s) */
      express.delete("/api/" + collection.name, async function(request, response) {
        if (config.logs.api === true) console.log("DELETE " + collection.name.toUpperCase(), JSON.stringify(request.body));
        var {error, list} = await app.wrapper("list", mod.item(request));
        if (typeof list !== "undefined" && typeof list.length !== "undefined") {
          for (var i=0; i<=list.length-1; i++) {
            if (typeof collection.deleteItem === "function") await collection.deleteItem(list[i]);
            var {error, result} = await app.wrapper("result", app.db.delete(collection, list[i]));
            if (typeof result === "undefined") {
              response.status(400).send("Could not delete " + collection.name + ": " + JSON.stringify(list[i]));
              return false;
            }
          }
          response.setHeader("content-type", "application/json");
          response.status(200).send(JSON.stringify(mod.output(list)));
        } else {
          response.status(400).send(error);
        }
      });
    }
  };
  mod.start();
  return mod;
};