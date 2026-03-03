import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import { Settings, X, CheckSquare, Layers, Trash2 } from 'lucide-react';
import { SettingsManagerProps, QuoteSettings } from '../types';
import { JERRY_PINK, SLATE, BORDER } from '../constants';

const SettingsManager: React.FC<SettingsManagerProps> = ({ isOpen, onClose, settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState<QuoteSettings>(settings);
  useEffect(() => { setLocalSettings(settings); }, [settings]);
  if (!isOpen) return null;
  const handleSave = () => { setSettings(localSettings); onClose(); };
  const addCoverage = () => { const id = Date.now().toString(); setLocalSettings(prev => ({ ...prev, coverages: [...prev.coverages, { id, label: "New Field", hasInput: false, isPolicyLevel: false, format: "{label} with {value}" }] })); };
  const removeCoverage = (id) => setLocalSettings(prev => ({ ...prev, coverages: prev.coverages.filter(c => c.id !== id) }));
  const updateCoverage = (id, field, value) => setLocalSettings(prev => ({ ...prev, coverages: prev.coverages.map(c => c.id === id ? { ...c, [field]: value } : c) }));

  return (
    <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'white', width:'700px', borderRadius:'16px', display:'flex', flexDirection:'column', boxShadow:'0 20px 50px rgba(0,0,0,0.2)', maxHeight:'85vh', overflow:'hidden'}}>
        <div style={{padding:'20px', borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}><h2 style={{margin:0, fontSize:'18px', display:'flex', gap:'8px'}}><Settings color={JERRY_PINK}/> Quote Configuration</h2><button onClick={onClose} style={{background:'none', border:'none'}}><X size={24}/></button></div>
        <div style={{padding:'20px', overflowY:'auto'}}>
          <div style={{marginBottom:'20px'}}><label style={{fontSize:'12px', fontWeight:'bold', color:'#999', display:'block', marginBottom:'8px'}}>MAIN TEMPLATE (HTML Supported)</label>
          <ReactQuill theme="snow" value={localSettings.template} onChange={(val) => setLocalSettings(prev => ({ ...prev, template: val }))} />
          </div>
          <div style={{marginBottom:'20px'}}><label style={{fontSize:'12px', fontWeight:'bold', color:'#999', display:'block', marginBottom:'8px'}}>VEHICLE PHRASE FORMAT</label><input value={localSettings.vehicleTemplate} onChange={(e) => setLocalSettings(prev => ({ ...prev, vehicleTemplate: e.target.value }))} style={{width:'100%', padding:'8px', border:`1px solid ${BORDER}`, borderRadius:'4px', fontFamily:'monospace', fontSize:'13px'}}/></div>
          <div><label style={{fontSize:'12px', fontWeight:'bold', color:'#999', display:'block', marginBottom:'8px'}}>QUOTE FIELDS</label><div style={{display:'flex', flexDirection:'column', gap:'8px'}}>{localSettings.coverages.map(c => (<div key={c.id} style={{display:'flex', gap:'8px', alignItems:'center', background:'#f9fafb', padding:'8px', borderRadius:'6px', flexWrap:'wrap'}}><div style={{flexGrow:1, minWidth:'150px'}}><input value={c.label} onChange={(e) => updateCoverage(c.id, 'label', e.target.value)} style={{width:'100%', padding:'6px', border:`1px solid ${BORDER}`, borderRadius:'4px'}} placeholder="Label"/></div><div style={{flexGrow:2, minWidth:'200px'}}><input value={c.format || ""} onChange={(e) => updateCoverage(c.id, 'format', e.target.value)} style={{width:'100%', padding:'6px', border:`1px solid ${BORDER}`, borderRadius:'4px'}} placeholder="{label} with {value}"/></div><div style={{display:'flex', gap:'8px', marginTop:'0px'}}><div title="Policy Level?" onClick={() => updateCoverage(c.id, 'isPolicyLevel', !c.isPolicyLevel)} style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', cursor:'pointer', padding:'4px 8px', borderRadius:'4px', background:'white', border: c.isPolicyLevel ? `1px solid ${SLATE}` : `1px solid ${BORDER}`, color: c.isPolicyLevel ? SLATE : '#999'}}><Layers size={14} /> {c.isPolicyLevel ? "Policy" : "Veh"}</div><div title="Allow inputs?" onClick={() => updateCoverage(c.id, 'hasInput', !c.hasInput)} style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', cursor:'pointer', padding:'4px 8px', borderRadius:'4px', background:'white', border: c.hasInput ? `1px solid ${JERRY_PINK}` : `1px solid ${BORDER}`, color: c.hasInput ? JERRY_PINK : '#999'}}><CheckSquare size={14} /> {c.hasInput ? "Input" : "Fixed"}</div><button onClick={() => removeCoverage(c.id)} style={{color:'#ff4444', background:'none', border:'none'}}><Trash2 size={16}/></button></div></div>))} <button onClick={addCoverage} style={{padding:'8px', background:'#eee', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold', width:'100%'}}>+ Add New Field</button></div></div></div>
        <div style={{padding:'20px', borderTop:`1px solid ${BORDER}`, display:'flex', justifyContent:'flex-end'}}><button className="btn-primary" onClick={handleSave} style={{background: JERRY_PINK, border:'none'}}>Save Configuration</button></div>
      </div>
    </div>
  );
};

export default SettingsManager;
