const { Service } = require('feathers-nedb');

exports.Drawing = class Drawing extends Service {
  async find() {
    return super.find();
  }

  async create({ _id, x, y }) {
    return super.create({ _id, x, y, mouseDownIdx: 0 });
  }

  async patch(id, { newX, newY, recordNewMouseDownIdx = false }) {
    const { x, y, mouseDownIdx } = await super.get(id);
    if (recordNewMouseDownIdx) {
      return super.update(id, { x, y, mouseDownIdx: x.length });
    }
    return super.update(id, { x: [...x, newX], y: [...y, newY], mouseDownIdx });
  }

  async get(id) {
    const { x, y, mouseDownIdx } = await super.get(id);
    return { x, y, mouseDownIdx };
  }

  async remove(id) {
    return super.remove(id);
  }
};
