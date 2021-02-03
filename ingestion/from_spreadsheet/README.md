# Spreadsheet importing

These scripts were used to load the data from the manually-curated line list to Global.health.

## Legacy Contents

 - `Linelist_data_to_merge.ipynb`: script developed by Allyson Pemberton to initially import line list data.
 - `ghtransfer_15012020.R`: code from Moritz Krämer to explore the dataset and find more candidates for import.

## New Hotness

`linelist_data_to_merge.py` is the best of both worlds: using Allyson's script to manipulate the data, and Moritz's methodology to filter good candidates. It needs the packages listed in `requirements.txt`.