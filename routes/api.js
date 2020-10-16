/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const { postNewThread } = require('../contollers/handler');
const { connectToDb } = require('../contollers/utils');


module.exports = function (app) {
    let db;
    db = connectToDb().then(connection => db = connection);

    app.route('/api/threads/:board')
        .post(async (req, res) => {
            connectToDb(db).then(connection => postNewThread(connection, req, res));
        });

    app.route('/api/replies/:board');

};
