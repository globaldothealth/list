import { createSlice } from "@reduxjs/toolkit";
// import { useDispatch } from 'react-redux'		


const countryListJsonFile = 'https://covid-19-aggregates.s3.amazonaws.com/country/latest.json';


interface fetchedCountries {
    mergedArray?: [],
}

let countryList:any = [];

const xxx = fetch(countryListJsonFile, {
    method: 'get',
})
.then(response => response.json())
.then((jsonData:fetchedCountries) => {
    const array = Object.entries(jsonData)[0];
    const mergedArray = array[1];
    const countries:any = mergedArray.map((el:any) => {
       return el._id;
    })
    countryList = countries.sort();
    console.log(countryList);

    return countryList;
  })
  .then(data => data)
.catch(function(err) {
    console.log(err)
});


const initialState = {
    countryList: []
}
console.log(xxx);

const slice = createSlice({
    name: 'countryList',
    initialState,
    reducers: {
        getCountries(state:any) {
            state.countryList = xxx
        },
    }
})

export const { getCountries  } = slice.actions;

export default slice.reducer;