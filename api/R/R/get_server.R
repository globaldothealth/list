get_server <-
function(disease = DISEASE) {
    return(sprintf('https://data.%s.global.health', disease))
}