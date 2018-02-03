var FakeServer = require('../src/nodeServer');
var resourceConfig = require('./resourcesConfig');

new FakeServer({
    port: 3000,
    resources: resourceConfig
});