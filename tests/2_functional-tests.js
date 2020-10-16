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
