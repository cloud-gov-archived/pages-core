const ACTION_TYPES = [
  'CREATE_SITE_FILE_STORAGE_SERVICE',
  'CREATE_ORGANIZATION_FILE_STORAGE_SERVICE',
  'CREATE_DIRECTORY',
  'UPLOAD_FILE',
  'RENAME_FILE',
  'MOVE_FILE',
  'DELETE_FILE',
].reduce((acc, cur) => {
  return { ...acc, [cur]: cur };
}, {});

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'].reduce((acc, cur) => {
  return { ...acc, [cur]: cur };
}, {});

function associate({
  FileStorageFile,
  FileStorageService,
  FileStorageUserAction,
  UAAIdentity,
  User,
}) {
  FileStorageUserAction.belongsTo(FileStorageService, {
    foreignKey: 'fileStorageServiceId',
  });

  FileStorageUserAction.belongsTo(FileStorageFile, {
    foreignKey: 'fileStorageFileId',
  });

  FileStorageUserAction.belongsTo(User, {
    foreignKey: 'userId',
  });

  FileStorageUserAction.addScope('withFileAndUser', {
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        required: true,
        include: { model: UAAIdentity, required: true },
      },
      { model: FileStorageFile, required: true },
    ],
  });
}

function define(sequelize, DataTypes) {
  const FileStorageUserAction = sequelize.define(
    'FileStorageUserAction',
    {
      method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
      },
      metadata: {
        type: DataTypes.JSON,
      },
    },
    {
      tableName: 'file_storage_user_action',
      paranoid: false,
      timestamps: true,
      updatedAt: false,
    },
  );

  FileStorageUserAction.associate = associate;
  FileStorageUserAction.getServiceActions = (fileStorageServiceId) =>
    FileStorageUserAction.scope('withFileAndUser').findAll({
      where: { fileStorageServiceId },
    });
  FileStorageUserAction.getFileActions = (fileStorageFileId) =>
    FileStorageUserAction.scope('withFileAndUser').findAll({
      where: {
        fileStorageFileId,
      },
    });
  FileStorageUserAction.ACTION_TYPES = ACTION_TYPES;
  FileStorageUserAction.METHODS = METHODS;

  return FileStorageUserAction;
}

module.exports = define;
