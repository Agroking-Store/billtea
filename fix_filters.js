const fs = require('fs');
const filePath = 'mobile/src/app/(app)/quotations.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const replacements = [
  { from: /\bcustomerFilter\b/g, to: 'oldCustomerFilter' },
  { from: /\bsetCustomerFilter\b/g, to: 'oldSetCustomerFilter' },
  { from: /\bstatusFilter\b/g, to: 'oldStatusFilter' },
  { from: /\bsetStatusFilter\b/g, to: 'oldSetStatusFilter' },
  { from: /\bfromDate\b/g, to: 'oldFromDate' },
  { from: /\bsetFromDate\b/g, to: 'oldSetFromDate' },
  { from: /\btoDate\b/g, to: 'oldToDate' },
  { from: /\bsetToDate\b/g, to: 'oldSetToDate' },
  { from: /\bhasActiveFilters\b/g, to: 'oldHasActiveFilters' },
  { from: /\buniqueCustomers\b/g, to: 'oldUniqueCustomers' },
  { from: /\bfilteredQuotations\b/g, to: 'oldFilteredQuotations' },
  { from: /\bfilteredInvoices\b/g, to: 'oldFilteredInvoices' },
  { from: /\bhandleClearFilters\b/g, to: 'oldHandleClearFilters' },
];

for (let i = 0; i < lines.length; i++) {
  // Apply to the first block (logic)
  if (i >= 160 && i <= 313) {
    replacements.forEach(r => {
      lines[i] = lines[i].replace(r.from, r.to);
    });
  }
  // Apply to the inline filter JSX block
  if (i >= 1480 && i <= 1650) {
    replacements.forEach(r => {
      lines[i] = lines[i].replace(r.from, r.to);
    });
  }
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Fixed duplicate variables.');
