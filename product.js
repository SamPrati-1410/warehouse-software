exports = module.exports = function(app, config, express) {
  var mod = {
    name: "product",
    key: "products",
    idKey: "product",
    verifyItem: function(item) { // hook - check if articles exist
      return new Promise(async function(resolve, reject) {
        if (typeof item.contain_articles === "object" && item.contain_articles !== null && typeof item.contain_articles.length !== "undefined") {
          for (var i=0; i<=item.contain_articles.length-1; i++) {
            var article = item.contain_articles[i];
            var {error, result} = await app.wrapper("result", app.db.find(app.article, {art_id: article.art_id}));
            if (typeof result === "undefined" || result.length === 0) {
              reject("Invalid article or article not found: " + JSON.stringify(article));
              return false;
            }
          }
          resolve(true);
        } else {
          resolve(true);
        }
      });
    },
    deleteItem: async function(item) { // updates article quantity
      var {error, result} = await app.wrapper("result", app.db.find(app.product, item));
      if (typeof result !== "undefined" && typeof result.length !== "undefined" && result.length > 0) {
        var product = result[0];
        if (typeof product.contain_articles === "object" && product.contain_articles !== null && typeof product.contain_articles.length !== "undefined" && product.contain_articles.length > 0) {
          for (var i=0; i<=product.contain_articles.length-1; i++) {
            var containingArticle = product.contain_articles[i];
            if (typeof containingArticle.amount === "number" && containingArticle.amount > 0) {
              var {error, result} = await app.wrapper("result", app.db.find(app.article, {art_id: containingArticle.art_id}));
              if (typeof result !== "undefined" && typeof result.length !== "undefined" && result.length > 0) {
                var article = result[0];
                if (typeof article.stock === "number") {
                  article.stock -= containingArticle.amount;
                  if (article.stock < 0) article.stock = 0;
                  await app.wrapper("result", app.db.update(app.article, {art_id: containingArticle.art_id}, article));
                }
              }
            }
          }
        }
      }
    }
  };
  mod.route = require("./route")(app, config, express, mod);
  return mod;
};