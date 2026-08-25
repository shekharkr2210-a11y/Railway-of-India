const fs = require('fs');
const path = require('path');

const filesToUpdate = [
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

filesToUpdate.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // A regex to replace text-white only if the line doesn't contain a solid colored background like bg-red-500, bg-blue-500, etc.
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('text-white')) {
      if (
        line.includes('bg-red-') || 
        line.includes('bg-blue-') || 
        line.includes('bg-purple-') || 
        line.includes('bg-emerald-') ||
        line.includes('from-amber-') ||
        line.includes('selection:')
      ) {
        // keep text-white
      } else {
        lines[i] = line.replace(/text-white/g, 'text-gray-900');
      }
    }
  }
  content = lines.join('\n');
  
  // also fix some residual bugs
  content = content.replace(/hover:bg-slate-700/g, 'hover:bg-gray-200');
  content = content.replace(/bg-slate-900/g, 'bg-gray-50');
  content = content.replace(/bg-slate-800/g, 'bg-gray-100');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated text-white in ${file}`);
});
