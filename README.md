# Fake JSON-api server
[![Build Status](https://travis-ci.org/dbrekalo/fake-json-api-server.svg?branch=master)](https://travis-ci.org/dbrekalo/fake-json-api-server)
[![Coverage Status](https://coveralls.io/repos/github/dbrekalo/fake-json-api-server/badge.svg?branch=master)](https://coveralls.io/github/dbrekalo/fake-json-api-server?branch=master)
[![NPM Status](https://img.shields.io/npm/v/fake-json-api-server.svg)](https://www.npmjs.com/package/fake-json-api-server)

Simple json-api server running in browser or node environment. Intercepts client XHR requests for defined routes when running in browser.
Useful for test runners and setting up fake backend api server for client applications.

[Visit documentation site](http://dbrekalo.github.io/fake-json-api-server/).

Fake json api server processes data per [json:api](http://jsonapi.org/) specification.
It can be easily configured to handle (paginated) get, post, put and delete requests for user defined resources.
Define dataset, filters and validation rules for each entity. Loaded dataset can be persisted to localStorage in browser.


## Examples and api
Create fake server instance with configuration object.
```js
new FakeJsonApiServer({
    baseApiUrl: '/api',
    resources: {
        tag: {
            data: [{
                type: 'tag',
                id: '1',
                attributes: {title: 'Tag 1'}},
            {
                type: 'tag',
                id: '2',
                attributes: {title: 'Tag 2'}
            }]
        }
    }
});

$.get('/api/tag', function(tagList) {
    // process tags json:api formatted data
});

$.get('/api/tag/1', function(tagData) {
    // process api data of tag with id 1
});
```
Persisting data to localStorage, setting up filters and validation rules for post and put request can be defined like so:
```js
new FakeJsonApiServer({
    baseApiUrl: '/api',
    storageKey: 'fakeServerStorage',
    resources: {
        article: {
            filters: {
                title: function(title, query) {
                    return title.toLowerCase().indexOf(query.toLowerCase()) >= 0;
                }
            },
            validationRules: {
                title: {
                    rule: function(title) {
                        return title.length > 0;
                    },
                    message: 'Please enter title.'
                }
            },
            data: function(random) {

                return _.chain(_.range(1, 9)).map(function(index) {
                    return {
                        type: 'article',
                        id: String(index),
                        attributes: {
                            title: 'Article title ' + index,
                            leadTitle: 'Article lead title ' + index,
                            published: random.boolean()
                        },
                        relationships: {
                            author: {data: {id: random.id(1, 5), type: 'user'}},
                            tags: {
                                data: [
                                    {id: random.id(1, 5), type: 'tag'},
                                    {id: random.id(6, 10), type: 'tag'},
                                    {id: random.id(1, 10), type: 'tag'}
                                ]
                            }
                        }
                    };
                }).value();

            }
        }
    }
});
```
## Node server setup
Following code will run fake json api server on localhost port 3000.

```js
// server.js
var FakeServer = require 'fake-json-api-server/src/nodeServer';

new FakeServer({
    port: 3000,
    resources: {
        tag: {
            data: [{
                type: 'tag',
                id: '1',
                attributes: {title: 'Tag 1'}},
            {
                type: 'tag',
                id: '2',
                attributes: {title: 'Tag 2'}
            }]
        }
    }
});

```

```bash
node server.js

```
Api is now setuped to serve tag resources in json-api format on http://localhost:3000/tag


## Installation
FakeJsonApiServer is packaged as UMD library so you can use it in CommonJS and AMD environment or with browser globals.

```bash
npm install fake-json-api-server --save
```

```js
// with bundlers
var FakeJsonApiServer = require('fake-json-api-server');

// with browser globals
var FakeJsonApiServer = window.FakeJsonApiServer;
```