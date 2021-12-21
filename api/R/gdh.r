# Depends: httr readr
# (openssl and tibble are installed with the above packages)
# These packages are part of tidyverse (tidyverse.org), so
# if you have that installed, you don't need to install anything.

# Example invocation:
# > source("gdh.r")
# > key <- "API KEY HERE"
# > c1 <- get_cases(key, country = "New Zealand")
#
# Use get_cached_cases() to cache the cases locally. This is useful for
# rerunning the script which will then use the cached version.

library(httr)
library(tibble)
library(readr)
library(openssl)

GDH_URL_DEFAULT <- "https://data.covid-19.global.health"
GDH_URL <- if((url <- Sys.getenv("GDH_URL")) != "")
    url else GDH_URL_DEFAULT
downloadAsync <- "/api/cases/downloadAsync"

# sync with data-serving/data-service/src/util/search.ts
FILTERS <- c(
    "country"
)

# query string function
stringify_filters <- function(...) {
    kwargs <- list(...)
    fields <- names(kwargs)
    for(f in fields) {
        if( !(f %in% FILTERS)) {
            stop(paste("Invalid field entered:", f))
        }
    }
    for(field in fields) {
        if(grepl(" ", kwargs[[field]])) {
            kwargs[[field]] = paste0("'", kwargs[[field]], "'")
        }
    }
    for(date_field in c("dateconfirmedafter", "dateconfirmedbefore")) {
        if(date_field %in% fields && inherits(kwargs[[date_field]], 'Date')) {
            kwargs[[date_field]] = paste(kwargs[[date_field]])  # convert to string
        }
    }
    querystring <- ""
    for(field in fields) {
        querystring <- paste0(querystring, " ", field, ":", kwargs[[field]])
    }
    return(trimws(querystring))
}

get_cases <- function(apikey, server = GDH_URL, ...) {
    data <- sprintf('{"format": "csv", "query": "%s"}', trimws(stringify_filters(...)))
    res <- POST(paste0(server, downloadAsync), body = data,
                add_headers("Content-Type" = "application/json",
                            "X-API-Key" = apikey))
    if(res$status_code != 200) {
        stop(content(res))
    }
    t <- content(res)
    if(is_tibble(t)) {
        return(t)
    } else {
        # country-export returns a gzip compressed file
        con <- gzcon(url(t$signedUrl))
        return(read_csv(con))
    }
}

cases_cachefile <- function(server = GDH_URL, folder="cache", ...) {
    return(paste0(folder, "/",
                  sha256(paste0(stringify_filters(...), "|", server)), ".csv"))
}

# Returns a cached copy of cases if it exists, otherwise saves to cache
get_cached_cases <- function(apikey, server = GDH_URL, refresh = FALSE, folder = "cache", ...) {
    if(!file.exists(folder)) {
        dir.create(folder)
    }
    cachename <- cases_cachefile(server, folder, ...)
    if(!refresh && file.exists(cachename)) {
        return(read_csv(cachename))
    } else {
        df <- get_cases(apikey, server, ...)
    }
    write_csv(df, cachename)
    return(df)
}

