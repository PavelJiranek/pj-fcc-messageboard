const {  } = require("ramda");
const {
    BOARDS_COLLECTION,
    handleDbErr,
    getThreadFromDbRes,
    encryptPwd,
    limitTo3Replies,
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
            threads => res.send(limitTo3Replies(threads)),
            err => handleDbErr(err, res),
        );
}

module.exports = {
    postNewThread,
    getRecentThreads,
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
