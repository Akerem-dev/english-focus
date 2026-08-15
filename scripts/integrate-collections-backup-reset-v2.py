import re
import runpy

_original_subn = re.subn


def safe_subn(pattern, replacement, *args, **kwargs):
    # The v1 helper contains one regex replacement written as a normal Python
    # triple-quoted string ending in \1. Python turns that escape into U+0001
    # before re.subn receives it. Convert it back to a real capture reference.
    if isinstance(replacement, str):
        replacement = replacement.replace("\x01", r"\1")
    return _original_subn(pattern, replacement, *args, **kwargs)


re.subn = safe_subn
runpy.run_path("scripts/integrate-collections-backup-reset.py", run_name="__main__")
