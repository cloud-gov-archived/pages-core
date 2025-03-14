import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import proxyquire from 'proxyquire';
import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

proxyquire.noCallThru();

const SiteListItem = () => <div />;

const NO_SITE_TEXT = 'No sites yet.';

// sites can be empty as the test is rendering empty divs for children.
const STORE_WITH_SITES = {
  organizations: {
    isLoading: false,
    data: [],
  },
  sites: {
    isLoading: false,
    data: [{ id: 5 }, { id: 2 }, { id: 8 }],
  },
  user: {
    hasGithubAuth: true,
  },
};

const STORE_WITH_SITES_WITH_ORGS = {
  hasOrganizations: true,
  organizations: {
    isLoading: false,
    data: [
      {
        id: 1,
        name: 'org-1',
      },
    ],
  },
  sites: {
    isLoading: false,
    data: [{ id: 5 }, { id: 2 }, { id: 8 }],
  },
  user: {
    hasGithubAuth: true,
  },
};

const STORE_WITH_NO_SITES = {
  organizations: {
    isLoading: false,
    data: [],
  },
  sites: {
    isLoading: false,
    data: [],
  },
  user: {
    hasGithubAuth: true,
  },
};

const STORE_LOADING_SITES = {
  organizations: {
    isLoading: true,
  },
  sites: { isLoading: true },
  user: {
    hasGithubAuth: true,
  },
};

const STORE_WITH_NO_SITES_OR_GH_AUTH = {
  organizations: {
    isLoading: false,
    data: [],
  },
  sites: {
    isLoading: false,
    data: [],
  },
  user: {
    hasGithubAuth: false,
  },
};

describe('<SiteList />', () => {
  let SiteList;
  let wrapper;

  beforeEach(() => {
    SiteList = proxyquire('../../../../frontend/components/siteList/siteList', {
      './siteListItem': SiteListItem,
      '../UsaIcon': {
        UsaIcon: 'UsaIcon',
      },
    }).SiteList;
  });

  describe('when sites are being loaded', () => {
    beforeEach(() => {
      wrapper = shallow(<SiteList {...STORE_LOADING_SITES} />);
    });

    it('renders a loading indicator', () => {
      expect(wrapper.find(LoadingIndicator)).to.have.length(1);
    });
  });

  describe('when no sites are received as props', () => {
    beforeEach(() => {
      wrapper = shallow(<SiteList {...STORE_WITH_NO_SITES} />);
    });

    it('renders an h1 element with the title', () => {
      expect(wrapper.find('.page-header h1')).to.have.length(1);
    });

    context('when the user has authorized Github', () => {
      // TODO: no organizations are present so we still see the Github Auth
      // which is somewhat confusing
      it('renders 1 `Connect with Github` button', () => {
        expect(wrapper.find('Link[to="/sites/new"]')).to.have.length(0);
        expect(wrapper.find('GithubAuthButton')).to.have.length(1);
      });
    });

    context('when the user has NOT authorized Github', () => {
      beforeEach(() => {
        wrapper = shallow(<SiteList {...STORE_WITH_NO_SITES_OR_GH_AUTH} />);
      });

      it('renders 1 `Connect with Github` button', () => {
        expect(wrapper.find('Link[to="/sites/new"]')).to.have.length(0);
        expect(wrapper.find('GithubAuthButton')).to.have.length(1);
      });
    });

    it('renders fallback content when user has no sites', () => {
      const fallbackEl = wrapper
        .find('h1')
        .filterWhere((el) => el.text() === NO_SITE_TEXT);

      expect(fallbackEl.text()).to.equal(NO_SITE_TEXT);
    });
  });

  describe('when sites are received as props', () => {
    beforeEach(() => {
      wrapper = shallow(<SiteList {...STORE_WITH_SITES} />);
    });

    it('renders a container for the list of sites', () => {
      expect(wrapper.find('.usa-card-group')).to.have.length(1);
    });

    it('renders a SiteListItem component for each site in the list', () => {
      expect(wrapper.find(SiteListItem)).to.have.length(3);
    });

    it('renders sites in ascending order by id', () => {
      const items = wrapper.find(SiteListItem);
      expect(items.getElements().map((e) => e.key)).to.deep.equal(['2', '5', '8']);
    });
  });

  describe('when organizations are received as props', () => {
    it('renders a container for the filtering of sites by org', () => {
      wrapper = shallow(<SiteList {...STORE_WITH_SITES_WITH_ORGS} />);
      expect(wrapper.find('#filter-sites-by-org')).to.have.length(1);
    });

    it('renders 1 `Add Site` button', () => {
      expect(wrapper.find('Link[to="/sites/new"]')).to.have.length(1);
      expect(wrapper.find('GithubAuthButton')).to.have.length(0);
    });

    it('renders no container for the filtering of sites by org', () => {
      const store = {
        ...STORE_WITH_SITES,
      };
      wrapper = shallow(<SiteList {...store} />);
      expect(wrapper.find('#filter-sites-by-org')).to.have.length(0);
    });
  });
});
