/* eslint-disable no-undef */
const socket = io();
const client = feathers();

client.configure(feathers.socketio(socket));

const clearButton = document.querySelector('#clear');

clearButton.addEventListener('click', async ev => {
  await client.service('draw').remove(0);
  ev.preventDefault();
});

const canvas = document.querySelector('canvas');

const context = canvas.getContext('2d');
let painting = false;
letFirstCoordRecorded = false;

canvas.addEventListener('mousedown', () => {
  painting = true;
  firstCoordRecorded = false;
});

canvas.addEventListener('mouseup', async ev => {
  painting = false;
  firstCoordRecorded = false;
  const x = ev.x - canvas.offsetLeft;
  await client.service('draw').update(null, { lastX: x });
});

canvas.addEventListener('mousemove', async ev => {
  function update(x) {
    client.service('draw').update(null, { firstX: x });
    firstCoordRecorded = true;
  }
  if (painting) {
    const x = ev.x - canvas.offsetLeft;
    const y = ev.y - canvas.offsetTop;
    if (!firstCoordRecorded) {
      await update(x);
    }
    await client.service('draw').create({ x, y });
  }
});

const draw = async () => {
  const { x, y, firstX, lastX } = await client.service('draw').find();

  // context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas

  context.strokeStyle = '#fff';
  context.lineJoin = 'round';
  context.lineWidth = 5;
  const firstXIndex = x.findIndex(coord => coord === firstX);
  const lastXIndex = x.findIndex(coord => coord === lastX);

  console.log(firstXIndex);

  for (let i = firstXIndex; i < x.length; i++) {
    context.beginPath();
    context.moveTo(x[i], y[i]);
    context.lineTo(x[i + 1], y[i + 1]);
    context.closePath();
    context.stroke();
  }
};

client.service('draw').on('created', draw);
client.service('draw').on('removed', console.log('removed'));
