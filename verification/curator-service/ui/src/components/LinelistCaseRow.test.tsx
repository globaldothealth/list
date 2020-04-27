import React from 'react';
import { render } from '@testing-library/react';
import LinelistCaseRow from './LinelistCaseRow';
import displayDate from '../util/display-date';

it('renders provided case', () => {
  const id = 'abc123';
  const outcome = 'pending';
  const date = new Date();

  const { getByText } = render(
    <table>
      <tbody>
        <LinelistCaseRow
          case={
            {
              _id: id,
              outcome: outcome,
              date: date
            }}
        />
      </tbody>
    </table>
  );

  expect(getByText(new RegExp(id))).toBeInTheDocument();
  expect(getByText(new RegExp(outcome))).toBeInTheDocument();
  expect(getByText(new RegExp(displayDate(date)))).toBeInTheDocument();
});
