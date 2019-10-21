var Pretender = require('pretender');
var typeFactory = require('type-factory');
var BaseController = require('./baseController');
var dataset = require('./dataset');
var mitty = require('mitty');

var toolkit = require('./toolkit');
var assign = toolkit.assign;
var each = toolkit.each;
var pick = toolkit.pick;

var Server = typeFactory({

    defaults: {
        baseApiUrl: '/',
        storageKey: undefined,
        storageVersion: undefined,
        resources: {},
        getResourceSlug: function(resourceName) {
            return resourceName;
        },
        delay: undefined
    },

    constructor: function(options) {

        this.options = assign({}, this.defaults, options);

        if (options.storageKey) {
            dataset.setStorageKey(options.storageKey);
        }

        if (options.storageVersion) {
            dataset.setStorageVersion(options.storageVersion);
        }

        dataset.import(this.options.resources);

        this.start();

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

        each(options.resources, function(config, resourceType) {

            var resourceSlug = options.getResourceSlug(resourceType);
            var resourceUrl = options.baseApiUrl + resourceSlug;

            var ResourceController = BaseController.extend({
                resourceType: resourceType
            });

            var resourceController = new ResourceController(
                pick({
                    pagination: options.pagination
                }, config, ['filters', 'validationRules'])
            );

            server.get(resourceUrl, function(request) {
                return routeProxy(request, function() {
                    return resourceController.list(request);
                });
            }, options.delay);

            server.get(resourceUrl + '/:id', function(request) {
                return routeProxy(request, function() {
                    return resourceController.show(request.params.id, request);
                });
            }, options.delay);

            ['put', 'patch', 'post'].forEach(function(method) {

                server[method](resourceUrl + '/:id', function(request) {
                    return routeProxy(request, function() {
                        return resourceController.edit(request.params.id, request);
                    });
                }, options.delay);

            });

            server.post(resourceUrl, function(request) {
                return routeProxy(request, function() {
                    return resourceController.create(request);
                });
            }, options.delay);

            server.delete(resourceUrl + '/:id', function(request) {
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
