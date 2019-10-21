var typeFactory = require('type-factory');
var Collection = require('./dataMapper').Collection;
var Model = require('./dataMapper').Model;
var toolkit = require('./toolkit');
var assign = toolkit.assign;
var each = toolkit.each;

module.exports = typeFactory({

    resourceType: null,

    assignOptions: true,

    defaults: {
        filters: {},
        validationRules: {},
        pagination: {
            strategy: 'offsetBased',
            offsetKey: 'offset',
            limitKey: 'limit'
        },
    },

    getRequestBodyData: function(request) {

        var body = request.requestBody;
        var data;

        if (typeof window !== 'undefined' && body instanceof window.FormData) {
            data = JSON.parse(body.get('data'));
        } else {
            data = typeof body === 'string' ? JSON.parse(body).data : body.data;
        }

        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        return data;

    },

    list: function(request) {

        var collection = new Collection(this.resourceType);
        var queryParams = request.queryParams;

        each(this.options.filters, function(filterCallback, key) {

            var filterValue = queryParams.filter && queryParams.filter[key] ?
                queryParams.filter[key] :
                queryParams['filter['+ key +']'];

            if (filterValue) {
                collection.filter(key, function(value, item) {
                    return filterCallback(value, filterValue, item);
                });
            }

        });

        var pagination = this.options.pagination;
        var limitKey = pagination.limitKey;
        var offset;
        var limit;

        if (pagination.strategy === 'offsetBased') {

            var offsetKey = pagination.offsetKey;

            offset = queryParams.page
                ? queryParams.page[offsetKey]
                : queryParams['page[' + offsetKey + ']']
            ;
            limit = queryParams.page
                ? queryParams.page[limitKey]
                : queryParams['page[' + limitKey + ']']
            ;

        } else if (pagination.strategy === 'pageBased') {

            var numberKey = pagination.numberKey;

            var pageNumber = queryParams.page
                ? queryParams.page[numberKey]
                : queryParams['page[' + numberKey + ']'];

            limit = queryParams.page
                ? queryParams.page[limitKey]
                : queryParams['page[' + limitKey + ']'];

            if (limit) {
                limit = parseInt(limit, 10) || undefined;
            }

            if (limit && pageNumber) {
                offset = ((parseInt(pageNumber, 10) || 1) - 1) * limit;
            }

        }

        collection.paginate(offset, limit);

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

        var data = this.getRequestBodyData(request);
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

        var data = this.getRequestBodyData(request);
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

        options = assign({
            statusCode: 200,
            headers: {'Content-Type': 'application/json'},
        }, options);

        return [options.statusCode, options.headers, JSON.stringify(data)];

    }

});
