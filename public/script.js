(function() {
  var app = {
    loading: {
      element: document.querySelector(".loading"),
      show: function() {
        app.loading.element.className = app.loading.element.className.split(" show").join("") + " show";
      },
      hide: function() {
        app.loading.element.className = app.loading.element.className.split(" show").join("");
      }
    },
    validURL: function(str) {
      var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
      return !!pattern.test(str);
    },
    list: {
      element: document.querySelector(".pane-right .list"),
      skipKeys: ["name"],
      line: function(item, content, name, className) {
        if (typeof className === "undefined") className = "";
        if (typeof item[name] !== "undefined") {
          var value = item[name];
          if (app.validURL(value) === true) value = `<a href="` + value + `">` + value + `</a>`;
          content.innerHTML += `<div class="line ` + className + `"><span>` + name + `</span> ` + value + `</div>`;
        }
      },
      lines: function(item, content, collection) {
        for (var key in item) {
          if (app.list.skipKeys.indexOf(key) < 0) {
            if (key === "contain_articles") {
              if (typeof item[key] === "object" && item[key] !== null && typeof item[key].length !== "undefined" && item[key].length > 0) {
                for (var i=0; i<=item[key].length-1; i++) {
                  var article = app.list["articles"][item[key][i].art_id];
                  if (typeof article !== "undefined") {
                    var obj = {article: article.name + " <span class=\"amount\">" + item[key][i].amount + "</span>"};
                    app.list.line(obj, content, "article", "line-article");
                  }
                }
              }
            } else {
              app.list.line(item, content, key);
            }
          }
        }
      },
      item: function(item, collection) {
        var div = document.querySelector(".pane-right .list .item.dummy").cloneNode(true);
        div.className = div.className.split(" dummy").join("");
        div.querySelector(".content").innerHTML = "";
        div.querySelector(".name").innerHTML = item.name;
        app.list.lines(item, div.querySelector(".content"), collection);
        app.list.element.appendChild(div);
        if (typeof app.list[collection.name + "s"] === "undefined") app.list[collection.name + "s"] = {};
        app.list[collection.name + "s"][item[collection.idKey + "_id"]] = item;
      },
      load: async function(collection) {
        if (typeof app.list[collection.name + "s"] === "undefined") app.list[collection.name + "s"] = {};
        document.querySelector(".pane-right .title").innerHTML = collection.name + "s";
        app.list.clear();
        app.loading.show();
        var result = await fetch("/api/" + collection.name);
        if (result.status === 200) {
          var list = (await result.json())[collection.key];
          for (var i=0; i<=list.length-1; i++) {
            app.list.item(list[i], collection);
          }
          app.loading.hide();
        } else {
          alert(await result.text());
        }
      },
      clear: function() {
        var items = app.list.element.querySelectorAll(".item:not(.dummy)");
        for (var i=0; i<=items.length-1; i++) {
          var item = items[i];
          item.parentElement.removeChild(item);
        }
      }
    },
    start: function() {
      var btnArticles = document.querySelector(".btn-articles");
      btnArticles.addEventListener("click", function(e) {
        e.preventDefault();
        app.list.load({name: "article", key: "inventory", idKey: "art"});
      });
      btnArticles.dispatchEvent(new CustomEvent("click"));
      var btnProducts = document.querySelector(".btn-products");
      btnProducts.addEventListener("click", function(e) {
        e.preventDefault();
        app.list.load({name: "product", key: "products", idKey: "product"});
      });
    }
  };
  app.start();
})();