const { expect } = require('chai');
const nock = require('nock');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');

describe('CloudFoundryAPIClient Delete', () => {
  afterEach(() => nock.cleanAll());

  describe('.deleteRoute', () => {
    it('should delete a route', (done) => {
      const routeName = 'a-simple-route-to-be-deleted';
      const guid = '123456-abcdef';

      mockTokenRequest();
      apiNocks.mockDeleteRoute(routeName, guid);

      const cfApiClient = new CloudFoundryAPIClient();

      cfApiClient
        .deleteRoute(routeName)
        .then((res) => {
          expect(res.guid).to.equal(guid);
          done();
        })
        .catch(done);
    });
  });

  describe('.deleteS3Service', () => {
    it('should delete an S3 service', (done) => {
      const s3Service = 'this-is-a-s3-service-to-delete';
      const guid = '123456-abcdef';

      mockTokenRequest();
      apiNocks.mockDeleteService(s3Service, guid);

      const cfApiClient = new CloudFoundryAPIClient();

      cfApiClient
        .deleteServiceInstance(s3Service)
        .then((res) => {
          expect(res.guid).to.equal(guid);
          done();
        })
        .catch(done);
    });
  });
});
