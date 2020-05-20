import { Link, Route, Switch } from 'react-router-dom';

import EpidNavbar from './EpidNavbar';
import LinelistTable from './LinelistTable';
import React from 'react';
import SourceTable from './SourceTable';
import Profile from './Profile';
import { ThemeProvider } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import axios from 'axios';

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

interface User {
    name: string;
    email: string;
}

class App extends React.Component<{}, User> {
    constructor(props: {}) {
        super(props);
        this.state = {
            name: '',
            email: '',
        };
    }

    componentDidMount(): void {
        axios
            .get<User>('/auth/profile')
            .then((resp) => {
                this.setState({ name: resp.data.name, email: resp.data.email });
            })
            .catch((e) => {
                this.setState({ name: '', email: '' });
                console.error(e);
            });
    }

    render(): JSX.Element {
        return (
            <ThemeProvider theme={theme}>
                <div className="App">
                    <EpidNavbar user={this.state} />
                    <Switch>
                        <Route path="/cases">
                            <Linelist />
                        </Route>
                        <Route path="/sources">
                            <Sources />
                        </Route>
                        <Route path="/profile">
                            <Profile user={this.state} />
                        </Route>
                        <Route exact path="/">
                            <Home />
                        </Route>
                    </Switch>
                </div>
            </ThemeProvider>
        );
    }
}

function Linelist(): JSX.Element {
    return <LinelistTable />;
}

function Sources(): JSX.Element {
    return <SourceTable />;
}

function Home(): JSX.Element {
    return (
        <nav>
            <Link to="/cases">Linelist</Link>
            <br />
            <Link to="/sources">Sources</Link>
            <br />
            <Link to="/profile">Profile</Link>
            <br />
            <Link to="/privacy-policy">Privacy policy</Link>
            <br />
            <Link to="/terms">Terms of service</Link>
            <br />
        </nav>
    );
}

export default App;
