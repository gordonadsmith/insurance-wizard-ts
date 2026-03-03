import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import { Handle, Position } from 'reactflow';
import { Copy, Flag } from 'lucide-react';
import { NodeComponentProps } from '../../types';
import { JERRY_PINK, JERRY_BG, SLATE, BORDER, TONES } from '../../constants';

const ScriptNode: React.FC<NodeComponentProps> = ({ id, data }) => {
  // Check if this node has tone-specific scripts
  const hasToneScripts = data.toneScripts && Object.keys(data.toneScripts).length > 0;
  
  return (
    <div className="node-card" style={{border: data.isStart ? `2px solid ${JERRY_PINK}` : `1px solid ${BORDER}`}}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
          <div style={{fontSize: '10px', color: data.isStart ? JERRY_PINK : '#999', fontWeight: data.isStart ? 'bold' : 'normal', textTransform:'uppercase'}}>
            {data.isStart ? 'START STEP' : 'Script Step'}
            {hasToneScripts && <span style={{marginLeft: '4px', color: '#10b981'}}>●</span>}
          </div>
          <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
            <Copy size={12} style={{cursor:'pointer', color: '#666'}} onClick={() => data.duplicateNode(id)}/>
            <Flag size={12} style={{cursor:'pointer', fill: data.isStart ? JERRY_PINK : 'none', color: data.isStart ? JERRY_PINK : '#ccc'}} onClick={() => data.setAsStartNode(id)}/>
          </div>
      </div>
      <input className="nodrag node-input-label" value={data.label} onChange={(evt) => data.onChange(id, { ...data, label: evt.target.value })} placeholder="STEP NAME"/>
      
      {/* Default/Neutral script */}
      <div style={{fontSize:'9px', color:'#666', marginTop:'6px', marginBottom:'2px'}}>Default Script (All Tones):</div>
      <div className="nodrag" style={{background:'white'}}>
          <ReactQuill theme="bubble" value={data.text} onChange={(val) => data.onChange(id, { ...data, text: val })} placeholder="Type default script..." />
      </div>
      
      {/* Tone-specific scripts (collapsed by default) */}
      {data.showToneScripts && (
        <div style={{marginTop:'8px', borderTop:`1px solid ${BORDER}`, paddingTop:'8px'}}>
          <div style={{fontSize:'9px', color:'#666', marginBottom:'4px', fontWeight:'600'}}>Tone-Specific Scripts (Optional):</div>
          
          {['fun', 'efficient', 'detailed'].map(tone => (
            <div key={tone} style={{marginBottom:'6px'}}>
              <div style={{fontSize:'8px', color: TONES[tone].textColor, marginBottom:'2px', fontWeight:'600', textTransform:'uppercase'}}>
                {TONES[tone].label}:
              </div>
              <div className="nodrag" style={{background:'white', border: `1px solid ${TONES[tone].borderColor}`, borderRadius:'4px'}}>
                <ReactQuill 
                  theme="bubble" 
                  value={data.toneScripts?.[tone] || ''} 
                  onChange={(val) => data.onChange(id, { 
                    ...data, 
                    toneScripts: { ...data.toneScripts, [tone]: val } 
                  })} 
                  placeholder={`Add ${tone} variation...`} 
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Toggle button for tone scripts */}
      <button
        className="nodrag"
        onClick={() => data.onChange(id, { ...data, showToneScripts: !data.showToneScripts })}
        style={{
          marginTop:'6px',
          padding:'4px 8px',
          fontSize:'9px',
          border:`1px solid ${BORDER}`,
          borderRadius:'4px',
          background:'white',
          cursor:'pointer',
          width:'100%',
          color:'#666'
        }}
      >
        {data.showToneScripts ? '▼ Hide' : '▶ Add'} Tone Variations
      </button>
      
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

export default ScriptNode;
