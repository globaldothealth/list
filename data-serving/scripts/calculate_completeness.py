import pickle 
from collections import defaultdict
import pandas as pd

'''
This script makes a dictionary containing the completeness of each country within G.h
Completeness is calculated naively as proportion of non-empty rows for each column in a country df.
'''

if __name__ == '__main__':
    # Set raw_data_dir as path to a complete data download from Global.health. 
    # Alternatively can specify list of countries and pull from the API.
    raw_data_dir = '/path/to/global_health_all_countries.csv.gz'
    save_dir = '/path/to/save/completeness_dict'
    countries = [u.split('.')[0] for u in os.listdir(raw_data_dir)]

    country_completeness = defaultdict(list)
    for country in countries:
        print(f"starting {country}")
        country_df = pd.read_csv(f'{raw_data_dir}{country}.csv.gz')
        country_length = country_df.shape[0]
        for field in country_df.columns:
            if field in country_df.columns:
                completeness = 100*country_df.loc[pd.notnull(country_df[field])].shape[0]/country_length
                country_completeness[field].append(completeness)
            else:
                country_completeness[field].append(float(0))
        del country_df # save space
        print(f"completed {country}")

    with open(f'{save_dir}Gh_full_country_completeness_dict.pickle', 'wb') as handle:
        pickle.dump(country_completeness, handle)

