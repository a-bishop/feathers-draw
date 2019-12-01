const { Service } = require('feathers-nedb');

exports.Drawing = class Drawing extends Service {
  async find() {
    return super.find();
  }

  async create({ _id, x, y, penColor }) {
    return super.create({ _id, x, y, mouseDownIdx: 0, penColor });
  }

  async patch(
    id,
    { newX = 0, newY = 0, penColor, recordNewMouseDownIdx = false }
  ) {
    const { x, y, mouseDownIdx } = await super.get(id);
    if (recordNewMouseDownIdx) {
      return super.patch(id, {
        x,
        y,
        mouseDownIdx: x.length,
        penColor
      });
    }
    return super.patch(id, {
      x: [...x, newX],
      y: [...y, newY],
      mouseDownIdx,
      penColor
    });
  }

  async get(id) {
    const { x, y, mouseDownIdx, penColor } = await super.get(id);
    return { x, y, mouseDownIdx, color: penColor };
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
