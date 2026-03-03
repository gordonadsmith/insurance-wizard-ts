import React from 'react';
import ReactQuill from 'react-quill-new';
import { Handle, Position } from 'reactflow';
import { Edit, Copy, Flag } from 'lucide-react';
import { NodeComponentProps } from '../../types';
import { JERRY_PINK, SLATE, BORDER } from '../../constants';

const MadLibsNode: React.FC<NodeComponentProps> = ({ id, data }) => (
  <div className="node-card" style={{border: data.isStart ? `2px solid ${JERRY_PINK}` : '1px solid #10b981', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)'}}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'6px'}}><Edit size={14} color="#10b981"/><span style={{fontSize:'11px', color:'#10b981', fontWeight:'800'}}>WORD TRACK</span></div>
        <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
          <Copy size={12} style={{cursor:'pointer', color: '#666'}} onClick={() => data.duplicateNode(id)}/>
          <Flag size={12} style={{cursor:'pointer', fill: data.isStart ? JERRY_PINK : 'none', color: data.isStart ? JERRY_PINK : '#ccc'}} onClick={() => data.setAsStartNode(id)}/>
        </div>
    </div>
    <input className="nodrag node-input-label" value={data.label} onChange={(evt) => data.onChange(id, { ...data, label: evt.target.value })} placeholder="STEP NAME"/>
    <textarea 
      className="nodrag node-input-text" 
      style={{minHeight: '80px', fontFamily: 'monospace', fontSize: '11px'}} 
      value={data.template} 
      onChange={(evt) => data.onChange(id, { ...data, template: evt.target.value })} 
      placeholder="Type word track with variables like: Hi {name}, your rate is ${rate}/month."
    />
    <div style={{fontSize:'9px', color:'#10b981', fontStyle:'italic', padding:'4px', background:'#f0fdf4', borderRadius:'4px', marginTop:'4px'}}>
      Use {`{variable_name}`} for fill-in-the-blanks
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
  </div>
);


export default MadLibsNode;
