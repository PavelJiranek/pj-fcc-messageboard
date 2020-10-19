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
const server = require('../server');
const { INCORRECT_PWD_MESSAGE, SUCCESS_MESSAGE } = require('../contollers/handlers');

chai.use(chaiHttp);

const BOARD_NAME = `functional-tests-${new Date().getTime()}`;
const DELETE_PWD = "pwd";

const createThread = (threadFields = {}, done) => {
    chai.request(server)
        .post(`/api/threads/${BOARD_NAME}`)
        .send({
            ...threadFields,
            delete_password: DELETE_PWD,
        })
        .end(function (err, res) {
            done(res);
        });
}

const getLatestThread = (done) => {
    chai.request(server)
        .get(`/api/threads/${BOARD_NAME}`)
        .end(function (err, res) {
            const latestThread = res.body[0];
            done(latestThread);
        });
}

const createAndGetThread = done => {
    createThread({ text: 'testing thread' },
        () => getLatestThread((thread) => {
            done(thread)
        }),
    );
};

suite('Functional Tests', function () {
    this.timeout(60000); // for db connection

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
            test("DELETE a thread", function (done) {
                const threadText = `thread to be deleted ${new Date()}`;
                createThread({ text: threadText },
                    () => getLatestThread(({ _id }) => {
                        chai.request(server)
                            .delete(`/api/threads/${BOARD_NAME}`)
                            .send({
                                thread_id: _id,
                                delete_password: DELETE_PWD,
                            })
                            .end(function (err, res) {
                                assert.equal(res.status, 200);
                                assert.equal(res.text, SUCCESS_MESSAGE)

                                done();
                            });
                    }))
            });

            test("try to DELETE a thread with incorrect pwd", function (done) {
                const threadText = `thread to be deleted ${new Date()}`;
                createThread({ text: threadText },
                    () => getLatestThread(({ _id }) => {
                        chai.request(server)
                            .delete(`/api/threads/${BOARD_NAME}`)
                            .send({
                                thread_id: _id,
                                delete_password: "incorrect pwd",
                            })
                            .end(function (err, res) {
                                assert.equal(res.status, 200);
                                assert.equal(res.text, INCORRECT_PWD_MESSAGE)

                                done();
                            });
                    }))
            })
        });

        suite('PUT', function () {
            test('Report a thread', function (done) {
                const threadText = `thread to be reported ${new Date()}`;
                createThread({ text: threadText },
                    () => getLatestThread(({ _id }) => {
                        chai.request(server)
                            .put(`/api/threads/${BOARD_NAME}`)
                            .send({
                                thread_id: _id,
                            })
                            .end(function (err, res) {
                                assert.equal(res.status, 200);
                                assert.equal(res.text, SUCCESS_MESSAGE)

                                done();
                            });
                    }))
            })
        });


    });

    suite('API ROUTING FOR /api/replies/:board', function () {

        suite('POST', function () {
            test('POST a new reply and redirect', function (done) {
                const replyText = `reply ${new Date()}`;
                createAndGetThread(({ _id }) => {
                        chai.request(server)
                            .post(`/api/replies/${BOARD_NAME}`)
                            .send({
                                thread_id: _id,
                                text: replyText,
                                delete_password: DELETE_PWD,
                            })
                            .end(function (err, res) {
                                assert.equal(res.status, 200);
                                assert.match(res.redirects[0], new RegExp(`${BOARD_NAME}/${_id}`));

                                getLatestThread(({ replies }) => {
                                    assert.equal(replies[0].text, replyText);
                                    done();
                                })
                            });
                    },
                );
            })
        });

        suite('GET', function () {

        });

        suite('PUT', function () {

        });

        suite('DELETE', function () {

        });

    });

});
