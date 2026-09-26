#!/usr/bin/env python3
"""CLI password generator — run with: python passgen.py"""

import secrets
import string
import argparse

PRESETS = {
    "pin":    dict(length=6,  upper=False, lower=False, digits=True,  symbols=False),
    "web":    dict(length=16, upper=True,  lower=True,  digits=True,  symbols=True),
    "strong": dict(length=24, upper=True,  lower=True,  digits=True,  symbols=True),
    "words":  None,  # handled separately
}

WORDLIST = [
    "apple", "brave", "cloud", "delta", "ember", "frost", "grove", "hazel",
    "ivory", "joker", "knack", "lemon", "maple", "noble", "orbit", "piano",
    "quiet", "river", "stone", "tiger", "ultra", "vivid", "waltz", "xenon",
    "yacht", "zebra", "amber", "blaze", "cedar", "dusk",  "eagle", "flint",
]

def build_charset(upper, lower, digits, symbols):
    pool = ""
    if upper:   pool += string.ascii_uppercase
    if lower:   pool += string.ascii_lowercase
    if digits:  pool += string.digits
    if symbols: pool += "!@#$%^&*-_=+?"
    if not pool:
        raise ValueError("At least one character type must be enabled.")
    return pool

def generate_password(length, upper, lower, digits, symbols):
    pool = build_charset(upper, lower, digits, symbols)
    # Guarantee at least one of each required type
    required = []
    if upper:   required.append(secrets.choice(string.ascii_uppercase))
    if lower:   required.append(secrets.choice(string.ascii_lowercase))
    if digits:  required.append(secrets.choice(string.digits))
    if symbols: required.append(secrets.choice("!@#$%^&*-_=+?"))
    rest = [secrets.choice(pool) for _ in range(length - len(required))]
    chars = required + rest
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)

def generate_passphrase(words=4):
    chosen = [secrets.choice(WORDLIST) for _ in range(words)]
    num = secrets.randbelow(9000) + 1000
    return "-".join(chosen) + f"-{num}"

def strength_label(pw):
    score = sum([
        any(c.isupper() for c in pw),
        any(c.islower() for c in pw),
        any(c.isdigit() for c in pw),
        any(c in "!@#$%^&*-_=+?" for c in pw),
        len(pw) >= 16,
        len(pw) >= 24,
    ])
    return ["Weak", "Weak", "Fair", "Good", "Strong", "Strong", "Very Strong"][score]

def main():
    parser = argparse.ArgumentParser(description="Secure password generator")
    parser.add_argument("preset", nargs="?", choices=PRESETS.keys(),
                        help="Use a preset: pin / web / strong / words")
    parser.add_argument("-n", "--count",   type=int, default=1,    help="Number of passwords")
    parser.add_argument("-l", "--length",  type=int, default=16,   help="Password length")
    parser.add_argument("--no-upper",   action="store_true", help="Exclude uppercase")
    parser.add_argument("--no-lower",   action="store_true", help="Exclude lowercase")
    parser.add_argument("--no-digits",  action="store_true", help="Exclude digits")
    parser.add_argument("--no-symbols", action="store_true", help="Exclude symbols")
    parser.add_argument("-w", "--words",   type=int, default=4,
                        help="Words in passphrase (used with 'words' preset)")
    args = parser.parse_args()

    # Apply preset overrides
    opts = dict(length=args.length, upper=not args.no_upper, lower=not args.no_lower,
                digits=not args.no_digits, symbols=not args.no_symbols)
    if args.preset and args.preset != "words":
        opts.update(PRESETS[args.preset])

    print()
    for i in range(args.count):
        if args.preset == "words":
            pw = generate_passphrase(args.words)
        else:
            pw = generate_password(**opts)
        label = strength_label(pw)
        print(f"  {pw}   [{label}]")
    print()

if __name__ == "__main__":
    main()
