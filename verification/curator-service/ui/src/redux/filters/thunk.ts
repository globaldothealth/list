import {setCountries} from './slice';

const countryListJsonFile =
    'https://covid-19-aggregates.s3.amazonaws.com/country/latest.json';

interface fetchedCountries {
    mergedArray?: [];
}

export const fetchCountries = () => {
    return (dispatch:any) => {
        fetch(countryListJsonFile)
            .then((response) => response.json())
            .then((jsonData: fetchedCountries) => {
                const array = Object.entries(jsonData)[0];
                const countries = array[1].map((el: any) => {
                    return el._id;
                }).sort();
                dispatch(setCountries(countries));
            })
            .catch(function (err) {
                console.error(err);
            });
    };
};
