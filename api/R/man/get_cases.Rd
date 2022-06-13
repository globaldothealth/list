\name{get_cases}
\alias{get_cases}
\title{
Get line list cases from Global.health
}
\description{
Get line list data as a tibble (Tidyverse data frame).

Unless you always need to be working with the latest data, we recommend
using \code{\link{get_cached_cases}} instead of this function.
}
\usage{
get_cases(apikey, disease = 'covid-19', environment = 'production', \dots)
}
%- maybe also 'usage' for other objects documented here.
\arguments{
  \item{apikey}{
Put your Global.health API key here. You can get a free API key by signing
up at \url{https://data.covid-19.global.health} and clicking on Profile.
}
  \item{disease}{
Identify the outbreak for which you want to fetch data; the default is COVID-19.
}
  \item{environment}{
Specify the environment whose data you want to use: default is production, alternatives are dev or qa.
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
\seealso{
\code{\link{get_cached_cases}}
}
\examples{
# Download data for New Zealand
df <- get_cases("<YOUR API KEY>", country='NZ')
}
\keyword{ ~data }
