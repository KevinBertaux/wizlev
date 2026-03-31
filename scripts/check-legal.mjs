import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const COMMON_FORBIDDEN = [
  { label: 'legacy visible brand', regex: /ManabuPlay/g },
  { label: 'legacy app slug', regex: /manabuplay/g },
  { label: 'legacy domain', regex: /manabuplay\.fr/g },
  { label: 'non-obfuscated legal email', regex: /contact@wizlev\.com/g },
];

const FILE_RULES = [
  {
    path: 'src/views/LegalNoticeView.vue',
    required: [
      { label: 'public brand', regex: /WizLev/g },
      { label: 'public domain', regex: /wizlev\.com/g },
      { label: 'obfuscated contact email', regex: /contact \[at\] wizlev \[dot\] com/g },
    ],
  },
  {
    path: 'src/views/LegalPrivacyView.vue',
    required: [
      { label: 'public brand', regex: /WizLev/g },
      { label: 'obfuscated contact email', regex: /contact \[at\] wizlev \[dot\] com/g },
    ],
  },
  {
    path: 'src/views/LegalCookiesView.vue',
    required: [
      { label: 'public brand', regex: /WizLev/g },
      { label: 'obfuscated contact email', regex: /contact \[at\] wizlev \[dot\] com/g },
    ],
  },
  {
    path: 'src/views/LegalTermsView.vue',
    required: [
      { label: 'public brand', regex: /WizLev/g },
      { label: 'obfuscated contact email', regex: /contact \[at\] wizlev \[dot\] com/g },
    ],
  },
];

const issues = [];
for (const rule of FILE_RULES) {
  const filePath = join(process.cwd(), rule.path);
  const content = readFileSync(filePath, 'utf8');

  for (const pattern of COMMON_FORBIDDEN) {
    for (const match of content.matchAll(pattern.regex)) {
      const line = content.slice(0, match.index).split('\n').length;
      issues.push(`${relative(process.cwd(), filePath)}:${line} -> ${pattern.label}: ${match[0]}`);
    }
  }

  for (const pattern of rule.required) {
    if (!pattern.regex.test(content)) {
      issues.push(`${rule.path} missing required legal token: ${pattern.label}`);
    }
    pattern.regex.lastIndex = 0;
  }
}

if (issues.length > 0) {
  console.error('Legal guard failed. Public legal pages are inconsistent:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Legal guard OK: public legal pages use WizLev public identity and obfuscated contact details.');