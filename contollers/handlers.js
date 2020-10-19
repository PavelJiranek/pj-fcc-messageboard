const { isNil } = require("ramda");
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectID;
const {
    BOARDS_COLLECTION,
    handleDbErr,
    getThreadFromDbRes,
    encryptPwd,
    comparePwd,
    limitTo3RepliesWithReplyCount,
} = require('./utils')

/**
 *
 * @param {threadBody} body
 * @param {string} board
 * @returns threadDto
 */
const newThreadMapper = (body, board) => {
    return {
        board,
        ...body,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        delete_password: body.delete_password,
        replies: [],
    }
};

const postNewThread = (db, req, res) => {
    const { body, params: { board } } = req;
    const mappedThread = newThreadMapper(body, board);

    encryptPwd(mappedThread, thread => {
        db.collection(BOARDS_COLLECTION).insertOne(thread)
            .then(dbRes => {
                    const thread = getThreadFromDbRes(dbRes);
                    res.redirect(`/b/${thread.board}`);
                },
                err => handleDbErr(err, res));
    })

}

const getRecentThreads = (db, req, res) => {
    const { params: { board } } = req;

    db.collection(BOARDS_COLLECTION)
        .find({ board })
        .project({
            delete_password: 0,
            reported: 0,
        })
        .sort({ bumped_on: -1 })
        .limit(10)
        .toArray()
        .then(
            threads => res.send(limitTo3RepliesWithReplyCount(threads)),
            err => handleDbErr(err, res),
        );
}

const DELETE_SUCCESSFUL_MESSAGE = 'success';
const INCORRECT_PWD_MESSAGE = 'incorrect password';

const deleteThread = (db, req, res) => {
    const { body: { thread_id, delete_password } } = req;
    const threadId = ObjectId(thread_id);

    db.collection(BOARDS_COLLECTION)
        .findOne({ _id: threadId }, { delete_password: 1 })
        .then(thread => {
            if (!isNil(thread)) {
                comparePwd(delete_password, thread.delete_password, pwdMatching => {
                    if (pwdMatching) {
                        db.collection(BOARDS_COLLECTION)
                            .deleteOne({ _id: threadId })
                            .then(({ deletedCount }) => deletedCount === 1
                                ? res.send(DELETE_SUCCESSFUL_MESSAGE)
                                : res.send(INCORRECT_PWD_MESSAGE),
                            );
                    } else {
                        res.send(INCORRECT_PWD_MESSAGE);
                    }
                })
            } else {
                res.send(INCORRECT_PWD_MESSAGE);
            }
        })
}

module.exports = {
    postNewThread,
    getRecentThreads,
    deleteThread,
    INCORRECT_PWD_MESSAGE,
    DELETE_SUCCESSFUL_MESSAGE,
}


/**
 * @typedef threadBody
 * @property {string} text
 * @property {string} delete_password
 * @property {string} created_on
 * @property {string|undefined} bumped_on
 * @property {boolean} reported
 * @property {string[]|undefined} replies
 *
 * @typedef threadDtoOnlyFields
 * @property {string|undefined} _id
 * @property {string} board
 *
 * @typedef {threadBody & threadDtoOnlyFields} threadDto
 *
 */
