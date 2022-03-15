cases_cachefile <-
function(server = GDH_URL, folder="cache", ...) {
    return(paste0(folder, "/",
                  sha256(paste0(stringify_filters(...), "|", server)), ".csv"))
}
