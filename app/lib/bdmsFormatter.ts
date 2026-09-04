import { BlockWindow, Department } from './types';

export interface BDMSBlockRequest {
  requestId: string;
  requestDate: string;
  requestingDepartment: string;
  sectionDetails: { corridor: string; fromKm: number; toKm: number; track: string };
  blockDetails: { date: string; fromTime: string; toTime: string; durationMinutes: number; blockType: 'TRAFFIC' | 'POWER' | 'COMBINED' };
  workDescription: string;
  machineryRequired: string[];
  safetyPrecautions: string[];
  approvalChain: { role: string; name: string; status: string; timestamp?: string }[];
  digitalSignature?: string;
}

export const bdmsFormatter = {
  formatBlock(block: BlockWindow): BDMSBlockRequest {
    const blockType = block.powerBlockRequired ? 'COMBINED' : 'TRAFFIC';
    
    return {
      requestId: `REQ-${block.id}`,
      requestDate: new Date().toISOString().split('T')[0],
      requestingDepartment: block.participatingDepartments.join(' + '),
      sectionDetails: {
        corridor: block.sectionName,
        fromKm: 0, // Placeholder as block doesn't explicitly store startKm, could infer from tasks
        toKm: 0,
        track: block.track || 'UP_MAIN',
      },
      blockDetails: {
        date: block.scheduledDate || new Date().toISOString().split('T')[0],
        fromTime: block.startTime,
        toTime: block.endTime,
        durationMinutes: block.durationHours * 60,
        blockType,
      },
      workDescription: `Shadow block coordinating ${block.taskIds.length} tasks.`,
      machineryRequired: block.assignedMachines || [],
      safetyPrecautions: [
        block.powerBlockRequired ? 'Ensure OHE power off and discharged.' : '',
        'Ensure proper track protection as per G&SR.'
      ].filter(Boolean),
      approvalChain: [
        { role: 'Section Engineer', name: 'Authorized Supervisor', status: 'PROPOSED' },
        { role: 'Traffic Controller', name: 'Section Controller', status: 'PENDING' }
      ]
    };
  },

  formatBatch(blocks: BlockWindow[]): BDMSBlockRequest[] {
    return blocks.map(b => this.formatBlock(b));
  },

  generateCSV(blocks: BlockWindow[]): string {
    const headers = [
      'Request_ID',
      'Request_Date',
      'Departments',
      'Corridor',
      'Date',
      'Start_Time',
      'End_Time',
      'Duration_Min',
      'Block_Type',
      'Machines',
    ];
    
    const rows = blocks.map(b => {
      const req = this.formatBlock(b);
      return [
        req.requestId,
        req.requestDate,
        `"${req.requestingDepartment}"`,
        `"${req.sectionDetails.corridor}"`,
        req.blockDetails.date,
        req.blockDetails.fromTime,
        req.blockDetails.toTime,
        req.blockDetails.durationMinutes,
        req.blockDetails.blockType,
        `"${req.machineryRequired.join(', ')}"`,
      ].join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }
};
