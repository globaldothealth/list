import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../redux/auth/selectors';
import { selectDiseaseName } from '../../redux/app/selectors';

import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import LinkIcon from '@mui/icons-material/Link';
import PublishIcon from '@mui/icons-material/Publish';
import PeopleIcon from '@mui/icons-material/People';
import { hasAnyRole } from '../util/helperFunctions';

import { useStyles } from './styled';

interface SidebarProps {
    drawerOpen: boolean;
}

const Sidebar = ({ drawerOpen }: SidebarProps): JSX.Element => {
    const classes = useStyles();
    const location = useLocation();
    const history = useHistory();

    const diseaseName = useAppSelector(selectDiseaseName);
    const [createNewButtonAnchorEl, setCreateNewButtonAnchorEl] =
        useState<Element | null>();
    const [selectedMenuIndex, setSelectedMenuIndex] = React.useState<number>();
    const user = useAppSelector(selectUser);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openCreateNewPopup = (event: any): void => {
        setCreateNewButtonAnchorEl(event.currentTarget);
    };

    const closeCreateNewPopup = (): void => {
        setCreateNewButtonAnchorEl(undefined);
    };

    const handleNewCaseClick = () => {
        closeCreateNewPopup();

        history.push({
            pathname: '/cases/new',
            state: { lastLocation: location.pathname },
        });
    };

    const menuList = useMemo(
        () =>
            user
                ? [
                      {
                          text: 'Line list',
                          icon: <ListIcon />,
                          to: { pathname: '/cases', search: '' },
                          displayCheck: (): boolean => true,
                      },
                      {
                          text: 'Sources',
                          icon: <LinkIcon />,
                          to: '/sources',
                          displayCheck: (): boolean =>
                              hasAnyRole(user, ['curator']),
                      },
                      {
                          text: 'Uploads',
                          icon: <PublishIcon />,
                          to: '/uploads',
                          displayCheck: (): boolean =>
                              hasAnyRole(user, ['curator']),
                      },
                      {
                          text: 'Manage users',
                          icon: <PeopleIcon />,
                          to: '/users',
                          displayCheck: (): boolean =>
                              hasAnyRole(user, ['admin']),
                      },
                  ]
                : [],
        [user],
    );

    useEffect(() => {
        const menuIndex = menuList.findIndex((menuItem) => {
            const pathname =
                typeof menuItem.to === 'string'
                    ? menuItem.to
                    : menuItem.to.pathname;
            return pathname === location.pathname;
        });
        setSelectedMenuIndex(menuIndex);
    }, [location.pathname, menuList]);

    return (
        <Drawer
            className={classes.drawer}
            variant="persistent"
            anchor="left"
            open={drawerOpen}
            data-testid="sidebar"
            classes={{
                paper: classes.drawerPaper,
            }}
        >
            <div className={classes.drawerContents}>
                <div className={classes.drawerHeader}></div>
                <Typography className={classes.covidTitle}>
                    {diseaseName}
                </Typography>
                <>
                    {hasAnyRole(user, ['curator']) && (
                        <Fab
                            variant="extended"
                            data-testid="create-new-button"
                            className={classes.createNewButton}
                            color="secondary"
                            onClick={openCreateNewPopup}
                        >
                            <AddIcon className={classes.createNewIcon} />
                            Create new
                        </Fab>
                    )}
                    <Menu
                        anchorEl={createNewButtonAnchorEl}
                        keepMounted
                        open={Boolean(createNewButtonAnchorEl)}
                        onClose={closeCreateNewPopup}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                    >
                        <MenuItem
                            onClick={handleNewCaseClick}
                            className={classes.link}
                        >
                            New line list case
                        </MenuItem>
                        <Link
                            to="/cases/bulk"
                            onClick={closeCreateNewPopup}
                            className={classes.link}
                        >
                            <MenuItem>New bulk upload</MenuItem>
                        </Link>
                        <Link
                            to="/sources/automated"
                            onClick={closeCreateNewPopup}
                            className={classes.link}
                        >
                            <MenuItem>New automated source</MenuItem>
                        </Link>
                        <Link
                            to="/sources/backfill"
                            onClick={closeCreateNewPopup}
                            className={classes.link}
                        >
                            <MenuItem>New automated source backfill</MenuItem>
                        </Link>
                    </Menu>
                </>
                <List>
                    {menuList.map(
                        (item, index) =>
                            item.displayCheck() && (
                                <Link key={item.text} to={item.to}>
                                    <ListItem
                                        button
                                        key={item.text}
                                        selected={selectedMenuIndex === index}
                                    >
                                        <ListItemIcon>{item.icon}</ListItemIcon>

                                        <ListItemText primary={item.text} />
                                    </ListItem>
                                </Link>
                            ),
                    )}
                </List>
            </div>
        </Drawer>
    );
};

export default Sidebar;
