var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var cors = require('cors');

var BaseController = require('./baseController');
var dataset = require('./dataset');

var toolkit = require('./toolkit');
var assign = toolkit.assign;
var each = toolkit.each;
var pick = toolkit.pick;

app.use(bodyParser.json({type: 'application/*+json'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(multer({storage: multer.memoryStorage()}).any());
app.use(cors());

function formatRequest(request) {

    return {
        requestBody: request.body,
        queryParams: request.query,
        params: request.params
    };

}

function dataToResponse(data, response) {

    var status = data[0];
    var headers = data[1];
    var responseText = data[2];

    response
        .status(status)
        .set(headers)
        .json(responseText === '""' ? undefined : JSON.parse(responseText));

}

module.exports = function(options) {

    options = assign({
        baseApiUrl: '/',
        port: 3000,
        resources: {},
        getResourceSlug: function(resourceName) {
            return resourceName;
        }
    }, options);

    dataset.import(options.resources);

    if (options.beforeServerStart) {
        options.beforeServerStart(app);
    }

    each(options.resources, function(config, resourceType) {

        var ResourceController = BaseController.extend({
            resourceType: resourceType
        });
        var resourceSlug = options.getResourceSlug(resourceType);
        var resourceController = new ResourceController(
            pick({
                pagination: options.pagination
            }, config, ['filters', 'validationRules'])
        );
        var resourceUrl = options.baseApiUrl + resourceSlug;

        // index
        app.get(resourceUrl, function(request, response) {
            dataToResponse(
                resourceController.list(formatRequest(request)),
                response
            );
        });

        // show
        app.get(resourceUrl + '/:id', function(request, response) {
            dataToResponse(
                resourceController.show(request.params.id, formatRequest(request)),
                response
            );
        });

        // create
        app.post(resourceUrl, function(request, response) {
            dataToResponse(
                resourceController.create(formatRequest(request)),
                response
            );
        });

        // Update
        ['put', 'patch', 'post'].forEach(function(method) {

            app[method](resourceUrl + '/:id', function(request, response) {
                dataToResponse(
                    resourceController.edit(request.params.id, formatRequest(request)),
                    response
                );
            });

        });

        // delete
        app.delete(resourceUrl + '/:id', function(request, response) {
            dataToResponse(
                resourceController.delete(request.params.id, formatRequest(request)),
                response
            );
        });

    });

    app.listen(options.port, function() {
        // eslint-disable-next-line no-console
        console.log('JSON api server started at localhost:' + options.port);
    });

};
