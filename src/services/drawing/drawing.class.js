const { Service } = require('feathers-nedb');

exports.Drawing = class Drawing extends Service {
  async find() {
    return super.find({
      query: {
        $sort: { createdAt: 1 }
      }
    });
  }

  async create({ _id, x, y, color }) {
    return super.create({ _id, createdAt: new Date(), x, y, penColor: color });
  }

  async patch(id, { newX = 0, newY = 0, color }) {
    const { x, y } = await super.get(id);
    return super.patch(id, {
      x: [...x, newX],
      y: [...y, newY],
      penColor: color
    });
  }

  async get(id) {
    const { x, y, penColor } = await super.get(id);
    return { x, y, penColor };
  }

  async remove(id) {
    try {
      await super.remove(id);
      this.options.Model.persistence.compactDatafile();
      return id;
    } catch (e) {
      console.log(e);
    }
  }
};
