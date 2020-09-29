"""Exports MongoDB data to a csv or json file."""
import argparse
import subprocess
import yaml
try:
    from yaml import CLoader as Loader
except ImportError:
    from yaml import Loader

parser = argparse.ArgumentParser(
    description='Exports MongoDB data to a csv or json file')
parser.add_argument("--mongodb_connection_string",
                    default="mongodb://127.0.0.1:27017/covid19")
parser.add_argument("--collection", default="cases")
parser.add_argument(
    "--fields", type=argparse.FileType('r'),
    default="case_fields.yaml",
    help="YAML file containing the case fields to export and their definition")
parser.add_argument("--format", "-f", choices=["csv", "json"], default="csv")

if __name__ == "__main__":
    args = parser.parse_args()
    case_fields = yaml.load(args.fields, Loader=Loader)
    field_names = ",".join([field['name'] for field in case_fields])
    subprocess.run([
        "mongoexport",
        f'--uri="{args.mongodb_connection_string}"',
        f'--collection="{args.collection}"',
        f'--fields="{field_names}"',
        f'--type="{args.format}"',
        f'--out="{args.collection}.{args.format}"',
        '--jsonArray',
    ])

    print("Fin!")
