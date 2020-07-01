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
}

export const transmissionSchema = new mongoose.Schema(
    {
        // Ids of other cases of people with whom this person had contact.
        linkedCaseIds: [String],
        // Data dictionary.
        places: [String],
        routes: [
            {
                type: String,
                enum: Object.values(Route),
            },
        ],
    },
    { _id: false },
);

export type TransmissionDocument = mongoose.Document & {
    linkedCaseIds: [string];
    places: [string];
    routes: [Route];
};
