import { Download } from 'lucide-react';
import './ExportButton.css';

function toCSV(data) {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const val = row[h] ?? '';
    const str = String(val).replace(/"/g, '""');
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
  }).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export default function ExportButton({ data, filename, label = 'Export CSV' }) {
  const handleExport = () => {
    const csv = toCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="export-btn" onClick={handleExport}>
      <Download size={13} />
      {label}
    </button>
  );
}
