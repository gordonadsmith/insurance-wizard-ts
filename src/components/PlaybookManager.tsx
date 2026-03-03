import React, { useState, useEffect } from 'react';
import { X, Trash2, Download, Copy, Pencil, Upload, FolderCog } from 'lucide-react';
import { PlaybookManagerProps } from '../types';
import { API_URL, USE_LOCAL_STORAGE, JERRY_PINK, SLATE, BORDER } from '../constants';

const PlaybookManager: React.FC<PlaybookManagerProps> = ({ isOpen, onClose, availableFlows, refreshList, currentFlowName, setCurrentFlowName, loadFlowData }) => {
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [newName, setNewName] = useState<string>("");

    if (!isOpen) return null;

    const handleRename = (oldName: string): void => {
        let safeNewName = newName.trim();
        if(!safeNewName) return;
        
        if (!safeNewName.endsWith('.json')) {
            safeNewName = safeNewName + '.json';
        }
        
        if (USE_LOCAL_STORAGE) {
          const oldData = localStorage.getItem(`insurance-wizard-${oldName}`);
          
          if (oldData) {
              localStorage.setItem(`insurance-wizard-${safeNewName}`, oldData);
              localStorage.removeItem(`insurance-wizard-${oldName}`);
          }
          
          const flows = JSON.parse(localStorage.getItem('insurance-wizard-flows') || '[]');
          const updatedFlows = flows.map(f => f === oldName ? safeNewName : f);
          localStorage.setItem('insurance-wizard-flows', JSON.stringify(updatedFlows));
          
          refreshList();
          if(currentFlowName === oldName) {
              setCurrentFlowName(safeNewName);
          }
          setRenamingId(null);
          setNewName("");
        } else {
          fetch(`${API_URL}/rename_flow`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ oldFilename: oldName, newFilename: safeNewName })
          })
          .then(res => {
              if (!res.ok) {
                  throw new Error(`Server error: ${res.status}`);
              }
              return res.json();
          })
          .then(data => {
              if(data.message && data.message.includes("success")) {
                  refreshList();
                  if(currentFlowName === oldName) {
                      setCurrentFlowName(data.newFilename);
                  }
                  setRenamingId(null);
                  setNewName("");
              } else {
                  alert(data.message || 'Error renaming playbook');
              }
          })
          .catch(err => {
              console.error('Rename error:', err);
              alert('Error renaming playbook: ' + err.message);
          });
        }
    };

    const handleDelete = (filename: string): void => {
        if(!window.confirm(`Are you sure you want to delete "${filename}"? This cannot be undone.`)) return;
        
        if (USE_LOCAL_STORAGE) {
          localStorage.removeItem(`insurance-wizard-${filename}`);
          
          const flows = JSON.parse(localStorage.getItem('insurance-wizard-flows') || '[]');
          const updatedFlows = flows.filter(f => f !== filename);
          localStorage.setItem('insurance-wizard-flows', JSON.stringify(updatedFlows));
          
          refreshList();
          if(currentFlowName === filename) {
              window.location.reload(); 
          }
        } else {
          fetch(`${API_URL}/delete_flow`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ filename })
          }).then(res => res.json()).then(data => {
              if(data.message.includes("success")) {
                  refreshList();
                  if(currentFlowName === filename) {
                      window.location.reload(); 
                  }
              } else {
                  alert(data.message);
              }
          });
        }
    };

    const handleCopy = (filename: string): void => {
        const baseName = filename.replace('.json', '');
        const copyName = prompt(`Enter name for the copy of "${baseName}":`, `${baseName} (Copy)`);
        
        if (!copyName || copyName.trim() === '') return;
        
        let safeCopyName = copyName.trim();
        if (!safeCopyName.endsWith('.json')) {
            safeCopyName = safeCopyName + '.json';
        }
        
        if (USE_LOCAL_STORAGE) {
            const originalData = localStorage.getItem(`insurance-wizard-${filename}`);
            
            if (originalData) {
                localStorage.setItem(`insurance-wizard-${safeCopyName}`, originalData);
                
                const flows = JSON.parse(localStorage.getItem('insurance-wizard-flows') || '[]');
                if (!flows.includes(safeCopyName)) {
                    flows.push(safeCopyName);
                    localStorage.setItem('insurance-wizard-flows', JSON.stringify(flows));
                }
                
                refreshList();
                setCurrentFlowName(safeCopyName);
                loadFlowData(safeCopyName);
                onClose();
            } else {
                alert('Could not find the original playbook to copy.');
            }
        } else {
            fetch(`${API_URL}/copy_flow`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ sourceFilename: filename, newFilename: safeCopyName })
            }).then(res => res.json()).then(data => {
                if(data.message && data.message.includes("success")) {
                    refreshList();
                    setCurrentFlowName(safeCopyName);
                    loadFlowData(safeCopyName);
                    onClose();
                } else {
                    alert(data.message || 'Error copying playbook');
                }
            }).catch(err => {
                alert('Error copying playbook');
            });
        }
    };

    const handleExport = (filename: string): void => {
        if (USE_LOCAL_STORAGE) {
            const data = localStorage.getItem(`insurance-wizard-${filename}`);
            if (!data) {
                alert('Playbook not found');
                return;
            }
            
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            fetch(`${API_URL}/load?filename=${filename}`)
                .then(res => res.json())
                .then(data => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                })
                .catch(err => alert('Error exporting playbook'));
        }
    };

    const handleImport = (): void => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    
                    if (!data.nodes || !data.edges) {
                        alert('Invalid playbook file - missing required data');
                        return;
                    }
                    
                    let importName = file.name;
                    if (!importName.endsWith('.json')) {
                        importName = importName + '.json';
                    }
                    
                    if (availableFlows.includes(importName)) {
                        const overwrite = window.confirm(`Playbook "${importName}" already exists. Overwrite?`);
                        if (!overwrite) {
                            const newName = prompt('Enter a new name for this playbook:', importName.replace('.json', '') + ' (Imported)');
                            if (!newName) return;
                            importName = newName.endsWith('.json') ? newName : newName + '.json';
                        }
                    }
                    
                    if (USE_LOCAL_STORAGE) {
                        localStorage.setItem(`insurance-wizard-${importName}`, JSON.stringify(data));
                        
                        const flows = JSON.parse(localStorage.getItem('insurance-wizard-flows') || '[]');
                        if (!flows.includes(importName)) {
                            flows.push(importName);
                            localStorage.setItem('insurance-wizard-flows', JSON.stringify(flows));
                        }
                        
                        refreshList();
                        alert(`Successfully imported "${importName}"`);
                        
                        if (window.confirm('Switch to imported playbook now?')) {
                            setCurrentFlowName(importName);
                            loadFlowData(importName);
                            onClose();
                        }
                    } else {
                        fetch(`${API_URL}/save`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ ...data, filename: importName })
                        }).then(res => res.json()).then(result => {
                            refreshList();
                            alert(`Successfully imported "${importName}"`);
                            if (window.confirm('Switch to imported playbook now?')) {
                                setCurrentFlowName(importName);
                                loadFlowData(importName);
                                onClose();
                            }
                        }).catch(err => alert('Error importing playbook'));
                    }
                } catch (err) {
                    alert('Error reading file - invalid JSON format');
                    console.error(err);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1300, display:'flex', alignItems:'center', justifyContent:'center'}}>
            <div style={{background:'white', width:'500px', borderRadius:'16px', padding:'20px', boxShadow:'0 20px 50px rgba(0,0,0,0.2)'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', borderBottom:`1px solid ${BORDER}`, paddingBottom:'10px'}}>
                    <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'8px'}}><FolderCog size={20} color={SLATE}/> Manage Playbooks</h3>
                    <button onClick={onClose} style={{border:'none', background:'none', cursor:'pointer'}}><X size={20}/></button>
                </div>
                
                {/* Import Button */}
                <div style={{marginBottom:'15px'}}>
                    <button 
                        onClick={handleImport} 
                        className="btn-primary"
                        style={{
                            width:'100%', 
                            background:'#10b981', 
                            border:'none',
                            padding:'10px',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            gap:'8px'
                        }}
                    >
                        <Upload size={16}/>
                        Import Playbook from File
                    </button>
                </div>
                
                <div style={{display:'flex', flexDirection:'column', gap:'10px', maxHeight:'400px', overflowY:'auto'}}>
                    {availableFlows.map(flow => (
                        <div key={flow} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px', background:'#f9fafb', borderRadius:'8px', border:`1px solid ${BORDER}`}}>
                            {renamingId === flow ? (
                                <div style={{display:'flex', gap:'8px', flexGrow:1}}>
                                    <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} style={{flexGrow:1, padding:'4px', borderRadius:'4px', border:`1px solid ${JERRY_PINK}`}} placeholder="New Name"/>
                                    <button onClick={() => handleRename(flow)} style={{background:JERRY_PINK, color:'white', border:'none', borderRadius:'4px', padding:'4px 8px', fontSize:'12px', cursor:'pointer'}}>Save</button>
                                    <button onClick={() => setRenamingId(null)} style={{background:'#ccc', color:'white', border:'none', borderRadius:'4px', padding:'4px 8px', fontSize:'12px', cursor:'pointer'}}>Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <div style={{fontWeight: currentFlowName === flow ? 'bold' : 'normal', color: currentFlowName === flow ? JERRY_PINK : SLATE}}>{flow.replace('.json','')}</div>
                                    <div style={{display:'flex', gap:'8px'}}>
                                        <button onClick={() => handleExport(flow)} title="Export/Download" style={{background:'white', cursor:'pointer', padding:'4px', borderRadius:'4px', border:`1px solid ${BORDER}`}}><Download size={14} color="#10b981"/></button>
                                        <button onClick={() => handleCopy(flow)} title="Copy/Duplicate" style={{background:'white', cursor:'pointer', padding:'4px', borderRadius:'4px', border:`1px solid ${BORDER}`}}><Copy size={14} color={SLATE}/></button>
                                        <button onClick={() => { setRenamingId(flow); setNewName(flow.replace('.json','')); }} title="Rename" style={{background:'white', cursor:'pointer', padding:'4px', borderRadius:'4px', border:`1px solid ${BORDER}`}}><Pencil size={14} color={SLATE}/></button>
                                        <button onClick={() => handleDelete(flow)} title="Delete" style={{background:'white', cursor:'pointer', padding:'4px', borderRadius:'4px', border:`1px solid ${BORDER}`}}><Trash2 size={14} color="red"/></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// CallTypesManager

export default PlaybookManager;
