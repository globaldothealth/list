cases_cachefile <-
function(server, folder="cache", ...) {
    return(paste0(folder, "/",
                  sha256(paste0(stringify_filters(...), "|", server)), ".csv"))
}
