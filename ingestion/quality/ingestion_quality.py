# Generate reports of ingestion quality
# Based on R script by Moritz Krämer

import pandas as pd
import geopandas as gpd
import matplotlib.pyplot as plt
from shapely.geometry import Point

OUTFILE = "data_quality.html"
DATA = "out/latestdata.csv"
SOURCES = "G.h Data Acknowledgements - Data Acks Current.csv"


def word_slug(w):
    return " ".join(w.lower().split())


def slug(country, state=""):
    if state:
        return word_slug(country) + "_" + word_slug(state)
    else:
        return word_slug(country)


def case_map(data, source_url, country, state=""):
    """Generate case map of data with a given source url"""
    file = slug(country, state) + ".png"
    subset = data[data["caseReference.sourceUrl"] == source_url]
    world = gpd.read_file(gpd.datasets.get_path("naturalearth_lowres"))

    fig, gax = plt.subplots(figsize=(10, 10))

    country_map = world[world.name == country]
    country_map.plot(ax=gax, edgecolor="black", color="white")

    subset.plot(ax=gax, color="red", alpha=0.75)

    gax.set_xlabel("longitude")
    gax.set_ylabel("latitude")
    if state:
        gax.set_title(country + ", " + state)
    else:
        gax.set_title(country)

    gax.spines["top"].set_visible(False)
    gax.spines["right"].set_visible(False)

    plt.savefig(file)


def cumulative_compare(data, jhu_data, country, state=None):
    pass


def main():
    # iter_csv = pd.read_csv(DATA, iterator=True, chunksize=1000)
    # data = pd.concat(
    #     [chunk[chunk["events.confirmed.date.end"] > "2020-12-31"] for chunk in iter_csv]
    # )
    # data.to_csv("latestdata-2020-12-31.csv", index=False)
    data = pd.read_csv("latestdata-2020-12-31.csv", dtype=str)
    data["coordinates"] = list(
        zip(
            data["location.geometry.longitude"].astype(float),
            data["location.geometry.latitude"].astype(float),
        )
    )
    data["coordinates"] = data["coordinates"].apply(Point)
    data = gpd.GeoDataFrame(data, geometry="coordinates")
    for source in pd.read_csv(SOURCES).itertuples():
        country = (
            source.Country
            if "," not in source.Country
            else source.Country.split(",")[1].strip()
        )
        print(country)
        state = "" if "," not in source.Country else source.Country.split(",")[0]
        case_map(data, source[3], country, state)


if __name__ == "__main__":
    main()
