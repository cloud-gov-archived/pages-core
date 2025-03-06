const { expect } = require('chai');
const factory = require('../../support/factory');
const { FileStorageUserAction } = require('../../../../api/models');

describe('FileStorageUserAction model', () => {
  afterEach(() =>
    Promise.all([
      factory.fileStorageService.truncate(),
      factory.organization.truncate(),
      factory.fileStorageFile.truncate(),
      factory.userWithUaaIdentity.truncate(),
    ]),
  );

  it(
    'requires `fileStorageServiceId`, `fileStorageFileId`,' + ' `userId`, and `method`',
    async () => {
      const method = 'POST';
      const fsf = await factory.fileStorageFile.create();
      const user = await factory.user();

      const result = await FileStorageUserAction.create({
        method,
        fileStorageFileId: fsf.id,
        fileStorageServiceId: fsf.fileStorageServiceId,
        userId: user.id,
      });

      expect(result.method).to.equal(method);
      expect(result.fileStorageFileId).to.equal(fsf.id);
      expect(result.fileStorageServiceId).to.equal(fsf.fileStorageServiceId);
      expect(result.userId).to.equal(user.id);
      expect(result.description).to.equal(null);
      expect(result.createdAt).to.be.instanceOf(Date);
      expect(result.updatedAt).to.equal(undefined);
      expect(result.deletedAt).to.equal(undefined);
    },
  );

  it('should have an optional description', async () => {
    const method = 'POST';
    const description = 'Created file';
    const fsf = await factory.fileStorageFile.create();
    const user = await factory.user();

    const result = await FileStorageUserAction.create({
      method,
      fileStorageFileId: fsf.id,
      fileStorageServiceId: fsf.fileStorageServiceId,
      userId: user.id,
      description,
    });

    expect(result.method).to.equal(method);
    expect(result.fileStorageFileId).to.equal(fsf.id);
    expect(result.fileStorageServiceId).to.equal(fsf.fileStorageServiceId);
    expect(result.userId).to.equal(user.id);
    expect(result.description).to.equal(description);
    expect(result.createdAt).to.be.instanceOf(Date);
    expect(result.updatedAt).to.equal(undefined);
    expect(result.deletedAt).to.equal(undefined);
  });

  it('should error with invalid fileStorageFileId foreign key', async () => {
    const method = 'POST';
    const fsf = await factory.fileStorageFile.create();
    const user = await factory.user();

    const error = await FileStorageUserAction.create({
      method,
      fileStorageFileId: '999999',
      fileStorageServiceId: fsf.fileStorageServiceId,
      userId: user.id,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeForeignKeyConstraintError');
  });

  it('should error with invalid fileStorageServiceId foreign key', async () => {
    const method = 'POST';
    const fsf = await factory.fileStorageFile.create();
    const user = await factory.user();

    const error = await FileStorageUserAction.create({
      method,
      fileStorageFileId: fsf.id,
      fileStorageServiceId: '999999',
      userId: user.id,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeForeignKeyConstraintError');
  });

  it('should error with invalid userId foreign key', async () => {
    const method = 'POST';
    const fsf = await factory.fileStorageFile.create();

    const error = await FileStorageUserAction.create({
      method,
      fileStorageFileId: fsf.id,
      fileStorageServiceId: fsf.fileStorageServiceId,
      userId: '99999999',
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeForeignKeyConstraintError');
  });

  describe.only('.getFileActions', () => {
    it('should be actions related to a file including user and file data', async () => {
      const method1 = 'POST';
      const method2 = 'DELETE';
      const currentDate = new Date();
      const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
      const yesterdayDate = new Date(currentDate.getTime() - oneDayInMilliseconds);
      const fss = await factory.fileStorageService.create();
      const [file1, file2] = await Promise.all([
        factory.fileStorageFile.create({ fileStorageServiceId: fss.id }),
        factory.fileStorageFile.create({ fileStorageServiceId: fss.id }),
      ]);
      const email = 'user@example.gov';
      const { user, uaaIdentity } = await factory.userWithUaaIdentity.create({ email });

      const expected = await Promise.all([
        FileStorageUserAction.create({
          method: method1,
          fileStorageFileId: file1.id,
          fileStorageServiceId: file1.fileStorageServiceId,
          userId: user.id,
          createdAt: currentDate,
        }),
        FileStorageUserAction.create({
          method: method2,
          fileStorageFileId: file1.id,
          fileStorageServiceId: file1.fileStorageServiceId,
          userId: user.id,
          createdAt: yesterdayDate,
        }),
      ]);

      const others = await Promise.all([
        FileStorageUserAction.create({
          method: method1,
          fileStorageFileId: file2.id,
          fileStorageServiceId: file2.fileStorageServiceId,
          userId: user.id,
        }),
        FileStorageUserAction.create({
          method: method2,
          fileStorageFileId: file2.id,
          fileStorageServiceId: file2.fileStorageServiceId,
          userId: user.id,
        }),
      ]);

      const result = await FileStorageUserAction.getFileActions(file1.id);
      const all = await FileStorageUserAction.findAll({
        where: { fileStorageServiceId: fss.id },
      });

      expect(result.length).to.equal(expected.length);
      expect(all.length).to.equal(expected.length + others.length);
      expect(result[1].createdAt.getTime()).to.be.lessThan(result[0].createdAt.getTime());
      result.map((record) => {
        expect(record.User.id).to.equal(user.id);
        expect(record.User.UAAIdentity.id).to.equal(uaaIdentity.id);
        expect(record.FileStorageFile.id).to.equal(file1.id);
      });
    });
  });

  describe.only('.getServiceActions', () => {
    it('should be actions related to a storage service user and file data', async () => {
      const method1 = 'POST';
      const method2 = 'DELETE';
      const currentDate = new Date();
      const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
      const yesterdayDate = new Date(currentDate.getTime() - oneDayInMilliseconds);
      const fss = await factory.fileStorageService.create();
      const [file1, file2] = await Promise.all([
        factory.fileStorageFile.create({ fileStorageServiceId: fss.id }),
        factory.fileStorageFile.create({ fileStorageServiceId: fss.id }),
      ]);
      const email = 'user@example.gov';
      const { user, uaaIdentity } = await factory.userWithUaaIdentity.create({ email });

      const expected = await Promise.all([
        FileStorageUserAction.create({
          method: method1,
          fileStorageFileId: file1.id,
          fileStorageServiceId: fss.id,
          userId: user.id,
          createdAt: currentDate,
        }),
        FileStorageUserAction.create({
          method: method2,
          fileStorageFileId: file1.id,
          fileStorageServiceId: fss.id,
          userId: user.id,
          createdAt: yesterdayDate,
        }),
        FileStorageUserAction.create({
          method: method1,
          fileStorageFileId: file2.id,
          fileStorageServiceId: fss.id,
          userId: user.id,
          createdAt: yesterdayDate,
        }),
        FileStorageUserAction.create({
          method: method2,
          fileStorageFileId: file2.id,
          fileStorageServiceId: fss.id,
          userId: user.id,
          createdAt: yesterdayDate,
        }),
      ]);

      const result = await FileStorageUserAction.getServiceActions(fss.id);

      expect(result.length).to.equal(expected.length);
      expect(result[1].createdAt.getTime()).to.be.lessThan(result[0].createdAt.getTime());
      result.map((record) => {
        expect(record.User.id).to.equal(user.id);
        expect(record.User.UAAIdentity.id).to.equal(uaaIdentity.id);
        expect(record.FileStorageFile.id).to.be.oneOf([file1.id, file2.id]);
      });
    });
  });
});
