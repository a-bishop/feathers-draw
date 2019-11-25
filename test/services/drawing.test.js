const assert = require('assert');
const app = require('../../src/app');

describe('\'drawing\' service', () => {
  it('registered the service', () => {
    const service = app.service('drawing');

    assert.ok(service, 'Registered the service');
  });
});
