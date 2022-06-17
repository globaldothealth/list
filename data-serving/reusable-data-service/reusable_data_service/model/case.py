import dataclasses

@dataclasses.dataclass
class DayZeroCase:
    """This class implements the "day-zero" data schema for Global.health.
    At the beginning of an outbreak, we want to collect at least this much
    information about an individual case for the line list."""
    pass

# Actually we want to capture extra fields which can be specified dynamically:
# so Case is the class that you should use.
Case = dataclasses.make_dataclass('Case', fields=[], bases=(DayZeroCase,))
