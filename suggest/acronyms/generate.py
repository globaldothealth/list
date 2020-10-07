"""Script to generate simple acronyms based on first character of each word in a sentence.

Has some basic checks for alphanumerics, presence of existing acronyms and profanity words.

Run with python3 generate.py -f <path to file containing one sentence per line>

The provided file will be rewritten with the acronyms added at the end of the lines like:
"line with words (LWW)"
"""

import argparse

from better_profanity import profanity

parser = argparse.ArgumentParser(
    description='Acronym generation script')
parser.add_argument('-f', '--file', type=str,
                    help='Path to the file containing the list of sentences to generate acronyms for')


class AcronymGenerator:
    def Generate(self, filePath: str):
        print('Generating acronyms from file', filePath)
        profanity.load_censor_words()
        lines = set()
        with open(filePath, "r") as f:
            for line in f.read().split("\n"):
                # Clear whitespace.
                line = line.strip()
                if not line:
                    continue
                if line.endswith(')'):
                    lines.add(line)
                    continue
                # Split line by words.
                words = line.split(" ")
                # Generate acronym from words if they have a length > 2 and if they are
                # alphanumeric to avoid stuff already in parenthesis and stop words like
                # "an", "of" etc.
                acronym = "".join([w[0].upper()
                                   for w in words if len(w) > 2 and w.isalpha()])
                # Check for profanity when generating acronyms, it's pretty common to generate
                # bad words from a large input corpus.
                if len(acronym) > 1 and not profanity.contains_profanity(acronym):
                    lines.add(f"{line} ({acronym})")
                else:
                    lines.add(line)
        with open(filePath, "w") as f:
            for line in sorted(lines):
                f.write(line + "\n")


if __name__ == "__main__":
    args = parser.parse_args()
    generator = AcronymGenerator()
    generator.Generate(args.file)
    print("DYELINE ORTHOPEDICAL NEGATIVISM EPIFOCAL (DONE)")
