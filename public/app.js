/* eslint-disable no-undef */
const socket = io();
const client = feathers();

const canvasContainer = document.getElementsByClassName('canvasContainer')[0];

client.configure(feathers.socketio(socket));

const colorNodes = document.querySelectorAll('.colors');
let color = colorNodes[0].id;

// const canvasElem = document.getElementsByTagName('canvas')[0];
const canvasElem = document.createElement('canvas'); 
if (window.matchMedia('(max-width: 700px)').matches) {
  canvasElem.width = window.innerWidth;
  canvasElem.height = window.innerHeight * 0.8;
  canvasContainer.appendChild(canvasElem);
} else if (window.matchMedia('(max-width: 1200px)').matches) {
  canvasElem.width = window.innerWidth * 0.8;
  canvasElem.height = window.innerHeight * 0.5;
  canvasContainer.appendChild(canvasElem);
}  else {
  canvasElem.width = window.innerWidth * 0.5;
  canvasElem.height = window.innerHeight * 0.5;
  canvasContainer.appendChild(canvasElem);
}

const undoButton = document.getElementById('undoButton');
undoButton.addEventListener('click', undo);

colorNodes.forEach(node =>
  node.addEventListener('click', () => (color = node.id))
);

let canvas = document.querySelector('canvas');
let context = canvas.getContext('2d');

let rect = canvas.getBoundingClientRect();

function recalcRect() {
  rect = canvas.getBoundingClientRect();
}

window.onresize = recalcRect;
window.onscroll = recalcRect;

const clearButton = document.querySelector('#clearButton');

let isDrawing = false;
let uuids = [];

const getLastUuid = () => {
  return uuids[uuids.length - 1];
};

(async () => {
  const items = await client.service('drawing').find();
  items.data.forEach(item => {
    draw(item);
  });
})();

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getNewCoords(e, type) {
  const isMouseEvent = type.includes('mouse');
  const newX = isMouseEvent
    ? e.clientX - rect.left
    : e.touches[0].clientX - rect.left;
  const newY = isMouseEvent
    ? e.clientY - rect.top
    : e.touches[0].clientY - rect.top;
  return { newX, newY };
}

['click', 'touchstart'].forEach(eventType =>
  clearButton.addEventListener(eventType, async e => {
    e.preventDefault();
    await client.service('drawing').remove(null);
  })
);

['mousedown', 'touchstart'].forEach(eventType =>
  canvas.addEventListener(eventType, async e => {
    e.preventDefault();
    const { newX, newY } = getNewCoords(e, eventType);
    isDrawing = true;
    const uuid = uuidv4();
    uuids.push(uuid);
    await client
      .service('drawing')
      .create({ _id: getLastUuid(), x: [newX], y: [newY], color });
  })
);

['mousemove', 'touchmove'].forEach(eventType =>
  canvas.addEventListener(eventType, async e => {
    e.preventDefault();
    if (isDrawing) {
      const { newX, newY } = getNewCoords(e, eventType);
      await client.service('drawing').patch(getLastUuid(), {
        newX,
        newY,
        color,
      });
    }
  })
);

['mouseup', 'touchend', 'touchcancel'].forEach(eventType =>
  canvas.addEventListener(eventType, e => {
    isDrawing = false;
  })
);

const draw = ({ x, y, penColor }) => {
  context.strokeStyle = penColor;
  context.lineJoin = 'round';
  context.lineWidth = 5;

  for (let i = 1; i < x.length; i++) {
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

async function undo() {
  const id = uuids.pop();
  if (id) await client.service('drawing').remove(id);
}

client.service('drawing').on('patched', data => {
  draw(data);
});

client.service('drawing').on('removed', async (id) => {
  if (id) {
    clear();
    const items = await client.service('drawing').find();
    items.data.forEach(item => {
      draw(item);
    });
  } else {
    clear();
  }
});
