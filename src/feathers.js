/* eslint-disable no-undef */
const socket = io();
const client = feathers();

client.configure(feathers.socketio(socket));
client.configure(
  feathers.authentication({
    storage: window.localStorage
  })
);

module.exports = client;
