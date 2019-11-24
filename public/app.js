/* eslint-disable no-undef */
const socket = io();
const client = feathers();

client.configure(feathers.socketio(socket));

const clearButton = document.querySelector('#clear');

clearButton.addEventListener('click', async ev => {
  await client.service('draw').remove(0);
});

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

let painting = false;
let firstXRecorded = false;

canvas.addEventListener('mousedown', () => {
  painting = true;
  firstXRecorded = false;
});

canvas.addEventListener('mouseup', () => {
  painting = false;
});

canvas.addEventListener('mousemove', async ev => {
  if (painting) {
    const x = ev.x - canvas.offsetLeft;
    const y = ev.y - canvas.offsetTop;
    if (!firstXRecorded) {
      firstXRecorded = true;
      await client.service('draw').update(null, {});
    }
    await client.service('draw').create({ x, y });
  }
});

const draw = async () => {
  let { x, y, firstXIdx } = await client.service('draw').find();

  context.strokeStyle = '#fff';
  context.lineJoin = 'round';
  context.lineWidth = 5;

  for (let i = firstXIdx + 1; i < x.length; i++) {
    context.beginPath();
    context.moveTo(x[i - 1], y[i - 1]);
    context.lineTo(x[i], y[i]);
    context.closePath();
    context.stroke();
  }
};

function clear() {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

client.service('draw').on('created', draw);
client.service('draw').on('removed', clear);
