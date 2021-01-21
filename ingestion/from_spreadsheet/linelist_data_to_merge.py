#!/usr/bin/env python3

import matplotlib.pyplot as plt
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
                                                 'travel_history_dates', 'travel_history_location', 'chronic_disease',
                                                 'sequence_available', 'outcome', 'date_death_or_discharge',], inplace=True)
print("detailedData total cases: " + str(detailedData.shape[0]))


detailedDataWithoutSources = detailedData.dropna(how="any", subset=['source', 'date_confirmation']).copy()
print("detailedDataWithoutSources total cases: " + str(detailedDataWithoutSources.shape[0]))

detailedDataWithoutSources['date_confirmation'] = pd.to_datetime(detailedDataWithoutSources['date_confirmation'],\
                                               format='%d.%m.%Y',\
                                               errors='coerce')
detailedDataWithoutSources.date_confirmation.describe()

canada = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Canada']
print(canada.sort_values(by='date_confirmation')['date_confirmation'].head)
print("canada total cases: " + str(canada.shape[0]))

china = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'China']
print("china total cases: " + str(china.shape[0]))

colombia = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Colombia']
print(colombia.sort_values(by='date_confirmation')['date_confirmation'].head)
print("colombia total cases: " + str(colombia.shape[0]))

cuba = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Cuba']
print(cuba.sort_values(by='date_confirmation')['date_confirmation'].head)
print("cuba total cases: " + str(cuba.shape[0]))

czech = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Czech Republic']
print(czech.sort_values(by='date_confirmation')['date_confirmation'].head)
print("czech total cases: " + str(czech.shape[0]))

estonia = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Estonia']
print(estonia.sort_values(by='date_confirmation')['date_confirmation'].head)
print("estonia total cases: " + str(estonia.shape[0]))
estoniaByDate = estonia.loc[estonia['date_confirmation'] <= pd.Timestamp(2020,3,9)]
print("estoniaByDate cases before 2020-03-09: " + str(estoniaByDate.shape[0]))

germany = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Germany']
print(germany.sort_values(by='date_confirmation')['date_confirmation'].head)
print("germany total cases: " + str(germany.shape[0]))
germanyByDate = germany.loc[germany['date_confirmation'] <= pd.Timestamp(2020,1,27)]
print("germanyByDate cases before 2020-01-27: " + str(germanyByDate.shape[0]))

india = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'India']
print(india.sort_values(by='date_confirmation')['date_confirmation'].head)
print("india total cases: " + str(india.shape[0]))

japan = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Japan']
print(japan.sort_values(by='date_confirmation')['date_confirmation'].head)
print("japan total cases: " + str(japan.shape[0]))
japanByDate = japan.loc[japan['date_confirmation'] <= pd.Timestamp(2020,1,23)]
print("japanByDate cases before 2020-01-23: " + str(japanByDate.shape[0]))

malaysia = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Malaysia']
print(malaysia.sort_values(by='date_confirmation')['date_confirmation'].head)
print("malaysia total cases: " + str(malaysia.shape[0]))

mexico = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Mexico']
print(mexico.sort_values(by='date_confirmation')['date_confirmation'].head)
print("mexico total cases: " + str(mexico.shape[0]))
mexicoByDate = mexico.loc[mexico['date_confirmation'] <= pd.Timestamp(2020,3,25)]
print("mexicoByDate cases before 2020-03-25: " + str(mexicoByDate.shape[0]))

newzealand = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'New Zealand']
print(newzealand.sort_values(by='date_confirmation')['date_confirmation'].head)
print("newzealand total cases: " + str(newzealand.shape[0]))

paraguay = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Paraguay']
print(paraguay.sort_values(by='date_confirmation')['date_confirmation'].head)
print("paraguay total cases: " + str(paraguay.shape[0]))

peru = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Peru']
print(peru.sort_values(by='date_confirmation')['date_confirmation'].head)
print("peru total cases: " + str(peru.shape[0]))

philippines = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Philippines']
print(philippines.sort_values(by='date_confirmation')['date_confirmation'].head)
print("philippines total cases: " + str(philippines.shape[0]))

romania = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Romania']
print(romania.sort_values(by='date_confirmation')['date_confirmation'].head)
print("romania total cases: " + str(romania.shape[0]))

southAfrica = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'South Africa']
print(southAfrica.sort_values(by='date_confirmation')['date_confirmation'].head)
print("southAfrica total cases: " + str(southAfrica.shape[0]))

southKorea = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'South Korea']
print(southKorea.sort_values(by='date_confirmation')['date_confirmation'].head)
print("southKorea total cases: " + str(southKorea.shape[0]))
southKoreaByDate = southKorea.loc[southKorea['date_confirmation'] <= pd.Timestamp(2020,1,19)]
print("southKoreaByDate cases before 2020-01-19: " + str(southKoreaByDate.shape[0]))

sriLanka = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Sri Lanka']
print(sriLanka.sort_values(by='date_confirmation')['date_confirmation'].head)
print("sriLanka total cases: " + str(sriLanka.shape[0]))

switzerland = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Switzerland']
print(switzerland.sort_values(by='date_confirmation')['date_confirmation'].head)
print("switzerland total cases: " + str(switzerland.shape[0]))
switzerlandByDate = switzerland.loc[switzerland['date_confirmation'] <= pd.Timestamp(2020,2,26)]
print("switzerlandByDate cases before 2020-02-26: " + str(switzerlandByDate.shape[0]))

thailand = detailedDataWithoutSources.loc[detailedDataWithoutSources['country_new'] == 'Thailand']
print(thailand.sort_values(by='date_confirmation')['date_confirmation'].head)
print("thailand total cases: " + str(thailand.shape[0]))

validDataWithoutADI = detailedDataWithoutSources.loc[~detailedDataWithoutSources['country_new'].isin(['Argentina', 'Brazil', 'Canada', 'Colombia', 'Cuba', 'Czech Republic', 'Estonia', 'Germany', 'Honduras', 'India', 'Japan', 'Malaysia', 'Mexico', 'New Zealand', 'Paraguay', 'Peru', 'Philippines', 'Romania', 'Singapore', 'South Africa', 'South Korea', 'Sri Lanka', 'Switzerland', 'Thailand', 'Togo', 'Uganda', 'United States', 'United States of America', 'USA'])].copy()
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
