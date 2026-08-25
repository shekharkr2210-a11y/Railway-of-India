const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'app', 'components');
const filesToUpdate = [
  path.join(__dirname, 'app', 'globals.css'),
  path.join(__dirname, 'app', 'page.tsx'),
  path.join(__dirname, 'app', 'components', 'Header.tsx'),
  path.join(__dirname, 'app', 'components', 'NationalOverview.tsx'),
  path.join(__dirname, 'app', 'components', 'MetricsOverview.tsx'),
  path.join(__dirname, 'app', 'components', 'CorridorMap.tsx'),
  path.join(__dirname, 'app', 'components', 'TimeSpaceGantt.tsx'),
  path.join(__dirname, 'app', 'components', 'ShadowBlockShowcase.tsx'),
  path.join(__dirname, 'app', 'components', 'TaskPriorityTable.tsx'),
  path.join(__dirname, 'app', 'components', 'BDMSWorkflow.tsx'),
  path.join(__dirname, 'app', 'components', 'DataIngestionPanel.tsx'),
  path.join(__dirname, 'app', 'components', 'CyberSecurityPanel.tsx'),
  path.join(__dirname, 'app', 'components', 'ZoneDetailModal.tsx')
];

const replacements = {
  // Backgrounds
  'bg-slate-950/90': 'bg-white/95',
  'bg-slate-950': 'bg-white',
  'bg-slate-900/90': 'bg-gray-50/90',
  'bg-slate-900/80': 'bg-gray-100/80',
  'bg-slate-900/60': 'bg-gray-100/60',
  'bg-slate-900/50': 'bg-gray-100/50',
  'bg-slate-900': 'bg-gray-50',
  'bg-slate-800/80': 'bg-gray-200/80',
  'bg-slate-800/60': 'bg-gray-200/60',
  'bg-slate-800/50': 'bg-gray-200/50',
  'bg-slate-800/40': 'bg-gray-200/40',
  'bg-slate-800': 'bg-gray-100', // Note: could mess up some specific logic, but let's see.

  // Text
  'text-slate-100': 'text-gray-900',
  'text-slate-200': 'text-gray-800',
  'text-slate-300': 'text-gray-700',
  'text-slate-400': 'text-gray-500',
  'text-slate-500': 'text-gray-400',
  // text-white is tricky. We'll manually fix it if needed or use regex
  
  // Borders
  'border-slate-800/80': 'border-gray-200/80',
  'border-slate-800/60': 'border-gray-200/60',
  'border-slate-800/40': 'border-gray-200/40',
  'border-slate-800': 'border-gray-200',
  'border-slate-900': 'border-gray-200',
  'border-slate-700': 'border-gray-300',
  
  // Hovers
  'hover:text-slate-200': 'hover:text-gray-900',
  'hover:bg-slate-800/50': 'hover:bg-gray-200/50',
  'hover:bg-slate-900': 'hover:bg-gray-100',
};

filesToUpdate.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace gradient text specifically
  content = content.replace(/bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent/g, 'text-gray-900');
  
  // Apply standard replacements using word boundaries or simple string replace?
  // We need to be careful with substrings like bg-slate-900 matching bg-slate-900/50.
  // We'll process them in the order they are defined above, since longer strings are first.
  Object.keys(replacements).forEach(key => {
    const val = replacements[key];
    // Use split and join to replace all occurrences
    content = content.split(key).join(val);
  });
  
  // Fix tabs or active items: replace bg-gray-100 text-amber-400 with bg-amber-50 text-amber-700
  content = content.replace(/'bg-gray-100 text-amber-400 font-semibold border border-amber-500\/30'/g, "'bg-amber-50 text-amber-700 font-semibold border border-amber-500/30'");
  content = content.replace(/'bg-gray-100 text-emerald-400 font-semibold border border-emerald-500\/30'/g, "'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-500/30'");

  // Fix text-white except in buttons (with amber/red gradients)
  // Let's not touch text-white globally, but look for specific cases if necessary.
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});
