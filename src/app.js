require('dotenv').config()
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const cookieParser = require('cookie-parser');
const freeRouter = require('./routers/free');
const loggedRouter = require('./routers/logged');
const unloggedRouter = require('./routers/unlogged');
const { verifyToken } = require('./middleware/auth');

// Create app, set port number:
const app = express();
const port = process.env.PORT || 3000;

app.enable('trust proxy');

// Connect to the database:
require('./db/connect');

// Use cookie-parser middleware:
app.use(cookieParser());

// Allow json and x-www-form-urlencoded as body parsers for POST method:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Local paths:
const pubDir = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');

// Setup handlebars. Set views and partials locations:
app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);

// Set static directory:
app.use(express.static(pubDir));

// Use routers:
app.use(freeRouter);
app.use(loggedRouter);
app.use(unloggedRouter);

// Route for 404 page:
app.get('*', verifyToken, (req, res) => {
	res.render('message', {
		user: req.user,
		message: 'Page not found!'
	});
});

// Start server:
app.listen(port, () => {
	console.log('Server listening on port', port);
});
