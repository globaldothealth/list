class WebApplicationError(Exception):
    """Represents something going wrong on a web service."""

    http_code = 500


class PreconditionUnsatisfiedError(WebApplicationError):
    """Represents a bad request."""

    http_code = 400


class NotFoundError(WebApplicationError):
    """Represents a missing resource."""

    http_code = 404


class ConflictError(WebApplicationError):
    """Represents a conflicting request."""

    http_code = 409


class UnsupportedTypeError(WebApplicationError):
    """Something received a type it couldn't work with."""

    http_code = 415


class ValidationError(WebApplicationError):
    """Represents invalid data"""

    http_code = 422


class DependencyFailedError(WebApplicationError):
    """Something we tried to do to make your request work went wrong."""

    http_code = 424
