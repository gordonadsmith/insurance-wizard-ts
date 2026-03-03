import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import { X, Trash2, Building2, Plus } from 'lucide-react';
import { CarrierManagerProps, Carrier } from '../types';
import { JERRY_PINK, SLATE, BORDER } from '../constants';

const CarrierManager: React.FC<CarrierManagerProps> = ({ isOpen, onClose, carriers, setCarriers, callTypes }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Carrier | null>(null);
  const [activeCallType, setActiveCallType] = useState<string>("Quote");
  
  if (!isOpen) return null;
  
  const handleSelect = (id: string): void => {
    setSelectedId(id);
    
    // Load carrier data immediately when selected
    if (carriers && carriers[id]) {
      const carrier = { ...carriers[id] };
      
      // Initialize scripts object if needed
      if (!carrier.scripts) {
        carrier.scripts = {};
        if (callTypes && Array.isArray(callTypes)) {
          callTypes.forEach(type => {
            carrier.scripts[type] = carrier.script || "";
          });
        }
      }
      
      setEditForm(carrier);
    }
  };
  
  const handleSave = () => { 
    setCarriers(prev => ({ ...prev, [editForm.id]: editForm })); 
    setSelectedId(null); 
    setEditForm(null);
  };
  
  const handleDelete = () => { 
    if(window.confirm("Delete?")) { 
      const n = { ...carriers }; 
      delete n[selectedId]; 
      setCarriers(n); 
      setSelectedId(null);
      setEditForm(null);
    }
  };
  
  const handleAdd = () => { 
    const id = Date.now().toString(); 
    const scripts = {};
    callTypes.forEach(type => { scripts[type] = ""; });
    const n = { id, name: "New Carrier", scripts }; 
    setCarriers(prev => ({ ...prev, [id]: n })); 
    setSelectedId(id); 
    setEditForm(n); 
  };
  
  const updateScriptForCallType = (callType: string, value: string): void => {
    setEditForm(prev => ({
      ...prev,
      scripts: {
        ...prev.scripts,
        [callType]: value
      }
    }));
  };

  return (
    <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'white', width:'700px', height:'650px', borderRadius:'16px', display:'flex', flexDirection:'column', boxShadow:'0 20px 50px rgba(0,0,0,0.2)'}}>
        <div style={{padding:'20px', borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between'}}><h2 style={{margin:0, fontSize:'18px'}}>Manage Carriers</h2><button onClick={onClose} style={{border:'none', background:'none'}}><X size={24}/></button></div>
        <div style={{flexGrow:1, display:'flex', overflow:'hidden'}}>
          <div style={{width:'200px', borderRight:`1px solid ${BORDER}`, padding:'10px', background:'#f9fafb', overflowY:'auto'}}><button onClick={handleAdd} className="btn-primary" style={{width:'100%', marginBottom:'10px', background: JERRY_PINK, border:'none'}}>+ Add New</button>{Object.values(carriers).map(c => <div key={c.id} onClick={() => handleSelect(c.id)} style={{padding:'10px', cursor:'pointer', fontWeight: selectedId === c.id ? 'bold' : 'normal', color: selectedId === c.id ? JERRY_PINK : SLATE}}>{c.name}</div>)}</div>
          <div style={{flexGrow:1, padding:'20px', overflowY:'auto', display:'flex', flexDirection:'column'}}>
            {selectedId && editForm ? (
                <div style={{display:'flex', flexDirection:'column', gap:'15px', height:'100%'}}>
                    <input className="node-input-text" style={{background:'white', border:`1px solid ${BORDER}`, width:'100%', fontSize:'14px', fontWeight:'bold'}} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Carrier Name"/>
                    
                    <div style={{fontSize:'12px', fontWeight:'bold', color:'#999', marginTop:'10px'}}>CALL TYPE SCRIPTS:</div>
                    
                    {/* Call Type Tabs */}
                    <div style={{display:'flex', gap:'4px', borderBottom:`2px solid ${BORDER}`, paddingBottom:'0', flexWrap:'wrap'}}>
                      {callTypes.map(type => (
                        <button 
                          key={type}
                          onClick={() => setActiveCallType(type)}
                          style={{
                            padding:'8px 12px',
                            border:'none',
                            background: activeCallType === type ? JERRY_PINK : 'transparent',
                            color: activeCallType === type ? 'white' : SLATE,
                            borderRadius:'6px 6px 0 0',
                            cursor:'pointer',
                            fontSize:'12px',
                            fontWeight: activeCallType === type ? 'bold' : 'normal',
                            transition:'all 0.2s'
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    
                    {/* Script Editor for Active Call Type */}
                    <div style={{flexGrow:1, display:'flex', flexDirection:'column'}}>
                      <div style={{fontSize:'11px', color:'#999', marginBottom:'8px'}}>Script for <strong>{activeCallType}</strong> calls:</div>
                      <div style={{flexGrow:1, minHeight:'250px'}}>
                        <ReactQuill 
                          key={`${selectedId}-${activeCallType}`}
                          theme="snow" 
                          value={editForm.scripts?.[activeCallType] || ""} 
                          onChange={(val) => updateScriptForCallType(activeCallType, val)} 
                          style={{height:'250px'}}
                        />
                      </div>
                    </div>
                    
                    <div style={{display:'flex', gap:'10px', marginTop:'70px'}}>
                        <button className="btn-primary" onClick={handleSave} style={{background:JERRY_PINK, border:'none'}}>Save Carrier</button>
                        <button className="btn-secondary" style={{color:'red', borderColor:'red'}} onClick={handleDelete}>Delete</button>
                    </div>
                </div>
            ) : <div style={{color:'#999'}}>Select a carrier to edit call type scripts</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// NODES

export default CarrierManager;
