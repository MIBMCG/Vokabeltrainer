import {normalize} from '../model/revisions.js';

function issue(rowId, code, message) {
  return {rowId, code, message};
}

function rowValue(source, rowId) {
  return {
    rowId,
    german: source.german.trim(),
    answers: source.answers.map((answer) => answer.trim()).filter(Boolean),
    hint: source.hint.trim(),
    decision: ['include', 'skip', 'separate'].includes(source.decision)
      ? source.decision : 'include',
  };
}

function semantic(value) {
  const source = value?.value ?? value;
  return {
    german: normalize(source.german ?? ''),
    answers: [...new Set((source.answers ?? []).map((answer) => normalize(answer)))].sort(),
    hint: normalize(source.hint ?? ''),
  };
}

export function parseTable(text) {
  if (typeof text !== 'string') throw new TypeError('Der Tabelleninhalt muss Text sein.');
  const rows = [];
  const issues = [];
  const lines = text.replace(/\r\n?/gu, '\n').split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '') continue;
    const rowId = `row-${index + 1}`;
    const columns = line.split('\t');
    const row = rowValue({
      german: columns[0] ?? '',
      answers: (columns[1] ?? '').split('|'),
      hint: columns[2] ?? '',
      decision: 'include',
    }, rowId);
    rows.push(row);
    if (columns.length < 2 || columns.length > 3) {
      issues.push(issue(
        rowId,
        'columns',
        `Diese Zeile muss zwei oder drei Tabellenspalten haben. Rohzeile: ${line}`,
      ));
    }
    if (line.includes('"')) {
      issues.push(issue(
        rowId,
        'quotes',
        `Anführungszeichen oder mehrzeilige Tabellenzellen bitte direkt prüfen. Rohzeile: ${line}`,
      ));
    }
    if (row.german === '' || row.answers.length === 0) {
      issues.push(issue(rowId, 'required', 'Deutsches Wort und mindestens eine englische Lösung sind erforderlich.'));
    }
  }
  return {rows, issues};
}

export function validateRows(rows, existingWords) {
  if (!Array.isArray(rows) || !Array.isArray(existingWords)) {
    throw new TypeError('Die Importvorschau ist ungültig.');
  }
  const checked = rows.map((row, index) => rowValue(row, row.rowId || `row-${index + 1}`));
  const issues = [];
  const seenGerman = existingWords
    .filter((word) => !(word?.value ?? word)?.archived)
    .map((word) => semantic(word).german)
    .filter(Boolean);

  for (const row of checked) {
    if (row.decision === 'skip') continue;
    if (row.german === '' || row.answers.length === 0) {
      issues.push(issue(row.rowId, 'required', 'Deutsches Wort und mindestens eine englische Lösung sind erforderlich.'));
    }
    if (row.german.length > 200 || row.hint.length > 300
      || row.answers.length > 20 || row.answers.some((answer) => answer.length > 200)) {
      issues.push(issue(row.rowId, 'length', 'Mindestens ein Feld überschreitet die zulässige Länge.'));
    }
    const german = semantic(row).german;
    if (german && seenGerman.includes(german) && row.decision !== 'separate') {
      issues.push(issue(row.rowId, 'duplicate', 'Dieses deutsche Wort ist bereits vorhanden. Bitte überspringen oder getrennt übernehmen.'));
    }
    if (german) seenGerman.push(german);
  }
  return {rows: checked, issues};
}

export async function applyRows(rows, commitRow, onRemaining = () => {}) {
  if (!Array.isArray(rows) || typeof commitRow !== 'function' || typeof onRemaining !== 'function') {
    throw new TypeError('Die geprüften Importzeilen sind ungültig.');
  }
  let remaining = rows.filter(({decision}) => decision !== 'skip').map((row) => structuredClone(row));
  onRemaining(structuredClone(remaining));
  while (remaining.length > 0) {
    await commitRow(structuredClone(remaining[0]));
    remaining = remaining.slice(1);
    onRemaining(structuredClone(remaining));
  }
}
