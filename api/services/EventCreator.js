const { logger } = require('../../winston');
const { Event } = require('../models');

const createEvent = obj => Event
  .create(obj)
  .catch((err) => {
    logger.error([`Failed to create Event(${JSON.stringify(obj)}`, err.stack].join('\n'));
  });

/**
 * Create an audit event
 * @param {string} label The Event label
 * @param {object} model An instance of the target Sequelize model
 * @param {string} message A brief description of the event
 * @param {object} [body] Additional attributes
 *
 * @return {Promise<Event>}
 */
const audit = (label, model, message, body = {}) => createEvent({
  type: Event.types.AUDIT,
  label,
  model: model.constructor.name,
  modelId: model.id,
  body: {
    message,
    ...body,
  },
});

/**
 * Create an error event
 * @param {string} label The Event label
 * @param {Error} err The underlying error
 * @param {object} [body] Additional attributes
 *
 * @return {Promise<Event>}
 */
const error = (label, err, body = {}) => createEvent({
  type: Event.types.ERROR,
  label,
  body: {
    error: err.stack,
    message: err.message,
    ...body,
  },
});

/**
 * Create an error event from an Express request
 * @param {object} request The Event label
 * @param {Error} err The underlying error
 *
 * @return {Promise<Event>}
 */
const handlerError = async (request, err) => {
  const { path, params, body } = request;
  const errBody = { request: { path, params, body } };
  // remove secrets
  if (body) {
    delete errBody.body.password; // basicAuth password
    delete errBody.body.value; // uev value
  }
  return error(Event.labels.REQUEST_HANDLER, err, errBody);
};

module.exports = {
  audit,
  error,
  handlerError,
};
