'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

app.use(helmet({
    frameguard: { action: 'sameorigin' },
    dnsPrefetchControl: { allow: false },
    referrerPolicy: { policy: "same-origin" },
}));

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Sample front-end
app.route('/b/:board/')
    .get(function (req, res) {
        res.sendFile(process.cwd() + '/views/board.html');
    });
app.route('/b/:board/:threadid')
    .get(function (req, res) {
        res.sendFile(process.cwd() + '/views/thread.html');
    });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//Sample Front-end

    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});
const PORT = process.env.PORT || 4000;

//Start our server and tests!
app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
    if (process.env.NODE_ENV === 'test') {
        console.log('Running Tests...');
        setTimeout(function () {
            try {
                runner.run();
            } catch (e) {
                const error = e;
                console.log('Tests are not valid:');
                console.log(error);
            }
        }, 1500);
    }
});

module.exports = app; //for testing
