import React from 'react';
import { NodeComponentProps } from '../../types';
import ScriptNode from './ScriptNode';
import CarrierNode from './CarrierNode';
import QuoteNode from './QuoteNode';
import ChecklistNode from './ChecklistNode';
import MadLibsNode from './MadLibsNode';

export const nodeTypes: Record<string, React.FC<NodeComponentProps>> = {
  scriptNode: ScriptNode,
  carrierNode: CarrierNode,
  quoteNode: QuoteNode,
  checklistNode: ChecklistNode,
  madLibsNode: MadLibsNode,
};

export { ScriptNode, CarrierNode, QuoteNode, ChecklistNode, MadLibsNode };
