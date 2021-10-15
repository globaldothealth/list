import pandas as pd
from collections import defaultdict
from datetime import datetime
from dateutil.relativedelta import relativedelta


def convert_date(raw_date: str,dataserver=True):
    """ 
    Messy function for extracting messy date formats from raw GISAID. Sometimes full dates are specified, but 
    sometimes just the month or year are specified and we need to include the full time period as a range.
    """
    if raw_date == '2020':
        return ["01/01/2020","31/12/2020"]
    elif raw_date == '2021':
        return ["01/01/2021",datetime.today().strftime("%d/%m/%Y")]
    
    elif raw_date=='2020-12':
        return ["01/12/2020","31/12/2020"]
    elif len(raw_date.split('-'))==2:
        try:
            month = int(raw_date.split('-')[1])
            year = int(raw_date.split('-')[0]) 
            date_start = raw_date + '-01'
            date_end = f"{year}-{month+1}-01" 
            return [datetime.strptime(date_start,"%Y-%m-%d").strftime("%d/%m/%Y"),datetime.strptime(date_end,"%Y-%m-%d").strftime("%d/%m/%Y")]
        except:
            print(f'{raw_date} - date cannot be parsed')
            return ''
    else:
        try:
            date = datetime.strptime(raw_date.split(' ')[0], "%Y-%m-%d")
            return [date.strftime("%d/%m/%Y"),date.strftime("%d/%m/%Y")]
        except:
            print(f'{raw_date} - date cannot be parsed')
            return ''

def convert_location(raw_entry):
    if raw_entry['Location']:
        return ", ".join([u for u in reversed(row['Location'].split(' / '))])
    else:
        return ''


# Set path to GISAID file
gisaid_file = 'path/to/gisaid/file'

# pick a variant of concern
voc = 'B.1.351'
gisaid = pd.read_csv(gisaid_file,sep='\t')


## Remove lines which don't specify lineage and clean 
pangolin_lineage_colname = 'Pango lineage'
gisaid = gisaid.dropna(subset=[pangolin_lineage_colname])
gisaid_voc = gisaid[gisaid[pangolin_lineage_colname].str.contains(voc)]
gisaid_voc = gisaid_voc.fillna(value='')
gisaid_voc = gisaid_voc.replace('?','')


# Set col names
age_col = 'Patient age'
sex_col='Gender'
accession_id_col = 'Accession ID'
date_submitted_col = 'Collection date'
virus_name_col = 'Virus name'
seq_length_col = 'Sequence length'

cases_dict = defaultdict(list)
for idx,row in gisaid_voc.iterrows():
    dates = convert_date(row[date_submitted_col])
    if dates: # Only enter case if date submitted is not empty (ie convert_date function didn't work)
        note = ''
        if '-' in row[age_col]:
            cases_dict['demographics.ageRange.start'].append(row[age_col].split('-')[0])
            cases_dict['demographics.ageRange.end'].append(row[age_col].split('-')[1])
        else:    
            cases_dict['demographics.ageRange.start'].append(row[age_col])
            cases_dict['demographics.ageRange.end'].append(row[age_col])
        cases_dict['demographics.gender'].append(row[sex_col])
        cases_dict['genomeSequences.sequence.accession'].append(row[accession_id_col])
        cases_dict['events.confirmed.date.start'].append(dates[0])
        cases_dict['events.confirmed.date.end'].append(dates[1])
        cases_dict['variantOfConcern'].append(row[pangolin_lineage_colname])
        cases_dict['genomeSequences.sequence.name'].append(row[virus_name_col])
        cases_dict['genomeSequences.sequence.length'].append(row[seq_length_col])
        cases_dict['genomeSequences.sample.collection.date'].append(dates[0])

        cases_dict['location.query'].append(convert_location(row))
    
gisaid_voc_cases = pd.DataFrame.from_dict(cases_dict)
gisaid_voc_cases['caseReference.sourceUrl'] = 'https://www.gisaid.org/'