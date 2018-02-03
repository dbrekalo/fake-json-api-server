var _ = require('underscore');

module.exports = {
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