const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./logger');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

class DrawingService {
  constructor() {
    this.x = [];
    this.y = [];
    this.firstXIdx = 0;
    this.id = 0;
  }

  async find() {
    const { x, y, firstXIdx } = this;
    return { x, y, firstXIdx };
  }

  async create({ x, y }) {
    this.x.push(x);
    this.y.push(y);
    return { x, y };
  }

  async update(_id, _data) {
    this.firstXIdx = this.x.length;
    const { firstXIdx } = this;
    return { firstXIdx };
  }

  async remove(_id) {
    this.x = [];
    this.y = [];
    const { x, y } = this;
    return { x, y };
  }
}

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');

const authentication = require('./authentication');

const app = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet());
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());

app.use('/draw', new DrawingService());

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

app.on('connection', connection => app.channel('everybody').join(connection));
app.publish(data => app.channel('everybody'));

app.hooks(appHooks);

app.service('draw').create({
  x: 25,
  y: 5
});

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));

module.exports = app;
