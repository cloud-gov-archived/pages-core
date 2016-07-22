import federalist from '../util/federalistApi';
import github from '../util/githubApi';
import { siteActionTypes, navigationTypes } from '../constants';
import { encodeB64 } from '../util/encoding';
import store from '../store';
import errorActions from './errorActions';

export default {
  fetchSites() {
    federalist.fetchSites().then((sites) => {
      store.dispatch({
        type: siteActionTypes.SITES_RECEIVED,
        sites
      });
    });
  },

  addSite(siteToAdd) {
    federalist.addSite(siteToAdd).then((site) => {
      store.dispatch({
        type: siteActionTypes.SITE_ADDED,
        site
      });

      store.dispatch({
        type: navigationTypes.UPDATE_ROUTER,
        method: 'push',
        arguments: [`/sites`]
      });
    });
  },

  updateSite(site, data) {
    federalist.updateSite(site, data).then((site) => {
      store.dispatch({
        type: siteActionTypes.SITE_UPDATED,
        siteId: site.id,
        site
      })
    });
  },

  deleteSite(siteId) {
    federalist.deleteSite(siteId).then((site) => {
      store.dispatch({
        type: siteActionTypes.SITE_DELETED,
        siteId
      });

      store.dispatch({
        type: navigationTypes.UPDATE_ROUTER,
        method: 'push',
        arguments: [`/sites`]
      });
    });
  },

  createCommit(site, path, fileData) {
    const b64EncodedFileContents = encodeB64(fileData);
    const commit = {
      message: `Adds ${path} to project`,
      content: b64EncodedFileContents
    };
    const siteId = site.id;

    github.createCommit(site, path, commit).then((commitObj) => {
      store.dispatch({
        type: siteActionTypes.SITE_FILE_ADDED,
        siteId,
        file: commitObj.content
      });

      store.dispatch({
        type: navigationTypes.UPDATE_ROUTER,
        method: 'push',
        arguments: [`/sites/${siteId}`]
      });
    });
  },

  fetchSiteAssets(site) {
    const config = site['_config.yml'];
    const assetPath = (config && config.assetPath) || 'assets';

    return github.fetchRepositoryContent(site, assetPath).then((assets) => {
      return assets.filter((asset) => {
        return asset.type === 'file';
      });
    }).then((assets) => {
      store.dispatch({
        type: siteActionTypes.SITE_ASSETS_RECEIVED,
        siteId: site.id,
        assets
      });

      return Promise.resolve(site);
    });
  },

  fetchSiteConfigs(site) {
    return github.fetchRepositoryConfigs(site).then((configs) => {
      store.dispatch({
        type: siteActionTypes.SITE_CONFIGS_RECEIVED,
        siteId: site.id,
        configs
      });

      return Promise.resolve(site);
    });
  },

  fetchSiteConfigsAndAssets(site) {
    return this.fetchSiteConfigs(site).then((site) => {
      return this.fetchSiteAssets(site).then((site) => {
        return github.fetchRepositoryContent(site).then((files) => {
          store.dispatch({
            type: siteActionTypes.SITE_CONTENTS_RECEIVED,
            siteId: site.id,
            files
          });
        });
      });
    });
  },

  fetchContent(site, path) {
    function dispatchChildContent(site, path, files) {
      store.dispatch({
        type: siteActionTypes.SITE_CHILD_CONTENT_RECEIVED,
        siteId: 1,
        path,
        files
      });
    }

    return github.fetchRepositoryContent(site, path)
      .then(
        dispatchChildContent.bind(null, site, path)
      ).catch(err => errorActions.httpError(err));
  },

  cloneRepo(destination, source) {
    return github.createRepo(destination, source).then(() => {
      return federalist.cloneRepo(destination, source).then((site) => {
        store.dispatch({
          type: siteActionTypes.SITE_ADDED,
          site
        });

        store.dispatch({
          type: navigationTypes.UPDATE_ROUTER,
          method: 'push',
          arguments: [`/sites/${site.id}`]
        });
      });
    }).catch((err) => {
      errorActions.httpError(err);
    });
  }
}
