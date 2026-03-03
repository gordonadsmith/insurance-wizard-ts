import React from 'react';
import { Handle, Position } from 'reactflow';
import { Building2, Copy, Flag } from 'lucide-react';
import { NodeComponentProps } from '../../types';
import { JERRY_PINK, SLATE, BORDER, DEFAULT_CALL_TYPES } from '../../constants';

const CarrierNode: React.FC<NodeComponentProps> = ({ id, data }) => {
  const availableCallTypes = data.callTypes || DEFAULT_CALL_TYPES;
  return (
    <div className="node-card" style={{border: data.isStart ? `2px solid ${JERRY_PINK}` : '1px solid #8b5cf6', boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.1)'}}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'6px'}}><Building2 size={14} color="#8b5cf6"/><span style={{fontSize:'11px', color:'#8b5cf6', fontWeight:'800'}}>CARRIER LOOKUP</span></div>
          <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
            <Copy size={12} style={{cursor:'pointer', color: '#666'}} onClick={() => data.duplicateNode(id)}/>
            <Flag size={12} style={{cursor:'pointer', fill: data.isStart ? JERRY_PINK : 'none', color: data.isStart ? JERRY_PINK : '#ccc'}} onClick={() => data.setAsStartNode(id)}/>
          </div>
      </div>
      <input className="nodrag node-input-label" value={data.label} onChange={(evt) => data.onChange(id, { ...data, label: evt.target.value })} placeholder="STEP NAME"/>
      <select 
        className="nodrag" 
        value={data.defaultCallType || availableCallTypes[0] || "Quote"} 
        onChange={(evt) => data.onChange(id, { ...data, defaultCallType: evt.target.value })}
        style={{width:'100%', padding:'6px', fontSize:'11px', border:`1px solid ${BORDER}`, borderRadius:'4px', marginTop:'6px', background:'white'}}
      >
        {availableCallTypes.map(type => <option key={type} value={type}>{type}</option>)}
      </select>
      <div style={{fontSize:'10px', color:'#666', fontStyle:'italic', padding:'4px', marginTop:'4px'}}>Default call type (can be changed during call)</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

export default CarrierNode;
