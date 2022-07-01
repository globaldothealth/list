class PreconditionUnsatisfiedError(Exception):
    """Represents a bad request"""
    pass


class UnsupportedTypeError(Exception):
    """Something received a type it couldn't work with."""
    pass


class ValidationError(Exception):
    """Represents invalid data"""
    pass
