#!/usr/bin/env python3

# Need to run this from the directory containing this script, aws.py, and define_rules.py
# Run define_rules.py first to generate `rules.json`, then run this to create the rules

import json
import subprocess
import sys


FILE_NAME = "rules.json"


print(f"Reading source information from {FILE_NAME} to create AWS EventBridge rules")

with open(FILE_NAME, "r") as f:
    rules = json.load(f)
    for rule in rules:
        rule_name = rule.get("rule_name")
        target_name = rule.get("target_name")
        source_name = rule.get("source_name")
        job_name = rule.get("job_name")
        description = rule.get("description")
        if not rule_name:
            print(f"Missing rule name in rule {rule}")
            sys.exit(1)
        if not target_name:
            print(f"Missing target name in rule {rule}")
            sys.exit(1)
        if not source_name:
            print(f"Missing source name in rule {rule}")
            sys.exit(1)
        if not job_name:
            print(f"Missing job name in rule {rule}")
            sys.exit(1)
        cmd = f"./aws.py schedule {rule_name} -t {target_name} -s \"{source_name}\" -j {job_name} -d \"{description}\""
        print(f"Running command {cmd}")
        out = subprocess.check_output(cmd, encoding="UTF-8", shell=True)
        print(f"Output from command:\n{out}")

print("Done")