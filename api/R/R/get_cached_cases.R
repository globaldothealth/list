get_cached_cases <-
function(apikey, disease = DISEASE, environment = ENVIRONMENT, refresh = FALSE, folder = "cache", ...) {
    if(!file.exists(folder)) {
        dir.create(folder)
    }
    server <- get_server(disease, environment)
    cachename <- cases_cachefile(server, folder, ...)
    if(!refresh && file.exists(cachename)) {
        return(read_csv(cachename))
    } else {
        df <- get_cases(apikey, server, ...)
    }
    write_csv(df, cachename)
    return(df)
}
