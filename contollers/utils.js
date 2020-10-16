const bcrypt = require("bcrypt");
const mongodb = require('mongodb');
const mongo = mongodb.MongoClient;
const { map, isNil, path, lensProp, over, take, pipe, prop, assoc, length } = require("ramda");

const CONNECTION_STRING = process.env.MONGO_URI;
const BOARDS_COLLECTION = "messageBoard.boards";
const SALT_ROUNDS = 12;

const encryptPwd = (threadBody, callback) => bcrypt.hash(threadBody.delete_password, SALT_ROUNDS, (err, hash) => {
    callback({
        ...threadBody,
        delete_password: hash,
    })
});

const connectToDb = async db => {
    if (isNil(db)) {
        console.log("Connecting to the db...");
        db = await mongo.connect(CONNECTION_STRING).then(client => {
                console.log("Successful database connection");
                return client.db(process.env.MONGO_DB);
            }, err => console.log("Database error: " + err),
        )
    }

    return db;
}

const getThreadFromDbRes = path(['ops', 0]);

const handleDbErr = (err, res) => {
    res.status(400);
    res.send(err);
}

const responsesLens = lensProp('replies');
const limitRepliesTo3 = over(responsesLens, take(3));
const getRepliesCount = pipe(prop('replies'), length);
const setReplyCount = thread => assoc("replycount", getRepliesCount(thread), thread);

const limitTo3RepliesWithReplyCount = pipe(
    map(setReplyCount),
    map(limitRepliesTo3),
);

module.exports = {
    CONNECTION_STRING,
    BOARDS_COLLECTION,
    encryptPwd,
    connectToDb,
    getThreadFromDbRes,
    handleDbErr,
    limitTo3RepliesWithReplyCount,
}
