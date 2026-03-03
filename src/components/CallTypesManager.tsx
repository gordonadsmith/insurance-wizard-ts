import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Layers, Settings } from 'lucide-react';
import { CallTypesManagerProps } from '../types';
import { JERRY_PINK, SLATE, BORDER } from '../constants';

const CallTypesManager: React.FC<CallTypesManagerProps> = ({ isOpen, onClose, callTypes, setCallTypes }) => {
  const [localCallTypes, setLocalCallTypes] = useState<string[]>(callTypes);
  const [newTypeName, setNewTypeName] = useState<string>("");
  
  useEffect(() => { setLocalCallTypes(callTypes); }, [callTypes]);
  
  if (!isOpen) return null;

  const handleAdd = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) {
      alert("Please enter a call type name");
      return;
    }
    if (localCallTypes.includes(trimmed)) {
      alert("This call type already exists");
      return;
    }
    setLocalCallTypes([...localCallTypes, trimmed]);
    setNewTypeName("");
  };

  const handleRemove = (type: string): void => {
    if (localCallTypes.length <= 1) {
      alert("You must have at least one call type");
      return;
    }
    if (window.confirm(`Remove "${type}"? This will delete all carrier scripts for this call type.`)) {
      setLocalCallTypes(localCallTypes.filter(t => t !== type));
    }
  };

  const handleSave = () => {
    setCallTypes(localCallTypes);
    alert("Call types saved! Note: Carriers will need scripts updated for new types.");
    onClose();
  };

  const moveUp = (index: number): void => {
    if (index === 0) return;
    const newList = [...localCallTypes];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setLocalCallTypes(newList);
  };

  const moveDown = (index: number): void => {
    if (index === localCallTypes.length - 1) return;
    const newList = [...localCallTypes];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setLocalCallTypes(newList);
  };

  return (
    <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'white', width:'500px', borderRadius:'16px', padding:'20px', boxShadow:'0 20px 50px rgba(0,0,0,0.2)', maxHeight:'80vh', display:'flex', flexDirection:'column'}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', borderBottom:`1px solid ${BORDER}`, paddingBottom:'10px'}}>
          <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'8px'}}><Settings size={20} color={SLATE}/> Manage Call Types</h3>
          <button onClick={onClose} style={{border:'none', background:'none', cursor:'pointer'}}><X size={20}/></button>
        </div>

        <div style={{fontSize:'13px', color:'#666', marginBottom:'15px', padding:'10px', background:'#f9fafb', borderRadius:'6px'}}>
          Call types determine what scripts show for each carrier. Add types relevant to your business (e.g., "Renewal", "Cancellation", "Policy Change").
        </div>

        <div style={{marginBottom:'15px'}}>
          <label style={{fontSize:'12px', fontWeight:'bold', color:'#999', display:'block', marginBottom:'8px'}}>ADD NEW CALL TYPE</label>
          <div style={{display:'flex', gap:'8px'}}>
            <input 
              value={newTypeName} 
              onChange={e => setNewTypeName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAdd()}
              placeholder="e.g., Renewal, Cancellation..."
              style={{flexGrow:1, padding:'8px', border:`1px solid ${BORDER}`, borderRadius:'6px'}}
            />
            <button onClick={handleAdd} className="btn-primary" style={{background:JERRY_PINK, border:'none'}}>+ Add</button>
          </div>
        </div>

        <div style={{flexGrow:1, overflowY:'auto', marginBottom:'15px'}}>
          <label style={{fontSize:'12px', fontWeight:'bold', color:'#999', display:'block', marginBottom:'8px'}}>CURRENT CALL TYPES</label>
          <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
            {localCallTypes.map((type, index) => (
              <div key={type} style={{display:'flex', alignItems:'center', gap:'8px', padding:'10px', background:'#f9fafb', borderRadius:'6px', border:`1px solid ${BORDER}`}}>
                <div style={{flexGrow:1, fontWeight:'500'}}>{type}</div>
                <button onClick={() => moveUp(index)} disabled={index === 0} title="Move Up" style={{border:'none', background:'white', cursor:index === 0 ? 'not-allowed' : 'pointer', padding:'4px', borderRadius:'4px', opacity: index === 0 ? 0.3 : 1}}>↑</button>
                <button onClick={() => moveDown(index)} disabled={index === localCallTypes.length - 1} title="Move Down" style={{border:'none', background:'white', cursor:index === localCallTypes.length - 1 ? 'not-allowed' : 'pointer', padding:'4px', borderRadius:'4px', opacity: index === localCallTypes.length - 1 ? 0.3 : 1}}>↓</button>
                <button onClick={() => handleRemove(type)} title="Delete" style={{border:'none', background:'white', cursor:'pointer', padding:'4px', borderRadius:'4px', color:'red'}}><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', paddingTop:'15px', borderTop:`1px solid ${BORDER}`}}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary" style={{background:JERRY_PINK, border:'none'}}>Save Call Types</button>
        </div>
      </div>
    </div>
  );
};

// CarrierManager

export default CallTypesManager;
