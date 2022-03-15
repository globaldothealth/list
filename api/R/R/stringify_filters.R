stringify_filters <-
function(...) {
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
