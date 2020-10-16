/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const server = require('../server');

chai.use(chaiHttp);

const BOARD_NAME = `functional-tests-${new Date().getTime()}`;

const createThread = (threadFields = {}, done) => {
    chai.request(server)
        .post(`/api/threads/${BOARD_NAME}`)
        .send({
            ...threadFields,
            delete_password: "pwd",
        })
        .end(function (err, res) {
            done(res);
        });
}

suite('Functional Tests', function () {
    this.timeout(25000); // for db connection

    suite('API ROUTING FOR /api/threads/:board', function () {

        suite('POST', function () {
            test('POST a new thread and redirect', function (done) {
                    chai.request(server)
                        .post(`/api/threads/${BOARD_NAME}`)
                        .send({
                            text: "text",
                            delete_password: "pwd",
                        })
                        .end(function (err, res) {
                            assert.equal(res.status, 200);
                            assert.match(res.redirects[0], new RegExp(BOARD_NAME));

                            done();
                        });
                },
            )
        });

        suite('GET', function () {
            test('GET threads for a board', function (done) {
                    const threadText = `test ${new Date()}`;
                    createThread({ text: threadText }, () => {
                        chai.request(server)
                            .get(`/api/threads/${BOARD_NAME}`)
                            .end(function (err, res) {
                                assert.equal(res.status, 200);
                                assert.isBelow(res.body.length, 11);

                                const [createdThread] = res.body;
                                assert.equal(createdThread.board, BOARD_NAME);
                                assert.equal(createdThread.text, threadText);
                                assert.property(createdThread, "created_on");
                                assert.property(createdThread, "bumped_on");
                                assert.property(createdThread, "_id");
                                assert.equal(createdThread.replies.length, 0);
                                assert.isUndefined(createdThread.reported);
                                assert.isUndefined(createdThread.delete_password);

                                done();
                            });
                    })
                },
            )
        });

        suite('DELETE', function () {

        });

        suite('PUT', function () {

        });


    });

    suite('API ROUTING FOR /api/replies/:board', function () {

        suite('POST', function () {

        });

        suite('GET', function () {

        });

        suite('PUT', function () {

        });

        suite('DELETE', function () {

        });

    });

});
