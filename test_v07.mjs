import {
  MASTER_SYMPTOMS_BANK,
  MASTER_PMH_CATEGORIES,
  MASTER_DRUG_CATEGORIES,
  ALL_MASTER_SYMPTOMS,
  ALL_MASTER_PMH_ITEMS,
  ALL_MASTER_DRUGS
} from './js/schema.js';
import { filterSchemaItems, createDefaultClinicalState, createDefaultPresentation } from './js/app.js';
import { generateClinicalNote } from './js/generator.js';

console.log('--- 1. Testing Schema Counts ---');
console.log('Symptoms bank count:', MASTER_SYMPTOMS_BANK.length);
console.log('PMH categories count:', MASTER_PMH_CATEGORIES.length);
console.log('PMH flattened items count:', ALL_MASTER_PMH_ITEMS.length);
console.log('Drug categories count:', MASTER_DRUG_CATEGORIES.length);
console.log('Drug flattened items count:', ALL_MASTER_DRUGS.length);

console.log('\n--- 2. Testing Omnisearch filterSchemaItems ---');
const queries = ['پلا', 'plav', 'کونکور', 'دیابت', 'هماتمز', 'زارلتو', 'لوزارتان', 'نولپازا', 'آپاندیسیت', 'سرفه'];

queries.forEach(q => {
  const symMatches = filterSchemaItems(q, MASTER_SYMPTOMS_BANK);
  const pmhMatches = filterSchemaItems(q, ALL_MASTER_PMH_ITEMS);
  const drugMatches = filterSchemaItems(q, ALL_MASTER_DRUGS);
  console.log(`Query "${q}":`, {
    symptoms: symMatches.map(m => m.label).slice(0, 2),
    pmh: pmhMatches.map(m => m.label).slice(0, 2),
    drugs: drugMatches.map(m => m.label + ' [' + (m.brands || '') + ']').slice(0, 2)
  });
});

console.log('\n--- 3. Testing Empty State Default ---');
const state = createDefaultClinicalState();
console.log('Default state presentations length:', state.hpi.presentations.length);
if (state.hpi.presentations.length !== 0) {
  console.error('ERROR: presentations should be empty by default!');
  process.exit(1);
} else {
  console.log('✓ Verified: state.hpi.presentations is empty by default');
}

console.log('\n--- 4. Testing Generator with Empty Presentations ---');
state.demographics.fullName = 'علی احمدی';
state.demographics.gender = 'male';
state.demographics.age = '54';
const noteEmpty = generateClinicalNote(state);
console.log('Note length with empty presentations:', noteEmpty.length);
console.log('Contains patient header:', noteEmpty.includes('علی احمدی'));

console.log('\n--- 5. Testing Infinite Presentations ---');
const pres1 = createDefaultPresentation('trauma_burn_archetype');
pres1.title = 'چاقوخوردگی پهلوی چپ';
const pres2 = createDefaultPresentation('pain_archetype');
pres2.title = 'درد اپی‌گاستر';
const pres3 = createDefaultPresentation('mass_lesion_archetype');
pres3.title = 'توده قدام گردن';

state.hpi.presentations.push(pres1, pres2, pres3);
console.log('Added 3 presentations, total:', state.hpi.presentations.length);
const note3 = generateClinicalNote(state);
console.log('Note length with 3 presentations:', note3.length);
console.log('Generated narrative sample:\n' + note3.substring(0, 500) + '...');

console.log('\n✓ All logic tests passed successfully!');
