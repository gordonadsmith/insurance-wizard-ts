import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import { X, ChevronRight, Trash2 } from 'lucide-react';
import { IssuesManagerProps, Issue } from '../types';
import { JERRY_PINK, SLATE, BORDER, ISSUE_CATEGORIES } from '../constants';

const IssuesManager: React.FC<IssuesManagerProps> = ({ isOpen, onClose, issues, setIssues }) => {
  const [localIssues, setLocalIssues] = useState<Issue[]>(issues);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  useEffect(() => { 
    if (isOpen) {
      setLocalIssues(issues);
      if (issues.length > 0) {
        const firstCategory = issues[0].category || 'Other';
        setExpandedCategories({ [firstCategory]: true });
      }
    }
  }, [issues, isOpen]);
  
  if (!isOpen) return null;
  
  const handleSave = () => { setIssues(localIssues); onClose(); };
  const add = () => {
    const newIssue = { id: Date.now(), title: 'New Issue', category: 'Other', keywords: '', solution: '' };
    setLocalIssues([...localIssues, newIssue]);
    setExpandedId(newIssue.id);
    setExpandedCategories(prev => ({ ...prev, 'Other': true }));
  };
  const remove = (id) => {
    if (window.confirm('Delete this issue?')) {
      setLocalIssues(localIssues.filter(i => i.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };
  const update = (id, f, v) => {
    setLocalIssues(prevIssues => prevIssues.map(i => i.id === id ? { ...i, [f]: v } : i));
  };

  const toggleCategory = (category: string): void => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const groupedIssues = localIssues.reduce<Record<string, Issue[]>>((acc, issue) => {
    const cat = issue.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(issue);
    return acc;
  }, {});

  return (
    <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'white', width:'800px', borderRadius:'16px', display:'flex', flexDirection:'column', maxHeight:'90vh', overflow:'hidden'}}>
        <div style={{padding:'20px', borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between'}}>
          <h2 style={{margin:0, fontSize:'18px', display:'flex', alignItems:'center', gap:'8px'}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Manage Common Issues
          </h2>
          <button onClick={onClose} style={{border:'none', background:'none', cursor:'pointer'}}><X size={24}/></button>
        </div>
        
        <div style={{padding:'20px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'10px'}}>
          {ISSUE_CATEGORIES.map(category => {
            const categoryIssues = groupedIssues[category] || [];
            if (categoryIssues.length === 0) return null;
            
            return (
              <div key={category} style={{border:`1px solid ${BORDER}`, borderRadius:'8px', background:'#f9fafb'}}>
                {/* Category Header */}
                <div 
                  onClick={() => toggleCategory(category)}
                  style={{
                    padding:'12px 15px',
                    display:'flex',
                    justifyContent:'space-between',
                    alignItems:'center',
                    cursor:'pointer',
                    background: expandedCategories[category] ? '#f3f4f6' : 'white',
                    borderRadius:'8px',
                    transition:'background 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseOut={e => e.currentTarget.style.background = expandedCategories[category] ? '#f3f4f6' : 'white'}
                >
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <ChevronRight 
                      size={18} 
                      style={{
                        transform: expandedCategories[category] ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                    />
                    <span style={{fontWeight:'bold', fontSize:'15px', color:SLATE}}>{category}</span>
                    <span style={{fontSize:'12px', color:'#999', background:'#e5e7eb', padding:'2px 8px', borderRadius:'10px'}}>
                      {categoryIssues.length}
                    </span>
                  </div>
                </div>

                {/* Issues in Category */}
                {expandedCategories[category] && (
                  <div style={{padding:'10px', display:'flex', flexDirection:'column', gap:'8px'}}>
                    {categoryIssues.map(issue => (
                      <div key={issue.id} style={{border:`1px solid ${BORDER}`, borderRadius:'6px', background:'white'}}>
                        {/* Issue Header - Collapsed View */}
                        <div 
                          onClick={() => setExpandedId(expandedId === issue.id ? null : issue.id)}
                          style={{
                            padding:'10px 12px',
                            display:'flex',
                            justifyContent:'space-between',
                            alignItems:'center',
                            cursor:'pointer',
                            background: expandedId === issue.id ? '#fef3c7' : 'white',
                            borderRadius:'6px'
                          }}
                        >
                          <div style={{display:'flex', alignItems:'center', gap:'8px', flexGrow:1}}>
                            <ChevronRight 
                              size={14} 
                              style={{
                                transform: expandedId === issue.id ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                                color:'#92400e'
                              }}
                            />
                            <span style={{fontSize:'14px', fontWeight:'500'}}>{issue.title}</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); remove(issue.id); }}
                            style={{color:'red', border:'none', background:'none', cursor:'pointer', padding:'4px'}}
                            title="Delete"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>

                        {/* Issue Details - Expanded View */}
                        {expandedId === issue.id && (
                          <div style={{padding:'15px', borderTop:`1px solid ${BORDER}`}}>
                            <div style={{display:'flex', gap:'10px', marginBottom:'12px'}}>
                              <div style={{flexGrow:1}}>
                                <label style={{fontSize:'11px', fontWeight:'bold', color:'#999', display:'block', marginBottom:'4px'}}>
                                  TITLE
                                </label>
                                <input 
                                  value={issue.title || ''} 
                                  onChange={e => update(issue.id, 'title', e.target.value)} 
                                  style={{width:'100%', padding:'8px', border:`1px solid ${BORDER}`, borderRadius:'4px', fontSize:'14px'}} 
                                  placeholder="Issue Title"
                                />
                              </div>
                              <div style={{width:'200px'}}>
                                <label style={{fontSize:'11px', fontWeight:'bold', color:'#999', display:'block', marginBottom:'4px'}}>
                                  CATEGORY
                                </label>
                                <select
                                  value={issue.category || 'Other'}
                                  onChange={e => update(issue.id, 'category', e.target.value)}
                                  style={{width:'100%', padding:'8px', border:`1px solid ${BORDER}`, borderRadius:'4px', fontSize:'14px'}}
                                >
                                  {ISSUE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            <div style={{marginBottom:'12px'}}>
                              <label style={{fontSize:'11px', fontWeight:'bold', color:'#999', display:'block', marginBottom:'4px'}}>
                                SEARCH KEYWORDS (space-separated)
                              </label>
                              <input 
                                value={issue.keywords || ''} 
                                onChange={e => update(issue.id, 'keywords', e.target.value)} 
                                style={{width:'100%', padding:'8px', border:`1px solid ${BORDER}`, borderRadius:'4px', fontSize:'13px'}} 
                                placeholder="e.g., payment decline card error"
                              />
                            </div>
                            
                            <div>
                              <label style={{fontSize:'11px', fontWeight:'bold', color:'#999', display:'block', marginBottom:'4px'}}>
                                SOLUTION (HTML supported)
                              </label>
                              <div style={{minHeight: '200px'}}>
                                <ReactQuill 
                                  theme="snow" 
                                  value={issue.solution || ''} 
                                  onChange={(content, delta, source, editor) => {
                                    if (source === 'user') {
                                      update(issue.id, 'solution', content);
                                    }
                                  }}
                                  style={{background:'white', minHeight:'150px'}}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          <button onClick={add} className="btn-secondary" style={{width:'100%', padding:'12px', marginTop:'10px'}}>
            + Add New Issue
          </button>
        </div>
        
        <div style={{padding:'20px', borderTop:`1px solid ${BORDER}`, display:'flex', justifyContent:'flex-end'}}>
          <button className="btn-primary" onClick={handleSave} style={{background: JERRY_PINK, border:'none'}}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default IssuesManager;
