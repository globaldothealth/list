#!/usr/bin/env python3

import numpy as np
import pandas as pd
import requests
import tarfile
import io

url = "https://github.com/beoutbreakprepared/nCoV2019/raw/master/latest_data/latestdata.tar.gz"
r = requests.get(url)
tar = tarfile.open(fileobj=io.BytesIO(r.content), mode="r:*")
csv_path = tar.getnames()[0]
allData = pd.read_csv(tar.extractfile(csv_path), header=0, sep=",", )
allData.columns

print("allData total cases: " + str(allData.shape[0] - 1))
detailedData = allData.replace('', np.nan)
detailedData.dropna(how="all", subset=['age', 'sex','date_onset_symptoms','date_admission_hospital', 'symptoms', 
                                        'travel_history_dates', 'travel_history_location', 'additional_information',
                                        'chronic_disease', 'sequence_available', 'outcome', 'source',
                                        'date_death_or_discharge',], inplace=True)
print("detailedData total cases: " + str(detailedData.shape[0]))


detailedDataWithoutSources = detailedData.dropna(how="any", subset=['source', 'date_confirmation']).copy()
print("detailedDataWithoutSources total cases: " + str(detailedDataWithoutSources.shape[0]))

detailedDataWithoutSources['date_confirmation'] = pd.to_datetime(detailedDataWithoutSources['date_confirmation'],\
                                               format='%d.%m.%Y',\
                                               errors='coerce')
detailedDataWithoutSources.date_confirmation.describe()

validDataWithoutADI = detailedDataWithoutSources.loc[~detailedDataWithoutSources['country_new'].isin(
    ['Argentina', 'Bolivia', 'Brazil', 'China', 'Colombia', 'Cuba', 'Czech Republic', 'El Salvador', 'Estonia', 'France',
     'Germany', 'India', 'Italy', 'Japan', 'Latvia', 'Peru', 'Philippines', 'Puerto Rico', 'South Africa',
     'Spain', 'Switzerland', 'Taiwan', 'Thailand', ''])].copy()
print("validDataWithoutADI total cases: " + str(validDataWithoutADI.shape[0]))

validDataWithCountryNew = validDataWithoutADI.dropna(subset=['country_new']).copy()
validDataWithoutCountryNew = validDataWithoutADI[~validDataWithoutADI.country_new.notnull()].copy()
print(validDataWithoutCountryNew["country"].value_counts())
print("validDataWithCountryNew total cases: " + str(validDataWithCountryNew.shape[0]))
print("validDataWithoutCountryNew total cases: " + str(validDataWithoutCountryNew.shape[0]))


validDataWithCountryNew['date_confirmation'] = validDataWithCountryNew['date_confirmation'].dt.strftime("%d.%m.%Y").copy()
validDataWithConfirmationDate = validDataWithCountryNew.dropna(subset=['date_confirmation']).copy()

finalData = validDataWithCountryNew.copy()

sourceCounts = finalData["source"].value_counts()
print("number of unique sources: " + str(sourceCounts.shape[0]))

countryCounts = finalData["country_new"].value_counts()
countryCounts.to_csv('countryCounts.csv')

finalData.to_csv('finalData.csv', index=False)
