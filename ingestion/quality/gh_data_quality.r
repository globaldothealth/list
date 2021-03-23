# data quality script by @MougK

## Globals 
rm(list = ls())

library(googlesheets)
library(tidyr)
library(ggplot2)
library(gsheet)
#devtools::install_github("tidyverse/googlesheets4")
library(RCurl)
library(googlesheets4)
library(gridExtra)
library(readr)

#install.packages(c("cowplot", "googleway", "ggplot2", "ggrepel", 
#                   "ggspatial", "libwgeom", "sf", "rnaturalearth", "rnaturalearthdata"))

library("ggplot2")
library("sf")

library("rnaturalearth")
library("rnaturalearthdata")

theme_set(theme_bw())

## load data

setwd('/home')

# Line List data (latest)
data <- read.csv('latestdata.csv')

# List of Countries that are currently ingesting using Auto Ingestion
tmp <- read.csv('G.h Data Acknowledgements - Data Acks Current.csv')
#tmp <- read_sheet("https://docs.google.com/spreadsheets/d/1xN7aRqiw8vcXw8EnDm5Dyy2-Lc4SThVi69GdexxYcEc/edit#gid=0")
#jhu <- read.csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv', header = FALSE)

jhu <- read_csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv')

jhu <- as.data.frame(jhu)

data_long <- gather(jhu, "Country", "Cases", '1/22/20':'2/4/21', factor_key = TRUE)

head(data)
head(tmp)

#tmp <- as.data.frame(tmp)

#plot(test$location.geometry.longitude, test$location.geometry.latitude)

world <- ne_countries(scale = "medium", returnclass = "sf")

world <- subset(world, admin == 'Germany')

data_long_germany <- subset(data_long, data_long$`Country/Region` == 'Germany')
data_long_germany$diff <- ave(data_long_germany$Cases, FUN = function(x) c(0, diff(x)))

class(world)

# subset by source
test_2 <- subset(data, caseReference.sourceUrl == 'https://www.arcgis.com/sharing/rest/content/items/f10774f1c63e40168479a1feb6c7ca74/data')

# subset by country it should be geo-coded to
test_3 <- subset(data, caseReference.sourceUrl == 'https://www.arcgis.com/sharing/rest/content/items/f10774f1c63e40168479a1feb6c7ca74/data' & location.country != 'Germany')
print(test_3)

map <- ggplot(data = world) +
  geom_sf()+
  geom_point(data = test_2, aes(x = location.geometry.longitude, y = location.geometry.latitude,  alpha = 0.1), size = 2, colour =  "#FD685B",fill = "#FD685B")+
  theme(legend.position = "none") 

test_2$cases <- 1
aggregate <- aggregate(test_2$cases, by = list(test_2$events.confirmed.date.end), FUN = sum)

lines <- ggplot()+
  geom_line(data = aggregate, aes(x = as.Date(Group.1, '%Y-%m-%d'), y = rollmean(x, 7, na.pad = TRUE)), col = '#FD685B')+
  geom_line(data = data_long_germany, aes(x = as.Date(Country, '%m/%d/%y'), y = rollmean(diff, 7, na.pad= TRUE)), col = '#0E7569')+
  geom_point(data = aggregate, aes(x = as.Date(Group.1, '%Y-%m-%d'), y = rollmean(x, 7, na.pad = TRUE)), col = '#FD685B')+
  geom_point(data = data_long_germany, aes(x = as.Date(Country, '%m/%d/%y'), y = rollmean(diff, 7, na.pad= TRUE)), col = '#0E7569')+
  xlab('Time')+
  ylab('Cases')+
  theme(legend.position = "none")


grid.arrange(map, lines, nrow = 1)
