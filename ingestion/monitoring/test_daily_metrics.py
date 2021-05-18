from datetime import datetime, timedelta
from daily_metrics import compare

LAST_DAY = (datetime.now().date() - timedelta(days=1)).isoformat()
TODAY = datetime.now().date().isoformat()

DATA = {
    "lastday": {
        LAST_DAY: [
            {"_id": "Bactria", "casecount": 1000},
            {"_id": "Gaul", "casecount": 900},
        ]
    },
    "identical": {
        TODAY: [
            {"_id": "Bactria", "casecount": 1000},
            {"_id": "Gaul", "casecount": 900},
        ]
    },
    "more": {
        TODAY: [
            {"_id": "Bactria", "casecount": 1200},
            {"_id": "Gaul", "casecount": 1300},
        ]
    },
    "less": {
        TODAY: [{"_id": "Bactria", "casecount": 800}, {"_id": "Gaul", "casecount": 700}]
    },
    "countryadd": {
        TODAY: [
            {"_id": "Bactria", "casecount": 1000},
            {"_id": "Gaul", "casecount": 900},
            {"_id": "Persia", "casecount": 500},
        ]
    },
    "countrydel": {TODAY: [{"_id": "Bactria", "casecount": 1000}]},
}


def test_identical():
    assert (
        compare(DATA["lastday"], DATA["identical"])
        == f"No overall case count change from {LAST_DAY}"
    )


def test_more():
    assert (
        compare(DATA["lastday"], DATA["more"])
        == f"*New cases added*: 600 since {LAST_DAY}\n\n*Country data additions/deletions*:\n- Bactria: 1200 (▲ 200)\n- Gaul: 1300 (▲ 400)"
    )


def test_less():
    assert (
        compare(DATA["lastday"], DATA["less"])
        == f"*Cases dropped* ⚠️: -400 since {LAST_DAY}\n\n*Country data additions/deletions*:\n- Bactria: 800 (▼ 200)\n- Gaul: 700 (▼ 200)"
    )


def test_countryadd():
    assert (
        compare(DATA["lastday"], DATA["countryadd"])
        == f"*New cases added*: 500 since {LAST_DAY}\n\n*Countries added*: Persia\n- Persia: 500 "
    )


def test_countrydel():
    assert (
        compare(DATA["lastday"], DATA["countrydel"])
        == f"*Cases dropped* ⚠️: -900 since {LAST_DAY}\n\n*Countries dropped*: Gaul\n- Gaul: 900 "
    )


def generate_testcases():
    for var in DATA:
        if var == "lastday":
            continue
        print(f"def test_{var}():")
        print(
            f"    assert compare(DATA['lastday'], DATA['{var}']) == f"
            + eval(f"repr(compare(DATA['lastday'], DATA['{var}']))").replace(
                LAST_DAY, "{LAST_DAY}"
            )
        )
        print()


if __name__ == "__main__":
    generate_testcases()
