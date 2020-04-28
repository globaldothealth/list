import Navbar from 'react-bootstrap/Navbar';
import React from "react";

export default class EpidNavbar extends React.Component {
    render() {
        return (
            <Navbar bg="dark" variant="dark">
                <Navbar.Brand href="#home">
                    <img
                        alt=""
                        src="https://react-bootstrap.netlify.app/logo.svg"
                        width="30"
                        height="30"
                        className="d-inline-block align-top mr-sm-2"
                    />{' '}
                    epid
                </Navbar.Brand>
            </Navbar>
        );
    }
}