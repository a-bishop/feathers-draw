/* eslint-disable no-undef */
const socket = io();
const client = feathers();

client.configure(feathers.socketio(socket));

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

const clearButton = document.querySelector('#clear');

let painting = false;
let firstPointRecorded = false;
let uuid = null;

clearButton.addEventListener('click', async ev => {
  ev.preventDefault();
  await client.service('drawing').remove(uuid);
  firstPointRecorded = false;
});

canvas.addEventListener('mousedown', async () => {
  painting = true;
  if (!firstPointRecorded) uuid = uuidv4();
  if (firstPointRecorded) {
    await client
      .service('drawing')
      .patch(uuid, { newX: 0, newY: 0, recordNewMouseDownIdx: true });
  }
});

canvas.addEventListener('mouseup', () => {
  painting = false;
});

canvas.addEventListener('mousemove', async ev => {
  if (painting) {
    const x = ev.x - canvas.offsetLeft;
    const y = ev.y - canvas.offsetTop;
    if (!firstPointRecorded) {
      firstPointRecorded = true;
      await client.service('drawing').create({ _id: uuid, x: [x], y: [y] });
    }
    await client
      .service('drawing')
      .patch(uuid, { newX: x, newY: y, recordNewMouseDownIdx: false });
  }
});

const draw = async () => {
  let { x, y, mouseDownIdx } = await client.service('drawing').get(uuid);

  context.strokeStyle = '#fff';
  context.lineJoin = 'round';
  context.lineWidth = 5;

  for (let i = mouseDownIdx + 1; i < x.length; i++) {
    context.beginPath();
    context.moveTo(x[i - 1], y[i - 1]);
    context.lineTo(x[i], y[i]);
    context.closePath();
    context.stroke();
  }
};

function clear() {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  firstPointRecorded = false;
}

client.service('drawing').on('created', data => (uuid = data._id));
client.service('drawing').on('patched', draw);
client.service('drawing').on('removed', clear);
