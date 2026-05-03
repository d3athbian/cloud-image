import { memo } from 'react';

interface JsonViewProps {
  data: unknown;
}

function renderValue(value: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => `${spaces}  ${renderValue(v, indent + 1)}`).join(',\n');
    return `[\n${items}\n${spaces}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const items = keys
      .map((k) => `${spaces}  "${k}": ${renderValue(obj[k], indent + 1)}`)
      .join(',\n');
    return `{\n${items}\n${spaces}}`;
  }
  return String(value);
}

export const JsonView = memo(function JsonView({ data }: JsonViewProps) {
  return (
    <pre className="text-xs font-dt-mono bg-dt-bg-base p-3 rounded-md overflow-auto whitespace-pre-wrap">
      <code>{renderValue(data)}</code>
    </pre>
  );
});
