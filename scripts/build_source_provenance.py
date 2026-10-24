#!/usr/bin/env python3
"""Attach saved source-access evidence to public CSV source fields, without network calls.

Run after the source generators and before baseline/canonical builders. The export
also runs this step so shipped source-only tables receive the same annotations.
"""
import argparse
import csv
import importlib.util
import io
from pathlib import Path
import re
import sys
sys.dont_write_bytecode = True

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('source_provenance', HERE / 'source_provenance.py')
provenance = importlib.util.module_from_spec(spec)
spec.loader.exec_module(provenance)
FIELDS = {'sources', 'source_urls', 'verification_sources', 'postmortem_urls', 'ref_url', 'url'}
URL_RE = re.compile(r'https?://[^\s<>\]\["\']+')
MIGRATIONS = {
    'https://www.coindesk.com/japan-charged-30-trading-hack-crypto-coincheck': 'https://www.coindesk.com/policy/2021/01/22/30-charged-in-japan-with-trading-96m-of-crypto-stolen-in-coincheck-hack',
    'https://regional-front.cointelegraph.com/news/binance-upbit-hack-funds-freeze-kbs-report': 'https://cointelegraph.com/news/binance-upbit-hack-funds-freeze-kbs-report',
    'https://bean.money/blog/beanstalk-farms-exploit-4-17-22': 'https://docs.bean.money/almanac/disclosures',
    'https://bean.money/blog/beanstalk-farms-incident-and-next-steps': 'https://docs.bean.money/almanac/disclosures',
    'https://www.mexc.com/news/156688': 'https://forum.balancer.fi/t/bip-892-distribution-of-rescued-funds-from-balancer-v2-november-3rd-2025-attacks/6883',
}
BADGER = 'https://badger.com/technical-post-mortem'
MICROSOFT = 'https://www.microsoft.com/en-us/security/blog/2022/02/16/ice-phishing-on-the-blockchain/'


def enrich(root):
    archives = provenance.load_archive_map(root / 'data/source_archive_map.csv')
    checks = {}
    check_file = root / 'data/source_archive_checks.csv'
    if check_file.exists():
        with check_file.open(newline='', encoding='utf8') as f:
            checks = {r['original_url']: r for r in csv.DictReader(f)}
    text_corrections = []
    correction_file = root / 'data/source_text_corrections.csv'
    if correction_file.exists():
        with correction_file.open(newline='', encoding='utf8') as f:
            text_corrections = list(csv.DictReader(f))
        allowed = {'arrest_or_charges', 'valuation_note', 'recovered_channel', 'notes'}
        if any(r['field'] not in allowed or r['operation'] not in ('set', 'append') for r in text_corrections):
            raise ValueError('source text corrections must be bounded prose fields')
    changed = 0
    paths = sorted((root / 'data').glob('*.csv')) + sorted((root / 'data/baseline').glob('*.csv'))
    for path in paths:
        with path.open(newline='', encoding='utf8') as f:
            reader = csv.DictReader(f)
            header = reader.fieldnames
            rows = list(reader)
        fields = FIELDS.intersection(header or [])
        if not fields:
            continue
        dirty = False
        for row in rows:
            if None in row or any(v is None for v in row.values()):
                raise ValueError(f'malformed CSV row in {path}')
            if path.name == 'incidents_master.csv':
                for correction in text_corrections:
                    if correction['incident_id'] != row['id']:
                        continue
                    field, value = correction['field'], correction['text']
                    if correction['operation'] == 'append':
                        value = row[field] if value in row[field] else (row[field] + ' | ' + value).strip(' |')
                    if row[field] != value:
                        row[field] = value
                        dirty = True
                    if correction['source_url'] not in row['sources']:
                        row['sources'] = row['sources'] + ' ; ' + correction['source_url']
                        dirty = True
            for field in fields:
                old = row[field]
                # Recompute our access markers after an archive retry changes the result.
                value = re.sub(r' \(source content unavailable at 23 Oct 2026 check; (?:archive status unresolved|availability API returned no closest snapshot)\)', '', old)
                for dead, current in MIGRATIONS.items():
                    value = value.replace(dead, current)
                if BADGER in value and MICROSOFT not in value:
                    value += ' ; ' + MICROSOFT + ' (supporting mechanism analysis)'
                value = provenance.append_archive_urls_csv(value, archives)
                # A dead source with no retrieved archive stays visible with its access limit.
                for url in dict.fromkeys(m.group(0).rstrip('.,;)') for m in URL_RE.finditer(value)):
                    if url not in checks or url in archives or url in MIGRATIONS:
                        continue
                    record = checks[url]
                    if '(source content unavailable' in value[value.find(url):value.find(url)+350]:
                        continue
                    query = record.get('query_status', '')
                    detail = 'availability API returned no closest snapshot' if query == 'ok' else 'archive status unresolved'
                    # Apply only to inventory URLs observed dead or serving error content.
                    marker = f' (source content unavailable at 23 Oct 2026 check; {detail})'
                    value = value.replace(url, url + marker)
                if old != value:
                    row[field] = value
                    dirty = True
            if row.get('id') == '20231114-exzo-network':
                note = 'Source-access limitation, 23 Oct 2026: the sole incident URL returned 404 and the availability API supplied no closest snapshot. The reported loss remains uncorroborated from accessible source text.'
                if note not in row.get('notes', ''):
                    row['notes'] = (row.get('notes', '') + ' | ' + note).strip(' |')
                    dirty = True
        if dirty:
            output = io.StringIO(newline='')
            writer = csv.DictWriter(output, fieldnames=header)
            writer.writeheader()
            writer.writerows(rows)
            encoded = output.getvalue().encode('utf8')
            if encoded != path.read_bytes():
                path.write_bytes(encoded)
                changed += 1
    print(f'Source provenance: {len(archives)} archive mappings; {changed} CSV files updated')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=HERE.parent)
    enrich(parser.parse_args().root)
