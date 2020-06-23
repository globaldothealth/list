import { Link } from 'react-router-dom';
import React from 'react';
import User from './User';

interface Props {
    user: User;
}
export default function Home(props: Props): JSX.Element {
    const hasAnyRole = (requiredRoles: string[]): boolean => {
        return props.user.roles?.some((r: string) => requiredRoles.includes(r));
    };

    // TODO: replace with proper home page once links have moved to the navbar.
    return (
        <div>
            {!props.user.email ? (
                <div>Login to access Global Health Curator Portal</div>
            ) : (
                <nav>
                    <div>
                        <a
                            href="http://covid-19.ghdsi.org/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Covid-19 Map
                        </a>
                    </div>
                    {hasAnyRole(['curator', 'reader']) && (
                        <div>
                            <Link to="/cases">Linelist</Link>
                        </div>
                    )}
                    {hasAnyRole(['curator']) && (
                        <div>
                            <Link to="/cases/new">Enter new case</Link>
                        </div>
                    )}
                    {hasAnyRole(['curator', 'reader']) && (
                        <div>
                            <Link to="/sources">Sources</Link>
                        </div>
                    )}
                    <div>
                        <Link to="/charts/cumulative">Cumulative charts</Link>
                    </div>
                    <div>
                        <Link to="/charts/freshness">Freshness charts</Link>
                    </div>
                    <div>
                        <Link to="/charts/completeness">
                            Completeness charts
                        </Link>
                    </div>
                    <div>
                        <Link to="/profile">Profile</Link>
                        <br />
                    </div>
                    {hasAnyRole(['admin']) && (
                        <div>
                            <Link to="/users">Manage users</Link>
                        </div>
                    )}
                </nav>
            )}
        </div>
    );
}
