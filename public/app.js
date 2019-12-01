/* eslint-disable no-undef */
const socket = io();
const client = feathers();

client.configure(feathers.socketio(socket));

let penColor = 'rgba(215, 217, 215, 1)';
const colorNodes = document.querySelectorAll('.colors');
colorNodes.forEach(node =>
  node.addEventListener('click', () => (penColor = node.id))
);

const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const clearButton = document.querySelector('#clearButton');
// const title = document.querySelector('#title');

let painting = false;
let firstPointRecorded = false;
let uuid = null;
let localLine = { x: [], y: [] };

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
    if (painting) {
      e.preventDefault();
      console.log(e);
      const mouseEvent = eventType === 'mousemove';
      const newX = mouseEvent
        ? e.clientX - e.target.offsetLeft
        : e.touches[0].clientX - e.target.offsetLeft;
      const newY = mouseEvent
        ? e.clientY - e.target.offsetTop
        : e.touches[0].clientY - e.target.offsetTop;
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
      draw(uuid, { isLocalLine: true });
    }
  })
);

['mouseup', 'touchend', 'touchcancel'].forEach(eventType =>
  canvas.addEventListener(eventType, e => {
    e.preventDefault();
    painting = false;
  })
);

const draw = async (id, { isLocalLine = false } = {}) => {
  let x, y, mouseDownIdx, color;
  if (!isLocalLine) {
    ({ x, y, mouseDownIdx, color } = await client.service('drawing').get(id));
  } else {
    ({ x, y, mouseDownIdx, color } = localLine);
  }

  console.log(color);
  context.strokeStyle = `${color}`;
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
