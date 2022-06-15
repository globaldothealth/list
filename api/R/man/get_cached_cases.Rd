\name{get_cached_cases}
\alias{get_cached_cases}
%- Also NEED an '\alias' for EACH other topic documented here.
\title{
Get line list cases from Global.health, with caching
}
\description{
Get line list data as a tibble (Tidyverse data frame). This
function also caches the cases in a cache folder, which makes repeated
calls with the same parameters faster.

Unless you always need to be working with the latest data, we recommend
using this function instead of \code{\link{get_cases}}.
}
\usage{
get_cached_cases(apikey, disease = 'covid-19', environment = 'production', refresh = FALSE, folder = "cache", \dots)
}
\arguments{
  \item{apikey}{
Put your Global.health API key here. You can get a free API key by signing
up at \url{https://data.covid-19.global.health} (or another server instance)
and clicking on Profile.
}
  \item{disease}{
Identify the outbreak for which you want to fetch data; the default is COVID-19.
}
  \item{environment}{
Specify the environment whose data you want to use: default is production, alternatives are dev or qa.
}
  \item{refresh}{
Optional, if set to TRUE, refreshes the cache and returns the latest version of
the line list.
}
  \item{folder}{
Optional (default='cache'). If set, uses this as the cache folder
}
  \item{\dots}{
Filters to use for data. Currently the only supported filter is 'country'
which can be specified as country = CC where CC is the two letter ISO 3166-1
country code. A list of country codes can be obtained from
\url{https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2}.
}
}
\value{
Line list data as a tibble. Detailed specifications of the field values can be
found in the online data dictionary at
\url{https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/data_dictionary.txt}
}
\examples{
# Download data for New Zealand
df <- get_cached_cases("<YOUR API KEY>", country='NZ')
# Download latest data for New Zealand
}
\keyword{ ~data }
