import gzip
import json

with gzip.open('indicadores_bancodebogota.json.gz', 'rt', encoding='utf-8') as f:
    data = json.load(f)

impl_bd = data.get("implementacion", {}).get("bd", [])
formas_atencion = set()
tipos_solicitud = set()

if impl_bd:
    for r in impl_bd:
        formas_atencion.add(r.get("FORMA DE ATENCION", ""))
        tipos_solicitud.add(r.get("TIPO_SOLICITUD", ""))

print("Distinct FORMA DE ATENCION:")
for fa in formas_atencion:
    print(f"  - '{fa}'")

print("\nDistinct TIPO_SOLICITUD:")
for ts in tipos_solicitud:
    print(f"  - '{ts}'")
