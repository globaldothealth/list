\name{globaldothealth-package}
\alias{globaldothealth-package}
\alias{globaldothealth}
\docType{package}
\title{
\packageTitle{globaldothealth}
}
\description{
\packageDescription{globaldothealth}
}
\details{

The DESCRIPTION file:
\packageDESCRIPTION{globaldothealth}
\packageIndices{globaldothealth}

Accessing data requires an API key. You can sign up for a free API key
at \url{https://data.covid-19.global.health}, and clicking on your profile. 
}
\author{
\packageAuthor{globaldothealth}

Maintainer: \packageMaintainer{globaldothealth}
}
\references{
In order to cite the current version of the dataset please use the
citation below, provided as BibTeX. As the data are updated regularly,
please update the retrieval date in the howpublished field.

\preformatted{
@misc{Global.health,
  author={Global.health team},
  title={{Line List Epidemiological Data from the COVID-19 Outbreak}},
  howpublished={Accessed on yyyy-mm-dd from \url{https://global.health}},
  year=2021
}
}

In order to cite the original dataset and methodology of how it was
collected please use:

\preformatted{
@article{xu2020Epidemiological,
  author = {Xu, Bo and Gutierrez, Bernardo and Mekaru, Sumiko
  and Sewalk, Kara and Goodwin, Lauren and Loskill, Alyssa
  and Cohn, Emily and Hswen, Yulin and Hill, Sarah C. and
  Cobo, Maria M and Zarebski, Alexander and Li, Sabrina and
  Wu, Chieh-Hsi and Hulland, Erin and Morgan, Julia and
  Wang, Lin and O'Brien, Katelynn and Scarpino, Samuel V.
  and Brownstein, John S. and Pybus, Oliver G.
  and Pigott, David M. and Kraemer, Moritz U. G.},
  doi={doi.org/10.1038/s41597-020-0448-0},
  journal={Scientific Data},
  number={106},
  title={{Epidemiological data from the COVID-19 outbreak, real-time case information}},
  volume={7},
  year={2020}
}
}
}
\examples{
# Download data from New Zealand and cache the results
df <- get_cached_cases("<YOUR API KEY>", country="NZ")
# The above will cache the results, such that repeated calls will
# return the same data. To refresh, set refresh = TRUE
df <- get_cached_cases("<YOUR API KEY>", refresh = TRUE, country="NZ")
}
