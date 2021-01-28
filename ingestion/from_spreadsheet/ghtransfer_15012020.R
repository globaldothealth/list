
rm(list = ls())

library(plyr)
library(ggplot2)
library(scales)
library(ggmuller)

setwd('/Users/mkraemer/downloads/')

#data <- read.csv('2021-01-13_globaldothealth_all.csv')

#head(data)
#unique(data$location.country)

data_previous <- read.csv('latestdata.csv')

head(data_previous)

unique(data_previous$country_new)

data_previous_1 <- subset(data_previous, age != '' | sex != '' | date_onset_symptoms != '' | date_admission_hospital != '' |
                            travel_history_dates != '' |  travel_history_location != '' | additional_information != '' |
                            travel_history_dates != ''  | date_admission_hospital != '' | chronic_disease != '' | symptoms != '' | sequence_available != '' | outcome != ''|
                          date_death_or_discharge != '')

data_previous_1 <- subset(data_previous_1, source != '')

head(data_previous_1)

length(unique(data_previous_1$country_new))

# exclude countries where we have line list data

france <- subset(data_previous_1, country_new == 'France')

france <- subset(france, age != '' | sex != '' | date_onset_symptoms != ''  |
                            travel_history_dates != '' |  travel_history_location != '' | additional_information != '' |
                            travel_history_dates != '' | chronic_disease != '' | symptoms != '' | sequence_available != '' | outcome != ''|
                            date_death_or_discharge != '')


data_previous_1 <- subset(data_previous_1, country_new != 'Argentina'  & country_new != 'India'   &
                                            country_new != 'Estonia'  & country_new != 'Peru'  & country_new != 'Latvia'
                          & country_new != 'Puerto Rico'  & country_new != 'El Salvador'  &country_new != 'Bolivia'  & 
                            country_new != 'Philippines'  & country_new != 'Italy'  & country_new != 'China'  & country_new != 'Japan'  &
                            country_new != 'Thailand'  & country_new != 'Switzerland'  & country_new != 'Spain'  & country_new != 'Taiwan'
                          & country_new != 'Brazil'  & country_new != 'South Africa'  & country_new != 'Cuba'  & country_new != 'Germany' & country_new != '' & country_new != 'France')

head(data_previous_1)

unique(data_previous_1$country_new)

all <- rbind(data_previous_1, france)

write.csv(all, 'filtered.csv')

