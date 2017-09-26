var assert = require('chai').assert;
var $ = require('jquery');
var _ = require('underscore');
var FakeServer = require('../');

var apiUrl = window.location.href + '/api';

var serverConfig = {
    baseApiUrl: apiUrl,
    storageKey: undefined,
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
        },
        tag: {
            data: _.chain(_.range(1, 10)).map(function(index) {
                return {
                    type: 'tag',
                    id: String(index),
                    attributes: {
                        title: 'Tag ' + index
                    }
                };
            }).value()
        },
        user: {
            data: function(random) {

                return _.chain(_.range(1, 5)).map(function(index) {
                    return {
                        type: 'user',
                        id: String(index),
                        attributes: {
                            email: 'test.user' + index + '@gmail.com'
                        },
                        relationships: {
                            boss: {data: {id: random.id(1, 5), type: 'user'}}
                        }
                    };
                }).value();

            }
        }
    }
};

var fakeServer;

beforeEach(function() {
    fakeServer = new FakeServer(serverConfig);
});

afterEach(function() {
    fakeServer && fakeServer.stop();
});

describe('Fake json api server', function() {

    it('returns resource list', function(done) {

        $.get(apiUrl + '/article', function(apiData) {

            assert.isArray(apiData.data);
            assert.equal(apiData.data[0].attributes.title, 'Article title 1');
            done();

        });

    });

    it('builds resource list includes', function(done) {

        $.get(apiUrl + '/article', function(apiData) {

            assert.isArray(apiData.included);
            assert.isDefined(_.find(apiData.included, function(item) {
                return item.type === 'user';
            }));
            assert.isDefined(_.find(apiData.included, function(item) {
                return item.type === 'tag';
            }));
            done();

        });

    });

    it('paginates resource lists', function(done) {

        $.get(apiUrl + '/article?page[offset]=2&page[limit]=2', function(apiData) {

            assert.strictEqual(apiData.data.length, 2);
            assert.strictEqual(apiData.data[0].id, '3');
            done();

        });

    });

    it('filters resource lists', function(done) {

        $.get(apiUrl + '/article?filter[title]=Article title 1', function(apiData) {

            assert.strictEqual(apiData.data.length, 1);
            assert.strictEqual(apiData.data[0].attributes.title, 'Article title 1');
            done();

        });

    });

    it('returns single resource', function(done) {

        $.get(apiUrl + '/article/1', function(apiData) {

            assert.isObject(apiData.data);
            assert.strictEqual(apiData.data.attributes.title, 'Article title 1');
            done();

        });

    });

    it('returns 404 for unavailable resources', function(done) {

        $.get(apiUrl + '/article/999').fail(function(response) {
            done();
        });

    });

    it('updates single resource', function(done) {

        var payload = JSON.stringify({
            data: {
                type: 'article',
                id: '1',
                attributes: {title: 'Test article title 1'}
            }
        });

        $.ajax({url: apiUrl + '/article/1', method: 'PUT', data: payload}).done(function(apiData) {
            assert.strictEqual(apiData.data.attributes.title, 'Test article title 1');
            done();
        });

    });

    it('renders validation errors on update', function(done) {

        var payload = JSON.stringify({
            data: {
                type: 'article',
                id: '1',
                attributes: {title: ''}
            }
        });

        $.ajax({url: apiUrl + '/article/1', method: 'PUT', data: payload}).fail(function(response) {
            assert.deepEqual(response.responseJSON, {
                errors: [{title: 'Please enter title.', source: {pointer: '/data/attributes/title'}}]
            });
            done();
        });

    });

    it('creates resource', function(done) {

        var payload = JSON.stringify({
            data: {
                type: 'article',
                attributes: {title: 'New article'},
                relationships: {
                    author: {data: {id: '1', type: 'user'}},
                    tags: {
                        data: [
                            {id: '1', type: 'tag'}
                        ]
                    }
                }
            }
        });

        $.ajax({url: apiUrl + '/article', method: 'POST', data: payload}).done(function(apiData) {
            assert.strictEqual(apiData.data.attributes.title, 'New article');
            done();
        });

    });

    it('creates resource via FormData', function(done) {

        var formData = new FormData();

        formData.append('data', JSON.stringify({
            type: 'article',
            attributes: {title: 'New article'},
            relationships: {
                author: {data: {id: '1', type: 'user'}},
                tags: {
                    data: [
                        {id: '1', type: 'tag'}
                    ]
                }
            }
        }));

        $.ajax({
            url: apiUrl + '/article',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false
        }).done(function(apiData) {
            assert.strictEqual(apiData.data.attributes.title, 'New article');
            done();
        });

    });

    it('renders validation errors on create', function(done) {

        var payload = JSON.stringify({
            data: {
                type: 'article',
                id: '1',
                attributes: {title: ''}
            }
        });

        $.ajax({url: apiUrl + '/article', method: 'POST', data: payload}).fail(function(response) {
            assert.deepEqual(response.responseJSON, {
                errors: [{title: 'Please enter title.', source: {pointer: '/data/attributes/title'}}]
            });
            done();
        });

    });

    it('returns 500 server error when data is malformed', function(done) {

        $.ajax({
            url: apiUrl + '/article',
            method: 'POST',
            data: JSON.stringify({foo: 'bar'})
        }).fail(function(response) {
            done();
        });

    });

    it('deletes resource', function(done) {

        $.ajax({url: apiUrl + '/article/1', method: 'DELETE', data: ''}).done(function() {

            $.get(apiUrl + '/article/1').fail(function() {
                done();
            });

        });

    });

    it('resets dataset via instance method', function(done) {

        $.ajax({url: apiUrl + '/article/1', method: 'DELETE'}).done(function() {

            fakeServer.resetData();

            $.get(apiUrl + '/article/1').done(function() {
                done();
            });

        });

    });

    it('resets dataset via static method', function(done) {

        $.ajax({url: apiUrl + '/article/1', method: 'DELETE'}).done(function() {

            FakeServer.resetData();

            $.get(apiUrl + '/article/1').done(function() {
                done();
            });

        });

    });

    it('saves data to localstorage', function() {

        fakeServer && fakeServer.stop();
        fakeServer = new FakeServer(_.extend({}, serverConfig, {storageKey: 'fakeServerStorage'}));

        assert.isDefined(window.localStorage.getItem('fakeServerStorage'));

    });

});
