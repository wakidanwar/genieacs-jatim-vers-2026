#!/usr/bin/env python3
import json, subprocess, sys, os, argparse, tempfile

DEFAULT_COLLECTIONS = [
    "config",
    "presets",
    "provisions",
    "virtualParameters",
    "files",
    "permissions",
]

def run_mongo(js):
    subprocess.check_call(["mongosh", "genieacs", "--quiet", "--eval", js])

def import_collection(path, prune=False):
    col = os.path.splitext(os.path.basename(path))[0]
    docs = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line: continue
            docs.append(json.loads(line))
    # upsert each doc by _id
    for d in docs:
        _id = d.get("_id")
        if _id is None:
            continue
        # build EJSON-ish literal via JSON (strings/numbers/bools/arrays/objects ok for our data)
        payload = json.dumps(d, ensure_ascii=False)
        idjson = json.dumps(_id, ensure_ascii=False)
        js = f"""
        var doc = EJSON.parse({json.dumps(payload)});
        var id = EJSON.parse({json.dumps(idjson)});
        doc._id = id;
        db.{col}.replaceOne({{_id: id}}, doc, {{upsert: true}});
        """
        run_mongo(js)
    if prune:
        ids = [d.get("_id") for d in docs if "_id" in d]
        ids_json = json.dumps(ids, ensure_ascii=False)
        js = f"""
        var ids = EJSON.parse({json.dumps(ids_json)});
        var r = db.{col}.deleteMany({{_id: {{$nin: ids}}}});
        print('pruned {col}: ' + r.deletedCount);
        """
        run_mongo(js)
    print(f"imported {col}: {len(docs)} docs{' (pruned)' if prune else ''}")

def main():
    ap = argparse.ArgumentParser(description="Import GenieACS config collections from NDJSON")
    ap.add_argument("--dir", default="db", help="directory with <collection>.ndjson")
    ap.add_argument("--only", help="comma-separated collections to import (default: known config collections)")
    ap.add_argument("--prune", action="store_true", help="delete docs in collection not present in file (USE WITH CARE)")
    args = ap.parse_args()
    cols = [c.strip() for c in args.only.split(",")] if args.only else DEFAULT_COLLECTIONS
    for c in cols:
        path = os.path.join(args.dir, f"{c}.ndjson")
        if not os.path.exists(path):
            print(f"skip {c}: {path} not found")
            continue
        import_collection(path, prune=args.prune)
    print("done")

if __name__ == "__main__":
    main()
