import bson
import pytest

from reusable_data_service.model.case_reference import CaseReference


def test_csv_row():
    identifier = "abcd12903478565647382910"
    oid = bson.ObjectId(identifier)
    ref = CaseReference()
    ref.sourceId = oid
    csv = ref.to_csv()
    assert csv == identifier
