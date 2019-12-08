/* eslint-disable no-undef */
const socket = io();
const client = feathers();

client.configure(feathers.socketio(socket));

const colorNodes = document.querySelectorAll('.colors');
let color = colorNodes[0].id;
colorNodes.forEach(node =>
  node.addEventListener('click', () => (color = node.id))
);

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const clearButton = document.querySelector('#clearButton');

let isDrawing = false;
let firstPointRecorded = false;
let uuid = null;

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

['click', 'touchstart'].forEach(eventType =>
  clearButton.addEventListener(eventType, async e => {
    e.preventDefault();
    clear();
    await client.service('drawing').remove(uuid);
    firstPointRecorded = false;
  })
);

['mousedown', 'touchstart'].forEach(eventType =>
  canvas.addEventListener(eventType, async e => {
    e.preventDefault();
    isDrawing = true;
    if (!firstPointRecorded) {
      uuid = uuidv4();
    } else {
      await client
        .service('drawing')
        .patch(uuid, { recordNewMouseDownIdx: true, color });
    }
  })
);

['mousemove', 'touchmove'].forEach(eventType =>
  canvas.addEventListener(eventType, async e => {
    if (isDrawing) {
      // console.log(isDrawing);
      e.preventDefault();
      const mouseEvent = eventType === 'mousemove';
      const newX = mouseEvent
        ? e.clientX - e.target.offsetLeft
        : e.touches[0].clientX - e.target.offsetLeft;
      const newY = mouseEvent
        ? e.clientY - e.target.offsetTop
        : e.touches[0].clientY - e.target.offsetTop;
      if (!firstPointRecorded) {
        firstPointRecorded = true;
        await client
          .service('drawing')
          .create({ _id: uuid, x: [newX], y: [newY], color });
      }
      await client.service('drawing').patch(uuid, {
        newX,
        newY,
        color
      });
    }
  })
);

['mouseup', 'touchend', 'touchcancel'].forEach(eventType =>
  canvas.addEventListener(eventType, e => {
    e.preventDefault();
    isDrawing = false;
  })
);

const draw = async ({ x, y, mouseDownIdx, penColor }) => {
  console.log('drawing');
  console.log(penColor);
  context.strokeStyle = `${penColor}`;
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

client.service('drawing').on('patched', data => {
  draw({ ...data });
});

client.service('drawing').on('removed', clear);
