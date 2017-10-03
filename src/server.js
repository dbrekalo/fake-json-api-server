var Pretender = require('pretender');
var typeFactory = require('type-factory');
var _ = require('underscore');
var BaseController = require('./baseController');
var dataset = require('./dataset');
var mitty = require('mitty');

var Server = typeFactory({

    defaults: {
        baseApiUrl: '/',
        storageKey: undefined,
        resources: {},
        delay: undefined
    },

    constructor: function(options) {

        this.options = _.extend({}, this.defaults, options);

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

        var self = this;
        var options = this.options;
        var server = this.pretender = new Pretender();

        var routeProxy = function(request, callback) {
            self.trigger('request', request);
            var response;
            try {
                response = callback(request);
            } catch (e) {
                response = [500, {'Content-Type': 'application/json'}, e.toString()];
            }
            self.trigger('response', response);
            return response;
        };

        _.each(options.resources, function(config, resourceType) {

            var ResourceController = BaseController.extend({
                resourceType: resourceType
            });

            var resourceController = new ResourceController(_.pick(config, 'filters', 'validationRules'));

            server.get(options.baseApiUrl + '/' + resourceType, function(request) {
                return routeProxy(request, function() {
                    return resourceController.list(request);
                });
            }, options.delay);

            server.get(options.baseApiUrl + '/' + resourceType + '/:id', function(request) {
                return routeProxy(request, function() {
                    return resourceController.show(request.params.id, request);
                });
            }, options.delay);

            _.each(['put', 'post'], function(method) {

                server[method](options.baseApiUrl + '/' + resourceType + '/:id', function(request) {
                    return routeProxy(request, function() {
                        return resourceController.edit(request.params.id, request);
                    });
                }, options.delay);

            });

            server.post(options.baseApiUrl + '/' + resourceType, function(request) {
                return routeProxy(request, function() {
                    return resourceController.create(request);
                });
            }, options.delay);

            server.delete(options.baseApiUrl + '/' + resourceType + '/:id', function(request) {
                return routeProxy(request, function() {
                    return resourceController.delete(request.params.id, request);
                });
            }, options.delay);

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

mitty(Server.prototype);

module.exports = Server;
