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
  return (
    <LinelistTable />
  )
}

function NewEntry() {
  return (
    <NewCaseForm />
  );
}

export default App;
