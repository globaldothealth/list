import {
  Link,
  Route,
  Switch
} from "react-router-dom";

import EpidNavbar from './EpidNavbar';
import LinelistTable from './LinelistTable';
import React from 'react';
import SourceTable from './SourceTable';
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
        <EpidNavbar />
        <Switch>
          <Route path="/cases">
            <Linelist />
          </Route>
          <Route path="/sources">
            <Sources />
          </Route>
          <Route exact path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </ThemeProvider>
  );
}

function Linelist() {
  return (
    <LinelistTable />
  )
}

function Sources() {
  return (
    <SourceTable />
  )
}


function Home() {
  return (
    <nav>
      <Link to="/cases">Linelist</Link><br />
      <Link to="/privacy-policy">Privacy policy</Link><br />
      <Link to="/terms">Terms of service</Link><br />
    </nav>
  )
}

export default App;
