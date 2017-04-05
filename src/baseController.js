var typeFactory = require('type-factory');
var _ = require('underscore');
var Collection = require('./dataMapper').Collection;
var Model = require('./dataMapper').Model;

module.exports = typeFactory({

    resourceType: null,

    defaults: {
        filters: {},
        validationRules: {}
    },

    initialize: function(options) {

        this.options = _.extend({}, this.defaults, options);

    },

    list: function(request) {

        var collection = new Collection(this.resourceType);

        _.each(this.options.filters, function(filterCallback, key) {

            if (request.queryParams['filter['+ key +']']) {
                collection.filter(key, function(value, item) {
                    return filterCallback(value, request.queryParams['filter['+ key +']'], item);
                });
            }

        });

        collection.paginate(request.queryParams['page[offset]'], request.queryParams['page[limit]']);

        return this.response(request, collection.renderForApi());

    },

    show: function(id, request) {

        var model = new Model(this.resourceType).find(id);

        if (model.isEmpty()) {
            return this.response(request, '', {statusCode: 404});
        } else {
            return this.response(request, model.renderForApi());
        }

    },

    edit: function(id, request) {

        var data = JSON.parse(request.requestBody).data;
        var model = new Model(this.resourceType).find(id);

        model.setValidationRules(this.options.validationRules).validate(data);

        if (model.hasValidationErrors()) {

            return this.response(request, {errors: model.getValidationErrors()}, {statusCode: 409});

        } else {

            model.edit(data).save();

            return this.response(request, model.renderForApi());

        }

    },

    create: function(request) {

        var data = JSON.parse(request.requestBody).data;
        var model = new Model(this.resourceType).create(data);

        model.setValidationRules(this.options.validationRules).validate(data);

        if (model.hasValidationErrors()) {

            return this.response(request, {errors: model.getValidationErrors()}, {statusCode: 409});

        } else {

            model.save();

            return this.response(request, model.renderForApi());

        }

    },

    delete: function(id, request) {

        new Model(this.resourceType).find(id).remove();
        return this.response(request, '', {statusCode: 204});

    },

    response: function(request, data, options) {

        options = _.extend({
            statusCode: 200,
            headers: {'Content-Type': 'application/json'},
        }, options);

        // console.log(request.url, options.statusCode, options.headers, data); // eslint-disable-line

        return [options.statusCode, options.headers, JSON.stringify(data)];

    }

});
