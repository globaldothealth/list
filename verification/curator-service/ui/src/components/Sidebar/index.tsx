import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../redux/auth/selectors';
import { selectDiseaseName } from '../../redux/app/selectors';

import Drawer from '@material-ui/core/Drawer';
import Typography from '@material-ui/core/Typography';
import Fab from '@material-ui/core/Fab';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AddIcon from '@material-ui/icons/Add';
import ListIcon from '@material-ui/icons/List';
import LinkIcon from '@material-ui/icons/Link';
import PublishIcon from '@material-ui/icons/Publish';
import PeopleIcon from '@material-ui/icons/People';
import { hasAnyRole } from '../util/helperFunctions';

import { useStyles } from './styled';

interface SidebarProps {
    drawerOpen: boolean;
}

const Sidebar = ({ drawerOpen }: SidebarProps): JSX.Element => {
    const classes = useStyles();
    const location = useLocation();

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
                        getContentAnchorEl={null}
                        keepMounted
                        open={Boolean(createNewButtonAnchorEl)}
                        onClose={closeCreateNewPopup}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                    >
                        <Link to="/cases/new" onClick={closeCreateNewPopup}>
                            <MenuItem>New line list case</MenuItem>
                        </Link>
                        <Link to="/cases/bulk" onClick={closeCreateNewPopup}>
                            <MenuItem>New bulk upload</MenuItem>
                        </Link>
                        <Link
                            to="/sources/automated"
                            onClick={closeCreateNewPopup}
                        >
                            <MenuItem>New automated source</MenuItem>
                        </Link>
                        <Link
                            to="/sources/backfill"
                            onClick={closeCreateNewPopup}
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
