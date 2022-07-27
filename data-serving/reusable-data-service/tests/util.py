import pytest

from contextlib import contextmanager

@contextmanager
def does_not_raise(exception):
    try:
        yield
    except exception:
        raise pytest.fail(f"Exception {exception} expected not to be raised")
