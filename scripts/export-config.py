#!/usr/bin/env python3
import json, subprocess, sys, os

COLLECTIONS = [
    "config",
    "presets",
    "provisions",
    "virtualParameters",
    "files",
    "permissions",
]
# Intentionally excluded: users, devices, tasks, faults, operations, cache, locks

def main():
    outdir = sys.argv[1] if len(sys.argv) > 1 else "db"
    os.makedirs(outdir, exist_ok=True)
    for col in COLLECTIONS:
        path = os.path.join(outdir, f"{col}.ndjson")
        # Use mongosh to emit EJSON per document, sorted by _id for stable diffs
        js = f"db.{col}.find().sort({{_id:1}}).forEach(d=>print(EJSON.stringify(d)));"
        try:
            out = subprocess.check_output(["mongosh", "genieacs", "--quiet", "--eval", js], text=True)
        except Exception as e:
            print(f"ERROR exporting {col}: {e}", file=sys.stderr)
            sys.exit(1)
        with open(path, "w", encoding="utf-8") as f:
            f.write(out)
        n = 0 if out.strip()=="" else out.strip().count("\n")+1
        print(f"exported {col}: {n} docs -> {path}")
    print("done")

if __name__ == "__main__":
    main()
