import { FastField } from 'formik';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';

const TooltipText = () => (
  <StyledTooltip>
    <ul>
      <li><strong>Number of cases:</strong> Please select the number of cases to create in the database using the data provided.
        <ul>
          <li>E.g. if you select 1, a single line list case will be created with the data provided.</li>
          <li>If you select 5 then 5 new cases in the line list will be created</li>
        </ul>
      </li>
    </ul>
  </StyledTooltip>
);

export default function NumCases(): JSX.Element {
    return (
        <Scroll.Element name="numCases">
            <FieldTitle
              title="Number of cases"
              tooltip={<TooltipText />}
            ></FieldTitle>
            <FastField
                label="Number of cases"
                name="numCases"
                type="number"
                InputProps={{
                    inputProps: {
                        min: 1,
                    },
                }}
                component={TextField}
                fullWidth
            />
        </Scroll.Element>
    );
}
