import bson
import pytest

from data_service.model.case_reference import CaseReference


def test_csv_row_unexcluded():
    identifier = "abcd12903478565647382910"
    oid = bson.ObjectId(identifier)
    ref = CaseReference()
    ref.sourceId = oid
    csv = ref.to_csv()
    assert csv == "abcd12903478565647382910,UNVERIFIED,"


def test_csv_row_excluded():
    identifier = "abcd12903478565647382910"
    oid = bson.ObjectId(identifier)
    ref = CaseReference()
    ref.sourceId = oid
    ref.status = 'EXCLUDED'
    ref.exclusion_note = 'Nope'
    csv = ref.to_csv()
    assert csv == "abcd12903478565647382910,EXCLUDED,Nope"
