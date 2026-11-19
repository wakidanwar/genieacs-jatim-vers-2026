#!/usr/bin/env python3
import argparse
import hashlib
import json
import secrets
import subprocess


def pbkdf2_hex(password: str, salt_hex: str, iterations: int = 10000, dklen: int = 128) -> str:
    salt = bytes.fromhex(salt_hex)
    return hashlib.pbkdf2_hmac("sha512", password.encode("utf-8"), salt, iterations, dklen=dklen).hex()


def main() -> None:
    ap = argparse.ArgumentParser(description="Create or update a GenieACS UI user (MongoDB)")
    ap.add_argument("username", help="UI username (_id)")
    ap.add_argument("password", help="UI password (plaintext, will be hashed)")
    ap.add_argument("--role", "--roles", dest="roles", default="admin", help="Comma-separated roles (default: admin)")
    ap.add_argument("--db", default="genieacs", help="MongoDB database (default: genieacs)")
    args = ap.parse_args()

    salt = secrets.token_hex(64)  # 64 bytes -> 128 hex chars
    pw_hash = pbkdf2_hex(args.password, salt)
    doc = {"_id": args.username, "password": pw_hash, "salt": salt, "roles": args.roles}
    payload = json.dumps(doc, ensure_ascii=False)

    js = r'''
    var doc = __DOC__;
    db.users.replaceOne({_id: doc._id}, doc, {upsert: true});
    db.cache.deleteMany({_id: {$in: ["ui-local-cache-hash", "cwmp-local-cache-hash"]}});
    print("ok user=" + doc._id + " roles=" + doc.roles);
    '''.replace("__DOC__", payload)

    subprocess.check_call(["mongosh", args.db, "--quiet", "--eval", js])


if __name__ == "__main__":
    main()
