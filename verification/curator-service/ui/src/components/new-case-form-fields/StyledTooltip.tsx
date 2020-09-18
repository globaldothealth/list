import React, { FunctionComponent } from 'react';
import { makeStyles } from '@material-ui/core/styles';

const styles = makeStyles(() => ({
    tooltip: {
      padding: "5px",
      '& >ul': {
        listStyle: 'none',
        margin: 0,
        padding: 0,
      },
      '& li': {
        marginBottom: "8px",
        '& >ul': {
          listStyle: 'bullet',
          margin: '0 0 8px 20px',
          padding: 0,
        },
      },
    },
}));

export const StyledTooltip: FunctionComponent<any> = ({ children }) => {

    const classes = styles();

    return (
      <div className={`${classes.tooltip}`}>
        {children}
      </div>
    );
}

export default StyledTooltip;
