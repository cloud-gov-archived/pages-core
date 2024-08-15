/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { plural } from '../../util/reports';

function ScanFindingsSummaryTable({
  title, findings, hasSuppressColumn = false,
}) {
  if (findings.length < 1) return null;
  return (
    <table
      className="usa-table usa-table--striped usa-table--borderless usa-table--stacked usa-table--compact font-body-xs width-full margin-bottom-4"
      aria-label=""
    >
      <thead>
        <tr>
          <th scope="col" className="width-full">{title}</th>
          {hasSuppressColumn && (<th scope="col" className="">Suppressed source</th>)}
          <th scope="col" className="text-no-wrap">Severity</th>
          <th scope="col" className="text-right text-no-wrap">Places</th>
        </tr>
      </thead>
      <tbody>
        {findings.map(finding => (
          <tr key={finding.alertRef || finding.id}>
            <th data-label={title} scope="row">
              <b className="usa-sr-only">
                Result name:
                <br />
              </b>
              {finding.ref && (
                <a className="usa-link" href={finding.ref}>
                  {finding.name}
                  &nbsp;
                  <svg className="usa-icon text-ttop" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                    <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                  </svg>
                </a>
              )}
              {finding.anchor && (
                <a className="usa-link" href={`#finding-${finding.anchor}`}>{finding.name}</a>
              )}
            </th>
            {hasSuppressColumn && (
              <td data-label="Suppressed source" className="font-body-xs">
                {finding.ignore && (
                  <i className="text-no-wrap">
                    {'Suppressed by '}
                    {finding.ignoreSource || 'site configuration'}
                  </i>
                )}
              </td>
            )}
            <td data-label="Severity Risk level" className="font-body-xs text-no-wrap">
              <b className="usa-sr-only">
                Severity:
                <br />
              </b>
              <span className={`usa-tag radius-pill bg-${finding.severity?.color}`}>
                {finding.severity?.label}
              </span>
            </td>
            <td data-label="Places count" className="text-right">
              <span className="usa-sr-only">
                {plural(finding.count, 'place')}
                :
              </span>
              {finding.count}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

ScanFindingsSummaryTable.propTypes = {
  title: PropTypes.string.isRequired,
  findings: PropTypes.array.isRequired,
  hasSuppressColumn: PropTypes.bool,
};

const ScanFindingsSummary = ({ suppressedFindings, unsuppressedFindings, scanType }) => (
  <>
    <ScanFindingsSummaryTable theme={scanType} title="Unresolved results" findings={unsuppressedFindings} />
    <ScanFindingsSummaryTable theme={scanType} title="Resolved or informational results" findings={suppressedFindings} hasSuppressColumn />
  </>
);

ScanFindingsSummary.propTypes = {
  suppressedFindings: PropTypes.array,
  unsuppressedFindings: PropTypes.array,
  scanType: PropTypes.string, // currently unused
};

export default ScanFindingsSummary;
