import React, { useState } from 'react';
import { BookOpen, Link as LinkIcon, FileText, X, ChevronRight, Edit } from 'lucide-react';
import { ResourceSidebarProps, Resource, Issue } from '../types';
import { JERRY_PINK, JERRY_BG, SLATE, BORDER, COMPLIANCE_ORANGE } from '../constants';
import { cleanHTML } from '../utils/helpers';
import ResourceManager from './ResourceManager';
import IssuesManager from './IssuesManager';

const ResourceSidebar: React.FC<ResourceSidebarProps> = ({ resources, setResources, issues, setIssues }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [managerOpen, setManagerOpen] = useState<boolean>(false);
  const [issuesManagerOpen, setIssuesManagerOpen] = useState<boolean>(false);
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [issuesExpanded, setIssuesExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [expandedIssueCategories, setExpandedIssueCategories] = useState<Record<string, boolean>>({});

  const filteredIssues = issues.filter(issue => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      issue.title.toLowerCase().includes(query) ||
      issue.keywords.toLowerCase().includes(query) ||
      (issue.category && issue.category.toLowerCase().includes(query))
    );
  });

  const groupedIssues = filteredIssues.reduce<Record<string, Issue[]>>((acc, issue) => {
    const cat = issue.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(issue);
    return acc;
  }, {});

  const toggleIssueCategory = (category: string): void => {
    setExpandedIssueCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <>
      <div onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}
        style={{ width: expanded ? '240px' : '50px', height: '100%', backgroundColor: 'white', borderRight: `1px solid ${BORDER}`, transition: 'width 0.3s ease', display: 'flex', flexDirection: 'column', zIndex: 100, flexShrink: 0, boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>
        <div style={{height: '60px', display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center', padding: expanded ? '0 20px' : '0', color: JERRY_PINK, borderBottom: `1px solid ${BORDER}`}}>
          <BookOpen size={24}/>{expanded && <span style={{marginLeft: '12px', fontWeight: 'bold', whiteSpace: 'nowrap'}}>Quick Links</span>}
        </div>
        <div style={{flexGrow: 1, padding: '10px 0', overflowY: 'auto'}}>
          {resources.map(r => (
            <div key={r.id} onClick={() => r.type === 'link' ? window.open(r.content, '_blank') : setActiveResource(r)}
              style={{display: 'flex', alignItems: 'center', padding: '12px 0', paddingLeft: expanded ? '20px' : '0', justifyContent: expanded ? 'flex-start' : 'center', color: SLATE, cursor: 'pointer'}}
              onMouseOver={(e) => {e.currentTarget.style.color = JERRY_PINK; e.currentTarget.style.background = JERRY_BG}}
              onMouseOut={(e) => {e.currentTarget.style.color = SLATE; e.currentTarget.style.background = 'transparent'}}
            >
              {r.type === 'link' ? <LinkIcon size={20}/> : <FileText size={20}/>}
              {expanded && <span style={{marginLeft: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize:'14px'}}>{r.title}</span>}
            </div>
          ))}
        </div>

        {/* Common Issues Section */}
        <div style={{borderTop: `2px solid ${BORDER}`, background: '#fef3c7'}}>
          <div 
            onClick={() => setIssuesExpanded(!issuesExpanded)}
            style={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: expanded ? 'space-between' : 'center',
              padding: expanded ? '12px 20px' : '12px 0',
              cursor: 'pointer',
              color: '#92400e'
            }}
          >
            {expanded ? (
              <>
                <div style={{display:'flex', alignItems:'center', gap:'8px', fontWeight:'bold', fontSize:'13px'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Common Issues
                </div>
                <ChevronRight size={16} style={{transform: issuesExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s'}}/>
              </>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
          </div>

          {issuesExpanded && expanded && (
            <div style={{padding: '0 15px 15px', maxHeight: '300px', overflowY: 'auto'}}>
              <input 
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: `1px solid #fbbf24`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '8px'
                }}
              />
              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                {Object.keys(groupedIssues).length > 0 ? (
                  Object.entries(groupedIssues).map(([category, categoryIssues]) => (
                    <div key={category} style={{marginBottom: '4px'}}>
                      {/* Category Header */}
                      <div 
                        onClick={() => toggleIssueCategory(category)}
                        style={{
                          padding: '6px 8px',
                          background: '#fbbf24',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#78350f',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>{category} ({categoryIssues.length})</span>
                        <ChevronRight 
                          size={12} 
                          style={{
                            transform: expandedIssueCategories[category] ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        />
                      </div>
                      
                      {/* Issues in Category */}
                      {expandedIssueCategories[category] && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', marginLeft: '8px'}}>
                          {categoryIssues.map(issue => (
                            <div 
                              key={issue.id}
                              onClick={() => setActiveIssue(issue)}
                              style={{
                                padding: '6px 8px',
                                background: 'white',
                                borderRadius: '4px',
                                border: '1px solid #fbbf24',
                                cursor: 'pointer',
                                fontSize: '11px',
                                color: '#92400e',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#fffbeb'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                            >
                              {issue.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{fontSize: '11px', color: '#92400e', fontStyle: 'italic', textAlign: 'center', padding: '10px'}}>
                    No issues found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{padding: '10px', borderTop: `1px solid ${BORDER}`}}>
          <button onClick={() => setManagerOpen(true)} style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: SLATE, padding: '8px', cursor: 'pointer', marginBottom: '4px'}} onMouseOver={e=>e.currentTarget.style.color=JERRY_PINK} onMouseOut={e=>e.currentTarget.style.color=SLATE}>
            <Edit size={16}/>{expanded && <span style={{marginLeft: '10px', fontSize:'13px'}}>Edit Resources</span>}
          </button>
          <button onClick={() => setIssuesManagerOpen(true)} style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: '#92400e', padding: '8px', cursor: 'pointer'}} onMouseOver={e=>e.currentTarget.style.color='#78350f'} onMouseOut={e=>e.currentTarget.style.color='#92400e'}>
            <Edit size={16}/>{expanded && <span style={{marginLeft: '10px', fontSize:'13px'}}>Edit Issues</span>}
          </button>
        </div>
      </div>
      <ResourceManager isOpen={managerOpen} onClose={() => setManagerOpen(false)} resources={resources} setResources={setResources} />
      <IssuesManager isOpen={issuesManagerOpen} onClose={() => setIssuesManagerOpen(false)} issues={issues} setIssues={setIssues} />
      
      {/* Resource Popup */}
      {activeResource && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)'}} onClick={() => setActiveResource(null)}></div>
          <div style={{position: 'relative', width: '500px', maxHeight: '70vh', background: 'white', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 2001}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: `1px solid ${BORDER}`, paddingBottom: '10px'}}>
              <h3 style={{margin: 0, fontSize: '18px', color: JERRY_PINK}}>{activeResource.title}</h3><button onClick={() => setActiveResource(null)} style={{background: 'none', border: 'none', cursor: 'pointer'}}><X size={20}/></button>
            </div>
            <div style={{flexGrow: 1, overflowY: 'auto', fontSize: '14px', lineHeight: '1.6'}} dangerouslySetInnerHTML={{__html: activeResource.content}}></div>
          </div>
        </div>
      )}

      {/* Issue Popup */}
      {activeIssue && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)'}} onClick={() => setActiveIssue(null)}></div>
          <div style={{position: 'relative', width: '500px', maxHeight: '70vh', background: 'white', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid #fbbf24', zIndex: 2001}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: `2px solid #fbbf24`, paddingBottom: '10px'}}>
              <h3 style={{margin: 0, fontSize: '18px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {activeIssue.title}
              </h3>
              <button onClick={() => setActiveIssue(null)} style={{background: 'none', border: 'none', cursor: 'pointer'}}><X size={20}/></button>
            </div>
            <div style={{flexGrow: 1, overflowY: 'auto', fontSize: '14px', lineHeight: '1.6'}} dangerouslySetInnerHTML={{__html: activeIssue.solution}}></div>
          </div>
        </div>
      )}
    </>
  );
};

// PlaybookManager

export default ResourceSidebar;
