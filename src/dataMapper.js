var typeFactory = require('type-factory');
var dataset = require('./dataset');

var toolkit = require('./toolkit');
var assign = toolkit.assign;
var each = toolkit.each;
var isArray = toolkit.isArray;

function getIncluded(data, foundRelationKeys) {

    var searchData = isArray(data) ? data : [data];
    var included = [];

    foundRelationKeys = foundRelationKeys || searchData.map(function(item) {
        return item.id + '@' + item.type;
    });

    each(searchData, function(item) {
        each(item.relationships || {}, function(relationData) {
            each(isArray(relationData.data) ? relationData.data : [relationData.data], function(item) {

                if (item) {

                    var relationKey = item.id + '@' + item.type;

                    if (foundRelationKeys.indexOf(relationKey) < 0) {

                        var relatedItem = dataset.find(item.type, item.id);

                        included.push(relatedItem);
                        foundRelationKeys.push(relationKey);

                        if (relatedItem.relationships) {

                            included = included.concat(getIncluded(relatedItem, foundRelationKeys));

                        }
                    }

                }

            });
        });
    });

    return included;

}

var Collection = typeFactory({

    initialize: function(type) {

        this.type = type;
        this.data = dataset.getCollection(type).slice();
        this.setSize(this.data.length);

    },

    setSize: function(size) {

        this.size = size;
        return this;

    },

    paginate: function(start, limit) {

        start = typeof start === 'undefined' ? 0 : parseInt(start, 10);
        limit = typeof limit === 'undefined' ? this.data.length : parseInt(limit, 10);

        this.data = this.data.slice(start, start + limit);

        return this;

    },

    filter: function(key, filterCallback) {

        this.data = this.data.filter(function(item) {

            var value = item.attributes[key] !== undefined
                ? item.attributes[key]
                : (item.relationships && item.relationships[key] && item.relationships[key].data)
            ;

            return filterCallback(value, item);

        });

        this.size = this.data.length;

        return this;

    },

    renderForApi: function() {

        var included = getIncluded(this.data);

        return assign({
            jsonapi: {version: '1.0'},
            meta: {total: String(this.size)},
            data: this.data
        }, included.length ? {included: included} : undefined);

    }

});

var Model = typeFactory({

    initialize: function(type) {

        this.type = type;
        this.data = {};

    },

    getAttributes: function() {

        return this.data.attributes;

    },

    getRelationships: function() {

        return this.data.relationships;

    },

    getType: function() {

        return this.type;

    },

    getId: function() {

        return this.data.id;

    },

    isNew: function() {

        return !this.getId();

    },

    find: function(id) {

        this.data = dataset.find(this.getType(), id) || {};
        return this;

    },

    create: function(data) {

        assign(this.data, {
            attributes: data.attributes,
            relationships: data.relationships
        });

        return this;

    },

    edit: function(data) {

        assign(this.data.attributes, data.attributes);
        assign(this.data.relationships, data.relationships);

        return this;

    },

    save: function() {

        var id = this.isNew() ? dataset.add(this) : dataset.update(this);
        return this.find(id);

    },

    remove: function() {

        dataset.remove(this);
        return this;

    },

    isEmpty: function() {

        return Object.keys(this.data).length === 0 && this.data.constructor === Object;

    },

    setValidationRules: function(rules) {

        this.validationRules = rules;

        return this;

    },

    validate: function(data) {

        var attributes = data.attributes || {};
        var relationships = data.relationships;

        this.validationErrors = [];

        each(this.validationRules || {}, function(ruleConfig, key) {

            var keyIsRelation = relationships && relationships[key];
            var value = attributes[key] !== undefined ? attributes[key] : (keyIsRelation && relationships[key].data);
            var validationCallback = ruleConfig.rule;

            if (typeof value !== 'undefined' && !validationCallback(value)) {
                this.validationErrors.push({
                    title: ruleConfig.message,
                    source: {pointer: '/data/' + (keyIsRelation ? 'relationships' : 'attributes') + '/' + key}
                });
            }

        }, this);

        return this;

    },

    hasValidationErrors: function() {

        return this.validationErrors && this.validationErrors.length > 0;

    },

    getValidationErrors: function() {

        return this.validationErrors;

    },

    renderForApi: function() {

        var included = getIncluded(this.data);

        return assign({
            jsonapi: {version: '1.0'},
            data: this.data,
        }, included.length ? {included: included} : undefined);

    }

});

module.exports = {
    Collection: Collection,
    Model: Model
};
