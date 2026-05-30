module.exports = {
  collection: './postman/tienda-api.postman_collection.json',
  environment: './postman/tienda-api.postman_environment.json',
  reporters: ['cli', 'htmlextra'],
  reporter: {
    htmlextra: {
      export: './postman/reports/newman-report.html',
      title: 'Tienda API - Newman Report',
    },
  },
  iterationCount: 1,
  timeout: 30000,
  delayRequest: 100,
};
