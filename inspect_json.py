import gzip
import json

with gzip.open('indicadores_bancodebogota.json.gz', 'rt', encoding='utf-8') as f:
    data = json.load(f)

# Take 5 records from implementacion bd to inspect available keys and form questions
impl_bd = data.get("implementacion", {}).get("bd", [])
if impl_bd:
    sample_records = impl_bd[:5]
    
    for i, r in enumerate(sample_records):
        print(f"--- RECORD {i} ---")
        for k, v in r.items():
            if k == "FORMS":
                print("  FORMS:")
                for form in v:
                    print(f"    - {form['FORM_NAME']}: {list(form.get('RESPUESTAS', {}).keys())}")
            else:
                print(f"  {k}: {v}")
