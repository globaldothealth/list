get_cases <-
function(apikey, disease = 'covid-19', environment = 'production', ...) {
    server <- get_server(disease, environment)
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
