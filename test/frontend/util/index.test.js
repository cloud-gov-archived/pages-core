import { expect } from 'chai';

import { getSafeRepoName, groupLogs, sandboxMsg } from '../../../frontend/util';

describe('getSafeRepoName', () => {
  it('returns safe repo names', () => {
    expect(getSafeRepoName('----precedinghypensrepo')).to.equal('precedinghypensrepo');
    expect(getSafeRepoName('trailinghypenrepo---')).to.equal('trailinghypenrepo');
    expect(getSafeRepoName('-holycow-')).to.equal('holycow');
    expect(getSafeRepoName('cleans    spaces')).to.equal('cleans-spaces');
    expect(getSafeRepoName('#cleans@@weird**characters!')).to.equal(
      'cleans-weird-characters',
    );
    expect(getSafeRepoName('periods.are.ok')).to.equal('periods.are.ok');
  });
});

describe('groupLogs', () => {
  it('groups the logs by source', () => {
    const logs = [
      {
        source: 'source1',
        output: 'hello',
      },
      {
        source: 'source2',
        output: 'foo',
      },
      {
        source: 'source1',
        output: 'world',
      },
      {
        source: 'source2',
        output: 'bar',
      },
    ];

    expect(groupLogs(logs)).to.deep.equal({
      source1: ['hello', 'world'],
      source2: ['foo', 'bar'],
    });
  });
});

describe('sandboxBoxMsg w/o content', () => {
  it('not 1 day', () => {
    expect(sandboxMsg(2)).to.equal(
      'All data for this sandbox organization will be removed in 2 days.',
    );
  });
  it('1 day', () => {
    expect(sandboxMsg(1)).to.equal(
      'All data for this sandbox organization will be removed in 1 day.',
    );
  });
});

describe('sandboxSiteMsg w/ content', () => {
  it('not 1 day', () => {
    expect(sandboxMsg(2, 'of the content')).to.equal(
      'All of the content data for this sandbox organization will be removed in 2 days.',
    );
  });
});
