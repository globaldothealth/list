import {
  BrowserRouter,
  Route,
  Switch
} from "react-router-dom";

import EpidNavbar from './EpidNavbar';
import LinelistTable from './LinelistTable';
import NewCaseForm from './NewCaseForm';
import React from 'react';
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
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <BrowserRouter>
          <EpidNavbar />
          <Switch>
            <Route path="/new">
              <NewEntry />
            </Route>
            <Route exact path="/">
              <Linelist />
            </Route>
          </Switch>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

function Linelist() {
  const classes = useStyles();
  return (
    <div className={classes.tableContainer} >
      <LinelistTable />
    </div>
  );
}

// TODO(timothe): this should be in its own component.
function NewEntry() {
  return (
    <NewCaseForm />
  );
}

export default App;
