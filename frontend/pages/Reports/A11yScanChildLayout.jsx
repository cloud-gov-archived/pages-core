import React from 'react';
import PropTypes from 'prop-types';
//import About from './about';
import * as utils from './utils'
import A11ySummaryTable from './A11ySummaryTable';
import A11yViolationsSection from './A11yViolationsSection';
import A11yPassedChecksSection from './A11yPassedChecksSection';
import ScanNav from './ScanNav';
import ScanFindings from './ScanResults';
// import ScanFindingsSummary from './ScanResultsSummary';
import BackToTopButton from './BackToTopButton';
import About from './about';

export default function A11yScanChild({ data }) {
  console.log(data)


  let navGroups = [...utils.severity['a11y']].map(group => ({
      ...group, 
      label: group.name,
      usePill: true,
      count: data.groupedViolations[group?.name]?.length || 0
    })
  );
  navGroups.push(
    // TODO: split into suppressed/unsuppressed items
    {
      label: 'Total violations',
      count: data?.violationsCount,
      boldMe: true
    },
    {
      label: 'Total passes',
      count: data?.passes?.length,
    }
  )


  return (
    <>
      <div className="grid-row">
        <h1 className="font-heading-xl grid-col padding-right-2">
          Accessibility scan results for <br />
          <span className="font-code-lg text-normal text-primary-darker bg-accent-cool-lighter padding-05 narrow-mono display-inline-block">{data.url}</span> 
        </h1>
        <span className="grid-col-auto inline-block margin-y-4">
          <a id="pages-logo" href="https://cloud.gov/pages" target="_blank" title="link to Pages homepage">
            <img src="/images/logos/pages-logo-blue.svg" className="width-15" alt="Pages logo" />
          </a>
        </span>
      </div>
      <div className="grid-row border-top-1px padding-top-1">
        <section className="tablet:grid-col-auto">
          <ScanNav
            generated={data.timestamp}
            buildId={'buildid'}
            groups={navGroups}
          />
        </section>
        <div className="tablet:grid-col tablet:margin-left-4">
          <div>
            <h2 className="font-heading-xl margin-bottom-1 margin-top-3">Scan results summary</h2>
            <section
              className={`usa-alert usa-alert--${data.violationsCount > 0 ? 'error' : 'success' }`}>
              <div className="usa-alert__body">
                <p className="usa-alert__text">We’ve found 
                  <b>
                    {`
                      ${data.violationsCount} ${utils.plural(data.violationsCount, 'issue' )}
                    `}
                    </b>
                  on this page.
                </p>
              </div>
            </section>
            <ScanFindings
              alerts={[]}
              groupedAlerts={{}}
              site={{}}
            />
          </div>
          <About scanType={'a11y'} siteId={'000'} />
        </div>
      </div>
      <BackToTopButton />
    </>
  );

  // return (
  //   <div>
  //     <About scanType='a11y' siteId="0"/>
  //     <pre>{JSON.stringify(data, null, "  ")}</pre>
  //   </div>
  // );
}

A11yScanChild.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
};
