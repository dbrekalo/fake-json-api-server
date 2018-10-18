var toolkit = require('./toolkit');
var assign = toolkit.assign;
var findWhere = toolkit.findWhere;
var each = toolkit.each;

var initialDataSet;
var workingDataSet;
var storageKey;
var storageVersion = 'v1';

function saveToStorage(dataSnapshot) {

    if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(dataSnapshot));
    }

}

module.exports = {

    getCollection: function(resourceType) {

        return workingDataSet.resources[resourceType];

    },

    find: function(resourceType, id) {

        var datasetEntry = findWhere(this.getCollection(resourceType), {id: id});
        return datasetEntry;

    },

    update: function(model) {

        var datasetEntry = this.find(model.getType(), model.getId());
        var modelRelationships = model.getRelationships();

        assign(datasetEntry.attributes, model.getAttributes());

        if (modelRelationships) {
            datasetEntry.relationships = assign({}, datasetEntry.relationships, modelRelationships);
        }

        saveToStorage(workingDataSet);

        return datasetEntry.id;

    },

    add: function(model) {

        var collection = this.getCollection(model.getType());
        var id = (collection.length === 0 ? 1 : parseInt(collection[collection.length - 1].id) + 1).toString();
        var modelRelationships = model.getRelationships();

        var datasetEntry = {
            id: id,
            type: model.getType(),
            attributes: model.getAttributes()
        };

        if (modelRelationships) {
            datasetEntry.relationships = modelRelationships;
        }

        collection.push(datasetEntry);

        saveToStorage(workingDataSet);

        return id;

    },

    remove: function(model) {

        var collection = this.getCollection(model.getType());
        var datasetEntry = this.find(model.getType(), model.getId());

        collection.splice(collection.indexOf(datasetEntry), 1);

        saveToStorage(workingDataSet);

        return model;

    },

    reset: function() {

        saveToStorage(initialDataSet);
        workingDataSet = JSON.parse(JSON.stringify(initialDataSet));

        return this;

    },

    import: function(input) {

        var data = {
            version: storageVersion,
            resources: {}
        };

        each(input, function(config, resourceName) {
            data.resources[resourceName] = typeof config.data === 'function'
                ? config.data(this.random)
                : config.data
            ;
        }, this);

        initialDataSet = data;

        if (storageKey) {

            var storedData = JSON.parse(localStorage.getItem(storageKey));

            if (
                (!storedData) ||
                (typeof storedData.version === 'undefined') ||
                (storageVersion !== storedData.version)
            ) {
                saveToStorage(data);
            }

            workingDataSet = JSON.parse(localStorage.getItem(storageKey));

        } else {

            workingDataSet = JSON.parse(JSON.stringify(data));

        }

        return this;

    },

    setStorageKey: function(key) {

        storageKey = key.toString();
        return this;

    },

    setStorageVersion: function(version) {

        storageVersion = version.toString();
        return this;

    },

    clear: function() {

        initialDataSet = null;
        workingDataSet = null;

        if (storageKey) {
            localStorage.removeItem(storageKey);
        }

        return this;

    },

    random: {

        boolean: function() {

            return Math.random() >= 0.5;

        },

        int: function(min, max) {

            return parseInt(Math.random() * (max - min) + min, 10);

        },

        id: function(min, max) {

            return String(this.int(min, max));

        }

    }
};
