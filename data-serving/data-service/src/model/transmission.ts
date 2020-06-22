import mongoose from 'mongoose';

export enum Route {
    AirborneInfection = 'Airborne infection',
    DropletInfection = 'Droplet infection',
    FecalOral = 'Fecal–oral',
    Sexual = 'Sexual',
    Oral = 'Oral',
    DirectContact = 'Direct contact',
    Vertical = 'Vertical',
    Iatrogenic = 'Iatrogenic',
    VectorBorne = 'Vector borne',
    Other = 'Other',
    Unknown = 'Unknown',
}

export const transmissionSchema = new mongoose.Schema({
    route: {
        type: String,
        enum: Object.values(Route),
    },
    // Data dictionary.
    place: String,
    // Ids of other cases of people with whom this person had contact.
    linkedCaseIds: [String],
});

export type TransmissionDocument = mongoose.Document & {
    route: Route;
    places: string;
    linkedCaseIds: [string];
};
