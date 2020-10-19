/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const { connectToDb } = require('../contollers/utils');
const {
    postNewThread,
    getRecentThreads,
    deleteThread,
} = require('../contollers/handlers');


module.exports = function (app) {
    let db;
    db = connectToDb().then(connection => db = connection);

    app.route('/api/threads/:board')
        .post(async (req, res) => {
            db = await connectToDb(db)
            postNewThread(db, req, res);
        })
        .get(async (req, res) => {
            db = await connectToDb(db)
            getRecentThreads(db, req, res);
        })
        .delete(async (req, res) => {
            db = await connectToDb(db)
            deleteThread(db, req, res);
        });


    app.route('/api/replies/:board');

};
