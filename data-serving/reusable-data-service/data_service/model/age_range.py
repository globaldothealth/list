import dataclasses

from data_service.model.document import Document
from data_service.util.errors import ValidationError

@dataclasses.dataclass
class AgeRange(Document):
    """I represent a numerical range within which a person's age lies (inclusive of both limits).
    To avoid reidentifying people who have been anonymised by this
    application, I will only tell you their age to within five years (unless they are infants)."""
    lower: int = None
    upper: int = None

    def __post_init__(self):
        """Massage the supplied lower and upper bounds to fit our requirements. That doesn't
        preclude somebody changing the values after initialisation so we also fix in validate()."""
        self.fix_my_boundaries()

    def fix_my_boundaries(self):
        if self.lower is not None and self.lower != 0:
            self.lower = (self.lower // 5) * 5 + 1
        if self.upper is not None and self.upper != 1 and self.upper % 5 != 0:
            self.upper = ((self.upper // 5) + 1) * 5
    
    def validate(self):
        """I must represent the range [0,1], or a range greater than five years, and must
        have a positive lower bound and an upper bound below 121."""
        self.fix_my_boundaries()
        if self.lower is None:
            raise ValidationError("Age Range must have a lower bound")
        if self.upper is None:
            raise ValidationError("Age Range must have an upper bound")
        if self.lower < 0:
            raise ValidationError(f"Lower bound {self.lower} is below the minimum permissible 0")
        if self.upper < 1:
            raise ValidationError(f"Upper bound {self.upper} is below the minimum permissible 1")
        if self.upper > 120:
            raise ValidationError(f"Upper bound {self.upper} is above the maximum permissible 120")
        # deal with the special case first
        if self.lower == 0 and self.upper == 1:
            return
        if self.upper - self.lower < 4:
            # remember range is inclusive of bounds so e.g. 1-5 is five years
            raise ValidationError(f"Range [{self.lower}, {self.upper}] is too small")

    @classmethod
    def from_dict(cls, dict_description):
        ages = cls()
        # age ranges can be open-ended according to the data dictionary, which we map onto our absolute limits
        ages.lower = dict_description.get('lower', 0)
        ages.upper = dict_description.get('upper', 120)
        return ages

    @classmethod
    def none_field_values(cls):
        return ['', '']