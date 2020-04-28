import React from 'react';
import LinelistTable from './LinelistTable';
import EpidNavbar from './EpidNavbar';
import { ThemeProvider } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/core/styles';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#37474f',
    },
    secondary: {
      main: '#c5e1a5',
    },
  },
});

const useStyles = makeStyles((theme) => ({
  tableContainer: {
    padding: theme.spacing(6),
    paddingTop: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
}));

function App() {
  const classes = useStyles();
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <EpidNavbar />
        <div className={classes.tableContainer} >
          <LinelistTable />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
