const { expect } = require('chai');
const moment = require('moment');
const QueueJobs = require('../../../../api/queue-jobs');
const Templates = require('../../../../api/services/mailer/templates');
const factory = require('../../support/factory');
const { connection } = require('../../support/queues');
const { hostname } = require('../../../../config').app;
const { Role, User, Site, UAAIdentity } = require('../../../../api/models');

function createUserWithUAAIdentity() {
  return factory.user().then(async (user) => {
    await factory.uaaIdentity({ userId: user.id });
    return user.reload({
      include: [UAAIdentity],
    });
  });
}

const queue = new QueueJobs(connection);

describe('mailer', () => {
  context('when the Mailer has been initialized', () => {
    describe('.sendUAAInvite()', () => {
      const email = 'foo@bar.gov';
      const link = 'https://foobar.gov';
      const orgName = 'test-org';

      it(`adds a \`uaa-invite\` job to the
          mail queue for cloud.gov IDP users`, async () => {
        const origin = 'cloud.gov';

        const job = await queue.sendUAAInvite(email, link, origin, orgName);

        expect(job.name).to.eq('uaa-invite');
        expect(job.data.to).to.deep.eq([email]);
        expect(job.data.html).to.eq(Templates.uaaInvite({ link }));
      });

      it('adds a `uaa-invite` job to the mail queue for uaa IDP users', async () => {
        const origin = 'uaa';

        const job = await queue.sendUAAInvite(email, link, origin, orgName);

        expect(job.name).to.eq('uaa-invite');
        expect(job.data.to).to.deep.eq([email]);
        expect(job.data.html).to.eq(Templates.uaaInvite({ link }));
      });

      it('adds a `uaa-invite` job to the mail queue for agency IDP users', async () => {
        const origin = 'agency.gov';

        const job = await queue.sendUAAInvite(email, link, origin, orgName);

        expect(job.name).to.eq('uaa-invite');
        expect(job.data.to).to.deep.eq([email]);
        expect(job.data.html).to.eq(
          Templates.uaaIDPInvite({
            link: hostname,
            orgName,
          }),
        );
      });
    });

    describe('.sendAlert()', () => {
      it('adds a `alert` job to the mail queue', async () => {
        const errors = ['some error message'];
        const reason = 'something bad happened';

        const job = await queue.sendAlert(reason, errors);

        expect(job.name).to.eq('alert');
        expect(job.data.to).to.deep.eq(['ops@example.gov']);
        expect(job.data.html).to.eq(
          Templates.alert({
            errors,
            reason,
          }),
        );
      });
    });
  });

  describe('.sendSandboxReminder()', () => {
    let user;
    let userRole;
    let managerRole;

    before(async () => {
      [userRole, managerRole] = await Promise.all([
        Role.findOne({
          where: {
            name: 'user',
          },
        }),
        Role.findOne({
          where: {
            name: 'manager',
          },
        }),
      ]);
      user = await createUserWithUAAIdentity();
    });

    const createSandboxOrg = async (sandboxNextCleaningAt) => {
      const org = await factory.organization.create({
        sandboxNextCleaningAt,
        isSandbox: true,
      });
      await org.addUser(user, {
        through: {
          roleId: managerRole.id,
        },
      });
      await factory.site({
        organizationId: org.id,
      });
      await factory.site({
        organizationId: org.id,
      });
      await factory.site({
        organizationId: org.id,
      });
      return org.reload({
        include: [
          {
            model: User,
            required: true,
            include: UAAIdentity,
          },
          {
            model: Site,
            required: true,
          },
        ],
      });
    };

    context('when the Mailer has been initialized', () => {
      it('`sandbox-reminder` adds job(s) to the mail queue', async () => {
        const expiryDays = 5;
        const sandboxNextCleaningAt = moment().add(expiryDays, 'days');
        const dateStr = sandboxNextCleaningAt.format('MMMM DD, YYYY');
        const org = await createSandboxOrg(sandboxNextCleaningAt.toDate());
        const newUser = await createUserWithUAAIdentity();
        await org.addUser(newUser, {
          through: {
            roleId: userRole.id,
          },
        });

        const jobs = await queue.sendSandboxReminder(org);
        jobs.forEach((job) => {
          expect(job.name).to.eq('sandbox-reminder');
          expect(org.Users.find((u) => job.data.to.includes(u.UAAIdentity.email))).to.not
            .be.null;
          expect(job.data.subject).to.eq(
            // eslint-disable-next-line max-len
            `Your Pages sandbox organization's sites will be removed in ${expiryDays} days`,
          );
          expect(job.data.html).to.eq(
            Templates.sandboxReminder({
              organizationId: org.id,
              dateStr,
              organizationName: org.name,
              hostname,
              sites: org.Sites,
            }),
          );
        });
        expect(jobs.length).to.equal(org.Users.length);
      });

      it('`sandbox-reminder` throws an error if a user lacks UAAIdentity', async () => {
        const expiryDays = 5;
        const sandboxNextCleaningAt = moment().add(expiryDays, 'days');
        const org = await createSandboxOrg(sandboxNextCleaningAt.toDate());
        const nonUAAUser = await factory.user();
        await org.addUser(nonUAAUser, {
          through: {
            roleId: userRole.id,
          },
        });
        await org.reload();

        const error = await queue.sendSandboxReminder(org).catch((e) => e);

        expect(error).to.be.an('error');
        expect(error.message).to.contain(
          `Failed to queue a sandbox reminder for organization@id=${org.id}`,
        );
        expect(error.message).to.contain(
          `user@id=${nonUAAUser.id}: User lacks UAA email`,
        );
      });
    });
  });
});
