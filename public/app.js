/* eslint-disable no-undef */
const socket = io();
const client = feathers();

client.configure(feathers.socketio(socket));

const addCoord = coord => {
  const coords = document.querySelector('.coords');

  if (coords) {
    coords.innerHTML += `<li>x: ${coord.x} y: ${coord.y}</li>`;
  }
};

const form = document.querySelector('form');

form.addEventListener('submit', async ev => {
  ev.preventDefault();

  const x = document.querySelector('#x-input').value;
  const y = document.querySelector('#y-input').value;

  await client.service('draw').create({ x, y });
});

client.service('draw').on('created', addCoord);
