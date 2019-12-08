const { Service } = require('feathers-nedb');

exports.Drawing = class Drawing extends Service {
  async find() {
    return super.find();
  }

  async create({ _id, x, y, color }) {
    return super.create({ _id, x, y, mouseDownIdx: 0, penColor: color });
  }

  async patch(
    id,
    { newX = 0, newY = 0, color, recordNewMouseDownIdx = false }
  ) {
    const { x, y, mouseDownIdx } = await super.get(id);
    if (recordNewMouseDownIdx) {
      return super.patch(id, {
        x,
        y,
        mouseDownIdx: x.length,
        penColor: color
      });
    }
    return super.patch(id, {
      x: [...x, newX],
      y: [...y, newY],
      mouseDownIdx,
      penColor: color
    });
  }

  async get(id) {
    const { x, y, mouseDownIdx, penColor } = await super.get(id);
    return { x, y, mouseDownIdx, penColor };
  }

  async remove(id) {
    this.options.Model.persistence.compactDatafile();
    try {
      await super.remove(id);
      return true;
    } catch (e) {
      return true;
    }
  }
};
