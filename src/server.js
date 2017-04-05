var Pretender = require('pretender');
var typeFactory = require('type-factory');
var _ = require('underscore');
var BaseController = require('./baseController');
var dataset = require('./dataset');

var Server = typeFactory({

    constructor: function(options) {

        this.options = options;

        if (options.storageKey) {
            dataset.setStorageKey(options.storageKey);
        }

        this.importDataset().start();

    },

    importDataset: function() {

        dataset.import(_.mapObject(this.options.resources, function(config) {
            return typeof config.data === 'function' ? config.data(dataset.random) : config.data;
        }));

        return this;

    },

    start: function() {

        var options = this.options;
        var server = this.pretender = new Pretender();

        _.each(options.resources, function(config, resourceType) {

            var ResourceController = BaseController.extend({
                resourceType: resourceType
            });

            var resourceController = new ResourceController(_.pick(config, 'filters', 'validationRules'));

            server.get(options.baseApiUrl + '/' + resourceType, function(request) {
                return resourceController.list(request);
            });

            server.get(options.baseApiUrl + '/' + resourceType + '/:id', function(request) {
                return resourceController.show(request.params.id, request);
            });

            server.put(options.baseApiUrl + '/' + resourceType + '/:id', function(request) {
                return resourceController.edit(request.params.id, request);
            });

            server.post(options.baseApiUrl + '/' + resourceType, function(request) {
                return resourceController.create(request);
            });

            server.delete(options.baseApiUrl + '/' + resourceType + '/:id', function(request) {
                return resourceController.delete(request.params.id, request);
            });

        });

        return this;

    },

    stop: function() {

        dataset.clear();
        this.pretender.shutdown();
        return this;

    },

    resetData: function() {

        dataset.reset();
        return this;

    }

}, {
    resetData: function() {

        dataset.reset();
        return this;

    }
});

module.exports = Server;
