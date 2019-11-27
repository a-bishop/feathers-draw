// Initializes the `drawing` service on path `/drawing`
const { Drawing } = require('./drawing.class');
const createModel = require('../../models/drawing.model');
const hooks = require('./drawing.hooks');

module.exports = function(app) {
  const neDBModel = createModel(app);
  neDBModel.persistence.setAutocompactionInterval(30000);

  const options = {
    Model: neDBModel,
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/drawing', new Drawing(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('drawing');

  service.hooks(hooks);
};
