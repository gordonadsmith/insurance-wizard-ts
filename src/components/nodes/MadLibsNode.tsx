import React from 'react';
import { Handle, Position } from 'reactflow';
import { Edit, Copy, Flag } from 'lucide-react';
import { NodeComponentProps } from '../../types';
import { JERRY_PINK, BORDER, TONES } from '../../constants';

const MadLibsNode: React.FC<NodeComponentProps> = ({ id, data }) => {
  const hasToneTemplates = data.toneTemplates && Object.values(data.toneTemplates).some(t => typeof t === 'string' && t.trim() !== '');

  return (
    <div className="node-card" style={{border: data.isStart ? `2px solid ${JERRY_PINK}` : '1px solid #10b981', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)'}}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <Edit size={14} color="#10b981"/>
            <span style={{fontSize:'11px', color:'#10b981', fontWeight:'800'}}>WORD TRACK</span>
            {hasToneTemplates && <span style={{marginLeft: '2px', color: '#10b981'}}>●</span>}
          </div>
          <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
            {/* FIX: Wrapped icons in spans to safely pass the title attribute */}
            <span title="Duplicate Node" style={{display: 'flex'}}><Copy size={12} style={{cursor:'pointer', color: '#666'}} onClick={() => data.duplicateNode?.(id)}/></span>
            <span title="Set as Start Node" style={{display: 'flex'}}><Flag size={12} style={{cursor:'pointer', fill: data.isStart ? JERRY_PINK : 'none', color: data.isStart ? JERRY_PINK : '#ccc'}} onClick={() => data.setAsStartNode(id)}/></span>
          </div>
      </div>
      <input className="nodrag node-input-label" value={data.label} onChange={(evt) => data.onChange(id, { ...data, label: evt.target.value })} placeholder="STEP NAME"/>
      
      <div style={{fontSize:'9px', color:'#666', marginTop:'6px', marginBottom:'2px'}}>Default Template (Neutral):</div>
      <textarea 
        className="nodrag node-input-text" 
        style={{minHeight: '60px', fontFamily: 'monospace', fontSize: '11px'}} 
        value={data.template || ''} 
        onChange={(evt) => data.onChange(id, { ...data, template: evt.target.value })} 
        placeholder="Hi {name}, rate is ${rate}/mo."
      />

      {data.showToneScripts && (
        <div style={{marginTop:'8px', borderTop:`1px solid ${BORDER}`, paddingTop:'8px'}}>
          <div style={{fontSize:'9px', color:'#666', marginBottom:'4px', fontWeight:'600'}}>Tone-Specific Templates (Optional):</div>
          {['fun', 'efficient', 'detailed'].map(tone => (
            <div key={tone} style={{marginBottom:'6px'}}>
              <div style={{fontSize:'8px', color: TONES[tone as keyof typeof TONES].textColor, marginBottom:'2px', fontWeight:'600', textTransform:'uppercase'}}>
                {TONES[tone as keyof typeof TONES].label}:
              </div>
              <textarea 
                className="nodrag node-input-text" 
                style={{minHeight: '40px', fontFamily: 'monospace', fontSize: '11px', border: `1px solid ${TONES[tone as keyof typeof TONES].borderColor}`}} 
                value={data.toneTemplates?.[tone] || ''} 
                onChange={(evt) => data.onChange(id, { 
                  ...data, 
                  toneTemplates: { ...(data.toneTemplates || {}), [tone]: evt.target.value } 
                })} 
                placeholder={`Add ${tone} variation...`}
              />
            </div>
          ))}
        </div>
      )}

      <button
        className="nodrag"
        onClick={() => data.onChange(id, { ...data, showToneScripts: !data.showToneScripts })}
        style={{
          marginTop:'6px', padding:'4px 8px', fontSize:'9px', border:`1px solid ${BORDER}`,
          borderRadius:'4px', background:'white', cursor:'pointer', width:'100%', color:'#666'
        }}
      >
        {data.showToneScripts ? '▼ Hide' : '▶ Add'} Tone Variations
      </button>

      {/* FIX: Use string quotes inside brackets to satisfy the ESLint rule */}
      <div style={{fontSize:'9px', color:'#10b981', fontStyle:'italic', padding:'4px', background:'#f0fdf4', borderRadius:'4px', marginTop:'4px'}}>
        Use {"{variable_name}"} for fill-in-the-blanks
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

export default MadLibsNode;