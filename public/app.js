/* eslint-disable no-undef */
const socket = io();
const client = feathers();

client.configure(feathers.socketio(socket));

let penColor = 'red';
const colorNodes = document.querySelectorAll('.colors');
colorNodes.forEach(node =>
  node.addEventListener('click', () => (penColor = node.id))
);

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

const clearButton = document.querySelector('#clear');

let painting = false;
let firstPointRecorded = false;
let uuid = null;
let localLine = { x: [], y: [] };

['click', 'touchstart'].forEach(eventType =>
  clearButton.addEventListener(eventType, async e => {
    e.preventDefault();
    clear();
    await client.service('drawing').remove(uuid);
    firstPointRecorded = false;
    localLine = { x: [], y: [] };
  })
);

['mousedown', 'touchstart'].forEach(eventType =>
  canvas.addEventListener(eventType, async e => {
    e.preventDefault();
    painting = true;
    if (!firstPointRecorded) {
      uuid = uuidv4();
    } else {
      await client
        .service('drawing')
        .patch(uuid, { recordNewMouseDownIdx: true, penColor });
    }
    localLine.color = penColor;
    localLine.mouseDownIdx = localLine.x.length;
  })
);

['mousemove', 'touchmove'].forEach(eventType =>
  canvas.addEventListener(eventType, async e => {
    e.preventDefault();
    const mouseEvent = eventType === 'mousemove';
    const newX = mouseEvent
      ? e.x - canvas.offsetLeft
      : e.touches[0].clientX - canvas.offsetLeft;
    const newY = mouseEvent
      ? e.y - canvas.offsetTop
      : e.touches[0].clientY - canvas.offsetTop;
    if (painting) {
      localLine = {
        y: localLine.y.push(newY),
        x: localLine.x.push(newX),
        ...localLine
      };
      if (!firstPointRecorded) {
        firstPointRecorded = true;
        await client
          .service('drawing')
          .create({ _id: uuid, x: [newX], y: [newY], penColor });
      }
      await client.service('drawing').patch(uuid, {
        newX,
        newY,
        penColor
      });
      draw(uuid, { isWebSocket: false });
    }
  })
);

['mouseup', 'touchend'].forEach(eventType =>
  canvas.addEventListener(eventType, () => {
    painting = false;
  })
);

const draw = async (id, { isWebSocket = true } = {}) => {
  let x, y, mouseDownIdx, color;
  if (isWebSocket) {
    ({ x, y, mouseDownIdx, color } = await client.service('drawing').get(id));
  } else {
    ({ x, y, mouseDownIdx, color } = localLine);
  }

  context.strokeStyle = color;
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
  if (data._id !== uuid) draw(data._id);
});

client.service('drawing').on('removed', clear);
