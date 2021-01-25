exports = module.exports = function() {
  return {
    host: "127.0.0.1",
    port: 3000,
    mongodb: {
      host: "127.0.0.1",
      port: 27017,
      dbname: "warehouse"
    },
    logs: {
      api: true // To show API logs on Node.js console
    }
  };
};