const buildFactory = require('./build');
const buildTaskTypeFactory = require('./build-task-type');
const siteBuildTaskFactory = require('./site-build-task');
const { BuildTask } = require('../../../../api/models');

const _attributes = ({
  build,
  buildTaskTypeId,
  siteBuildTaskId,
  BuildTaskType = {},
  name,
  artifact,
  count,
  message,
} = {}) => ({
  buildId: build || buildFactory(),
  buildTaskTypeId: buildTaskTypeId || buildTaskTypeFactory(),
  siteBuildTaskId: siteBuildTaskId || siteBuildTaskFactory(),
  BuildTaskType: BuildTaskType || buildTaskTypeFactory(),
  name: name || 'build task name',
  artifact: artifact || '',
  count: count || 0,
  message: message || 'build task message',
});

const buildTask = (overrides) =>
  Promise.props(_attributes(overrides)).then((attributes) => {
    Object.keys(attributes).forEach((key) => {
      if (attributes[key].sequelize) {
        attributes[key] = attributes[key].id;
      }
    });
    return BuildTask.create(attributes);
  });

module.exports = buildTask;
