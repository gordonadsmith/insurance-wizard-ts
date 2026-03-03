import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import { X, Trash2, Link as LinkIcon, FileText } from 'lucide-react';
import { ResourceManagerProps, Resource } from '../types';
import { JERRY_PINK, SLATE, BORDER } from '../constants';

const ResourceManager: React.FC<ResourceManagerProps> = ({ isOpen, onClose, resources, setResources }) => {
  const [localRes, setLocalRes] = useState<Resource[]>(resources);
  useEffect(() => { setLocalRes(resources); }, [resources]);
  if (!isOpen) return null;
  const handleSave = () => { setResources(localRes); onClose(); };
  const add = () => setLocalRes([...localRes, { id: Date.now(), title: 'New Resource', type: 'text', content: '' }]);
  const remove = (id) => setLocalRes(localRes.filter(r => r.id !== id));
  const update = (id, f, v) => setLocalRes(localRes.map(r => r.id === id ? { ...r, [f]: v } : r));

  return (
    <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'white', width:'600px', borderRadius:'16px', display:'flex', flexDirection:'column', maxHeight:'85vh', overflow:'hidden'}}>
        <div style={{padding:'20px', borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between'}}><h2 style={{margin:0, fontSize:'18px'}}>Manage Resources</h2><button onClick={onClose} style={{border:'none', background:'none'}}><X size={24}/></button></div>
        <div style={{padding:'20px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'10px'}}>
          {localRes.map(r => (
            <div key={r.id} style={{border:`1px solid ${BORDER}`, padding:'10px', borderRadius:'8px', background:'#f9fafb'}}>
              <div style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
                <input value={r.title} onChange={e => update(r.id, 'title', e.target.value)} style={{flexGrow:1, padding:'6px', border:`1px solid ${BORDER}`, borderRadius:'4px'}} placeholder="Title"/>
                <select value={r.type} onChange={e => update(r.id, 'type', e.target.value)} style={{padding:'6px', border:`1px solid ${BORDER}`, borderRadius:'4px'}}><option value="text">Text Popup</option><option value="link">Web Link</option></select>
                <button onClick={() => remove(r.id)} style={{color:'red', border:'none', background:'none'}}><Trash2 size={16}/></button>
              </div>
              <ReactQuill theme="snow" value={r.content} onChange={val => update(r.id, 'content', val)} />
            </div>
          ))}
          <button onClick={add} className="btn-secondary" style={{width:'100%'}}>+ Add Resource</button>
        </div>
        <div style={{padding:'20px', borderTop:`1px solid ${BORDER}`, display:'flex', justifyContent:'flex-end'}}><button className="btn-primary" onClick={handleSave} style={{background: JERRY_PINK, border:'none'}}>Save Changes</button></div>
      </div>
    </div>
  );
};


export default ResourceManager;
