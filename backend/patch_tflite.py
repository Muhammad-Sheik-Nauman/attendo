"""Script to patch TFLite wrapper files that crash on Windows Python 3.13."""
import glob
import os

tf_lite_dir = os.path.join("venv", "Lib", "site-packages", "tensorflow", "lite")
files = glob.glob(os.path.join(tf_lite_dir, "**", "_pywrap_*.py"), recursive=True)

old_text = '  raise RuntimeError(f"""\nCould not import original test/binary location, import paths tried: {imports_paths}. \nPrevious exceptions: {exceptions}""", last_exception)'

new_text = '  import warnings\n  warnings.warn(f"TFLite wrapper not available", RuntimeWarning)\n  return'

for f in files:
    with open(f, "r") as fh:
        content = fh.read()
    
    if old_text in content:
        patched = content.replace(old_text, new_text)
        with open(f, "w") as fh:
            fh.write(patched)
        print(f"Patched: {f}")
    else:
        print(f"Skipped (already patched or different): {f}")
