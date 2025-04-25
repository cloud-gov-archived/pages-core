const crypto = require('crypto');
const router = require('express').Router();
const config = require('../../config');
const WebhookController = require('../controllers/webhook');

const signBlob = (key, blob) =>
  `sha1=${crypto.createHmac('sha1', key).update(blob).digest('hex')}`;

const signWebhookRequest = (payload, headers) => {
  const webhookSecret = config.webhook.secret;
  const requestBody = JSON.stringify(payload);

  const signature = headers['x-hub-signature'];
  const signedRequestBody = signBlob(webhookSecret, requestBody);

  if (!signature) {
    throw new Error('No X-Hub-Signature found on request');
  } else if (signature !== signedRequestBody) {
    throw new Error('X-Hub-Signature does not match blob signature');
  }
};

function verifySignature(req, res, next) {
  const { body: payload, headers } = req;

  try {
    signWebhookRequest(payload, headers);
  } catch (err) {
    res.badRequest();
    next(err);
  }
  next();
}

function verifySiteRequest(expectedKeys) {
  return (req, res, next) => {
    const { body: payload } = req;
    const sortedExpectedKeys = expectedKeys.sort();

    // ToDo Add additional headers to check if request is legit

    try {
      const payloadKeys = Object.keys(payload).sort();

      if (payloadKeys.length !== sortedExpectedKeys.length) {
        throw new Error('Invalid request payload');
      }

      const hasKeys = payloadKeys.every(
        (value, index) => value === sortedExpectedKeys[index],
      );

      if (!hasKeys) throw new Error('Invalid request payload');
    } catch (err) {
      res.badRequest();
      next(err);
    }

    next();
  };
}

const verifyNewEditorSite = verifySiteRequest([
  'userEmail',
  'apiKey',
  'siteId',
  'siteName',
  'org',
]);

const verifyEditorSiteBuild = verifySiteRequest(['siteId']);

router.post('/webhook/github', verifySignature, WebhookController.github);
router.post('/webhook/organization', verifySignature, WebhookController.organization);
router.post('/webhook/site', verifyNewEditorSite, WebhookController.site);
router.post('/webhook/site/build', verifyEditorSiteBuild, WebhookController.siteBuild);

module.exports = router;
