import { Location } from './Case';
import React from 'react';

export default function StaticMap(props: { location: Location }): JSX.Element {
    return (
        <img
            src={`https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${props.location?.geometry?.longitude},${props.location?.geometry?.latitude},5,0/450x200?access_token=${process.env.REACT_APP_PUBLIC_MAPBOX_TOKEN}`}
            alt="map"
        ></img>
    );
}
