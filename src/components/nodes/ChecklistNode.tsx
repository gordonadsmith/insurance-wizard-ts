import React from 'react';
import { Handle, Position } from 'reactflow';
import { ClipboardCheck, Copy, Flag } from 'lucide-react';
import { NodeComponentProps } from '../../types';
import { JERRY_PINK, COMPLIANCE_ORANGE, SLATE, BORDER } from '../../constants';

const ChecklistNode: React.FC<NodeComponentProps> = ({ id, data }) => (
  <div className="node-card" style={{border: data.isStart ? `2px solid ${JERRY_PINK}` : `1px solid ${COMPLIANCE_ORANGE}`, boxShadow: `0 4px 6px -1px ${COMPLIANCE_ORANGE}20`}}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'6px'}}><ClipboardCheck size={14} color={COMPLIANCE_ORANGE}/><span style={{fontSize:'11px', color:COMPLIANCE_ORANGE, fontWeight:'800'}}>COMPLIANCE CHECK</span></div>
        <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
          <Copy size={12} style={{cursor:'pointer', color: '#666'}} onClick={() => data.duplicateNode(id)}/>
          <Flag size={12} style={{cursor:'pointer', fill: data.isStart ? JERRY_PINK : 'none', color: data.isStart ? JERRY_PINK : '#ccc'}} onClick={() => data.setAsStartNode(id)}/>
        </div>
    </div>
    <input className="nodrag node-input-label" value={data.label} onChange={(evt) => data.onChange(id, { ...data, label: evt.target.value })} placeholder="STEP NAME"/>
    <textarea className="nodrag node-input-text" style={{minHeight: '80px', fontFamily: 'monospace'}} value={data.items} onChange={(evt) => data.onChange(id, { ...data, items: evt.target.value })} placeholder="Enter one question per line... End with (yes/no) for radio buttons" />
    <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
  </div>
);

export default ChecklistNode;
