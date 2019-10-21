var FakeServer = require('../src/nodeServer');
var resourceConfig = require('./resourcesConfig');
var slugMap = {article: 'articles'};

new FakeServer({
    baseApiUrl: '/api/',
    getResourceSlug: function(name) {
        return slugMap[name] || name;
    },
    port: 3000,
    pagination: {
        strategy: 'pageBased',
        numberKey: 'number',
        limitKey: 'size'
    },
    resources: resourceConfig
});
