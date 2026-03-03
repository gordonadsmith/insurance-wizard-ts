import { Node, Edge } from 'reactflow';
import { CarrierMap } from '../types';

interface ExportParams {
  flowName: string;
  nodes: Node[];
  edges: Edge[];
  carriers: CarrierMap;
  callTypes: string[];
}

export const exportPlaybookAsText = ({ flowName, nodes, edges, carriers, callTypes }: ExportParams): void => {
  try {
    const output: string[] = [];
    const HR = '═'.repeat(88);
    const SEC = '─'.repeat(88);
    const SUB = '·'.repeat(88);

    output.push(HR, '                    INSURANCE WIZARD PLAYBOOK', '                     LEGAL COMPLIANCE REVIEW', HR, '');
    output.push('  PLAYBOOK INFORMATION:', '');
    output.push('    Name:             ' + flowName.replace('.json', ''));
    output.push('    Export Date:      ' + new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    output.push('    Total Steps:      ' + nodes.length);
    output.push('    Total Paths:      ' + edges.length);
    output.push('', SEC, '', '  SECTION 1: CALL TYPES', '');
    callTypes.forEach((type, idx) => output.push('    ' + (idx + 1) + '. ' + type));
    output.push('', SEC, '', '  SECTION 2: CARRIER SCRIPTS', '');

    Object.values(carriers).forEach((carrier, idx) => {
      output.push(SUB, '', '  CARRIER ' + (idx + 1) + ': ' + carrier.name.toUpperCase(), '');
      if (carrier.scripts) {
        callTypes.forEach(ct => {
          const script = carrier.scripts[ct];
          if (script?.trim()) {
            output.push('    Call Type: ' + ct.toUpperCase());
            const clean = script.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
            if (clean) clean.split('\n').forEach(l => { if (l.trim()) output.push('      ' + l.trim()); });
            output.push('');
          }
        });
      }
    });

    output.push(SEC, '', '  SECTION 3: CALL FLOW', '');
    const startNode = nodes.find(n => n.data?.isStart) || nodes[0];
    if (startNode) {
      const visited = new Set<string>();
      let stepNum = 1;
      const buildTree = (nodeId: string, depth: number) => {
        if (!nodeId || visited.has(nodeId) || depth > 20) return;
        visited.add(nodeId);
        const node = nodes.find(n => n.id === nodeId);
        if (!node?.data) return;
        const indent = '  ' + '│  '.repeat(depth);
        output.push(indent + 'STEP ' + stepNum + ': ' + (node.data.label || ''));
        stepNum++;
        if (node.type === 'scriptNode' && node.data.text) {
          output.push(indent + '  ' + node.data.text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
        }
        const children = edges.filter(e => e.source === nodeId);
        children.forEach(edge => {
          output.push(indent + '  → [' + (edge.label || 'Next') + ']');
          buildTree(edge.target, depth + 1);
        });
        if (children.length === 0) output.push(indent + '  [END]');
      };
      buildTree(startNode.id, 0);
    }

    output.push('', HR, '', '  END OF DOCUMENT', '', '  Exported: ' + new Date().toLocaleString(), '', HR);

    const blob = new Blob([output.join('\n')], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = flowName.replace('.json', '') + '_LEGAL_REVIEW.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error: any) {
    alert('Error exporting: ' + error.message);
  }
};
