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
const TESTING_REPLY_TEXT = 'testing reply';

const createThread = (threadFields = {}, done) => {
    chai.request(server)
        .post(`/api/threads/${BOARD_NAME}`)
        .send({
            ...threadFields,
            delete_password: DELETE_PWD,
        })
        .end((err, res) => done(res));
}

const getLatestThread = (done) => {
    chai.request(server)
        .get(`/api/threads/${BOARD_NAME}`)
        .end((err, res) => {
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

const createAndGetThreadWithReply = done => {
    createThread({ text: 'testing thread' },
        () => getLatestThread((thread) => {
            chai.request(server)
                .post(`/api/replies/${BOARD_NAME}`)
                .send({
                    thread_id: thread._id,
                    text: TESTING_REPLY_TEXT,
                    delete_password: DELETE_PWD,
                })
                .end(() => {
                    chai.request(server)
                        .get(`/api/replies/${BOARD_NAME}`)
                        .query({
                            thread_id: thread._id,
                        })
                        .end((err, res) => {
                            const reply = res.body.replies[0];
                            done(thread, reply)
                        })
                })
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
                                assert.equal(res.text, SUCCESS_MESSAGE);

                                done();
                            });
                    })
                )
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
                });
            })
        });

        suite('GET', function () {
            test('GET thread with replies', function (done) {
                const replyText = `reply ${new Date()}`;
                createAndGetThread(({ _id }) => {
                    chai.request(server)
                        .post(`/api/replies/${BOARD_NAME}`)
                        .send({
                            thread_id: _id,
                            text: replyText,
                            delete_password: DELETE_PWD,
                        })
                        .end(function () {
                            chai.request(server)
                                .get(`/api/replies/${BOARD_NAME}`)
                                .query({
                                    thread_id: _id,
                                })
                                .end(function (err, res) {
                                    assert.equal(res.body._id, _id);
                                    assert.equal(res.body.replies.length, 1);
                                    assert.equal(res.body.replies[0].text, replyText);
                                    assert.property(res.body, "text");
                                    assert.property(res.body, "created_on");
                                    assert.property(res.body, "bumped_on");
                                    assert.property(res.body, "_id");
                                    assert.isUndefined(res.body.reported);
                                    assert.isUndefined(res.body.delete_password);

                                    done();
                                });
                        });
                });
            })
        });

        suite('PUT', function () {
            test('Report a reply', function (done) {
                createAndGetThreadWithReply((
                    { _id: thread_id },
                    { _id: reply_id, reported: reply_reported }) => {
                    assert.equal(reply_reported, false); // sanity check

                    chai.request(server)
                        .put(`/api/replies/${BOARD_NAME}`)
                        .send({
                            thread_id,
                            reply_id,
                        })
                        .end(function (err, res) {
                            assert.equal(res.status, 200);
                            assert.equal(res.text, SUCCESS_MESSAGE);

                            getLatestThread(({ replies }) => {
                                const [latestReply] = replies;

                                assert.equal(latestReply._id, reply_id);
                                assert.equal(latestReply.reported, true);

                                done();
                            })
                        });
                });
            })
        });

        suite('DELETE', function () {
            test('DELETE a reply', function (done) {
                createAndGetThreadWithReply((
                    { _id: thread_id },
                    { _id: reply_id, text: reply_text }) => {
                    assert.equal(reply_text, TESTING_REPLY_TEXT); // sanity check

                    chai.request(server)
                        .delete(`/api/replies/${BOARD_NAME}`)
                        .send({
                            thread_id,
                            reply_id,
                            delete_password: DELETE_PWD,
                        })
                        .end(function (err, res) {
                            assert.equal(res.status, 200);
                            assert.equal(res.text, SUCCESS_MESSAGE);

                            getLatestThread(({ replies }) => {
                                const [latestReply] = replies;

                                assert.equal(latestReply._id, reply_id);
                                assert.equal(latestReply.text, "[deleted]");

                                done();
                            })
                        });
                });
            })

            test('try to DELETE a reply with incorrect pwd', function (done) {
                createAndGetThreadWithReply((
                    { _id: thread_id },
                    { _id: reply_id }) => {
                    chai.request(server)
                        .delete(`/api/replies/${BOARD_NAME}`)
                        .send({
                            thread_id,
                            reply_id,
                            delete_password: "incorrect pwd",
                        })
                        .end(function (err, res) {
                            assert.equal(res.status, 200);
                            assert.equal(res.text, INCORRECT_PWD_MESSAGE);

                            done();
                        })
                });
            })
        });

    });

});
