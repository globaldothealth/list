get_server <-
function(disease = DISEASE, environment = ENVIRONMENT) {
    server_from_environment <- Sys.getenv('GDH_URL')
    if (server_from_environment != "") {
        return(server_from_environment)
    }
    if (environment == 'production') {
        return(sprintf('https://data.%s.global.health', disease))
    } else {
        return(sprintf('https://%s-data.%s.global.health'), environment, disease)
    }
}