import React from 'react';
import ReactQuill from 'react-quill-new';
import { Handle, Position } from 'reactflow';
import { DollarSign, Copy, Flag } from 'lucide-react';
import { NodeComponentProps } from '../../types';
import { JERRY_PINK, SLATE, BORDER } from '../../constants';

const QuoteNode: React.FC<NodeComponentProps> = ({ id, data }) => (
  <div className="node-card" style={{border: data.isStart ? `2px solid ${JERRY_PINK}` : `1px solid ${JERRY_PINK}`, boxShadow: `0 4px 6px -1px ${JERRY_PINK}20`}}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'6px'}}><DollarSign size={14} color={JERRY_PINK}/><span style={{fontSize:'11px', color:JERRY_PINK, fontWeight:'800'}}>QUOTE BUILDER</span></div>
        <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
          <Copy size={12} style={{cursor:'pointer', color: '#666'}} onClick={() => data.duplicateNode(id)}/>
          <Flag size={12} style={{cursor:'pointer', fill: data.isStart ? JERRY_PINK : 'none', color: data.isStart ? JERRY_PINK : '#ccc'}} onClick={() => data.setAsStartNode(id)}/>
        </div>
    </div>
    <input className="nodrag node-input-label" value={data.label} onChange={(evt) => data.onChange(id, { ...data, label: evt.target.value })} placeholder="STEP NAME"/>
    <textarea className="nodrag node-input-text" value={data.closingQuestion} onChange={(evt) => data.onChange(id, { ...data, closingQuestion: evt.target.value })} placeholder="Closing Question (Optional)..." rows={2}/>
    <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
  </div>
);

export default QuoteNode;
