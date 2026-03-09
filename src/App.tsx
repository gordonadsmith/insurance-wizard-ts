import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import ReactFlow, { 
  addEdge, Background, Controls, useNodesState, useEdgesState,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import 'react-quill-new/dist/quill.snow.css';   
import 'react-quill-new/dist/quill.bubble.css'; 
import { Plus, RefreshCw, ChevronRight, Trash2, Save, Building2, DollarSign, Settings, Copy, Layers, Lock, Unlock, Edit, FolderOpen, ClipboardCheck, FolderCog, FileText, GitBranch } from 'lucide-react';
import './App.css';

// @ts-ignore - image import
import jerryLogo from './jerry_logo.png'; 

import { CarrierMap, QuoteSettings, Resource, Issue, ToneKey } from './types';
import {
  API_URL, USE_LOCAL_STORAGE,
  JERRY_PINK, SLATE, BORDER, COMPLIANCE_ORANGE,
  DEFAULT_CARRIERS, DEFAULT_CALL_TYPES, DEFAULT_RESOURCES, DEFAULT_ISSUES, DEFAULT_QUOTE_SETTINGS,
  TONES,
} from './constants';
import { cleanHTML, extractVariables, fillTemplate } from './utils/helpers';
import { exportPlaybookAsText } from './utils/exportPlaybook';
import { useAuth } from './hooks/useAuth';
import { useWizardNavigation } from './hooks/useWizardNavigation';
import { nodeTypes } from './components/nodes';
import QuoteBuilderForm from './components/QuoteBuilderForm';
import SettingsManager from './components/SettingsManager';
import CallTypesManager from './components/CallTypesManager';
import CarrierManager from './components/CarrierManager';
import PlaybookManager from './components/PlaybookManager';
import ResourceSidebar from './components/ResourceSidebar';

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [carriers, setCarriers] = useState<CarrierMap>(DEFAULT_CARRIERS);
  const [quoteSettings, setQuoteSettings] = useState<QuoteSettings>(DEFAULT_QUOTE_SETTINGS);
  const [callTypes, setCallTypes] = useState<string[]>(DEFAULT_CALL_TYPES);
  const [selectedTone, setSelectedTone] = useState<ToneKey>('neutral');
  const [resources, setResources] = useState<Resource[]>(DEFAULT_RESOURCES);
  const [issues, setIssues] = useState<Issue[]>(DEFAULT_ISSUES);
  const [isCarrierModalOpen, setCarrierModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isPlaybookManagerOpen, setPlaybookManagerOpen] = useState(false);
  const [isCallTypesModalOpen, setCallTypesModalOpen] = useState(false);

  const auth = useAuth();
  const wizard = useWizardNavigation(nodes, edges, carriers, callTypes);

  // ── Node Management ──────────────────────────────────────────────────────

  const setAsStartNode = useCallback((id: string) => {
    setNodes((nds) => nds.map((node) => ({
      ...node, data: { ...node.data, isStart: node.id === id }
    })));
  }, [setNodes]);

  const updateNodeData = useCallback((id: string, newData: any) => {
    setNodes((nds) => nds.map((node) => 
      node.id === id ? { ...node, data: { ...newData, onChange: updateNodeData, setAsStartNode, duplicateNode: duplicateNodeFunc } } : node
    ));
  }, [setNodes, setAsStartNode]);

  const duplicateNodeFunc = (nodeId: string): void => {
    setNodes((nds) => {
      const src = nds.find(n => n.id === nodeId);
      if (!src) return nds;
      return [...nds, {
        ...src, id: (Math.random()*10000).toFixed(0),
        position: { x: src.position.x + 50, y: src.position.y + 50 },
        data: { ...src.data, label: src.data.label + ' (Copy)', isStart: false, onChange: updateNodeData, setAsStartNode, duplicateNode: duplicateNodeFunc },
        selected: false
      }];
    });
  };

  useEffect(() => {
    setNodes((nds) => nds.map((node) =>
      !node.data.duplicateNode
        ? { ...node, data: { ...node.data, duplicateNode: duplicateNodeFunc, onChange: updateNodeData, setAsStartNode } }
        : node
    ));
  }, [nodes.length]);

  // ── Flow Persistence ─────────────────────────────────────────────────────

  const [availableFlows, setAvailableFlows] = useState<string[]>([]);
  const [currentFlowName, setCurrentFlowName] = useState(() => {
    if (USE_LOCAL_STORAGE) return localStorage.getItem('insurance-wizard-last-flow') || "default_flow.json";
    return "default_flow.json";
  });

  const refreshFlows = (onLoaded?: (flows: string[]) => void): void => {
    if (USE_LOCAL_STORAGE) {
      let finalFlows = ["default_flow.json"];
      const saved = localStorage.getItem('insurance-wizard-flows');
      if (saved) { finalFlows = JSON.parse(saved); }
      else {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('insurance-wizard-') && k !== 'insurance-wizard-flows' && k !== 'insurance-wizard-last-flow').map(k => k.replace('insurance-wizard-', ''));
        if (keys.length > 0) finalFlows = keys;
        localStorage.setItem('insurance-wizard-flows', JSON.stringify(finalFlows));
      }
      setAvailableFlows(finalFlows);
      if (onLoaded) onLoaded(finalFlows);
    } else {
      fetch(`${API_URL}/flows`).then(r => r.json())
        .then(files => { const f = files.length === 0 ? ["default_flow.json"] : files; setAvailableFlows(f); if (onLoaded) onLoaded(f); })
        .catch(() => { setAvailableFlows(["default_flow.json"]); if (onLoaded) onLoaded(["default_flow.json"]); });
    }
  };

  const applyFlowData = (data: any) => {
    const nwh = data.nodes.map((n: any) => ({ ...n, data: { ...n.data, onChange: updateNodeData, setAsStartNode, callTypes: data.callTypes || DEFAULT_CALL_TYPES } }));
    setNodes(nwh); setEdges(data.edges || []);
    setCarriers(data.carriers || DEFAULT_CARRIERS); setResources(data.resources || DEFAULT_RESOURCES);
    setQuoteSettings(data.quoteSettings || DEFAULT_QUOTE_SETTINGS); setCallTypes(data.callTypes || DEFAULT_CALL_TYPES);
    setIssues(data.issues || DEFAULT_ISSUES); setSelectedTone(data.selectedTone || 'neutral');
    wizard.setHistory([]); wizard.setActiveChecklistState({});
    const start = nwh.find((n: any) => n.data.isStart) || nwh.find((n: any) => n.id === '1') || nwh[0];
    if (start) wizard.setCurrentNodeId(start.id);
  };

  const setEmptyFlow = (ct?: string[]) => {
    setNodes([{ id: '1', type: 'scriptNode', position: {x:250, y:150}, data: {label:'Start', text:'Welcome to the Insurance Wizard', onChange: updateNodeData, setAsStartNode, isStart: true, callTypes: ct || DEFAULT_CALL_TYPES}}]);
    setEdges([]); setCarriers(DEFAULT_CARRIERS); setResources(DEFAULT_RESOURCES);
    setQuoteSettings(DEFAULT_QUOTE_SETTINGS); setCallTypes(ct || DEFAULT_CALL_TYPES);
    wizard.setHistory([]); wizard.setCurrentNodeId('1');
  };

  const loadFlowData = (filename: string): void => {
    if (USE_LOCAL_STORAGE) {
      const raw = localStorage.getItem(`insurance-wizard-${filename}`);
      if (raw) {
        try { const d = JSON.parse(raw); if (!d.nodes?.length) { setEmptyFlow(d.callTypes); return; } applyFlowData(d); }
        catch { setEmptyFlow(); }
      } else { setEmptyFlow(); }
    } else {
      fetch(`${API_URL}/load?filename=${filename}`).then(r => r.json())
        .then(d => { if (!d.nodes?.length) { setEmptyFlow(d.callTypes); return; } applyFlowData(d); })
        .catch(() => setEmptyFlow());
    }
  };

  useEffect(() => {
    refreshFlows((fetched) => {
      let target = currentFlowName;
      if (!fetched.includes(target) && fetched.length > 0) { target = fetched[0]; setCurrentFlowName(target); }
      loadFlowData(target);
    });
  }, []);

  const saveToServer = () => {
    const clean = nodes.map(n => { const { onChange, setAsStartNode: _, duplicateNode: __, ...rest } = n.data; return { ...n, data: rest }; });
    const payload = { filename: currentFlowName, nodes: clean, edges, carriers, quoteSettings, resources, callTypes, issues, selectedTone: selectedTone || 'neutral' };
    if (USE_LOCAL_STORAGE) {
      localStorage.setItem(`insurance-wizard-${currentFlowName}`, JSON.stringify(payload));
      const flows = JSON.parse(localStorage.getItem('insurance-wizard-flows') || '[]');
      if (!flows.includes(currentFlowName)) { flows.push(currentFlowName); localStorage.setItem('insurance-wizard-flows', JSON.stringify(flows)); setAvailableFlows(flows); }
      alert('Playbook saved successfully!');
    } else {
      fetch(`${API_URL}/save`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) }).then(r => r.json()).then(d => alert(d.message));
    }
  };

  const handleSwitchFlow = (e: ChangeEvent<HTMLSelectElement>): void => {
    const v = e.target.value;
    if (v === "NEW") {
      const name = prompt("Enter name for new Playbook (e.g., 'Home Insurance'):");
      if (name) { const safe = name.toLowerCase().replace(/ /g, '_') + ".json"; setAvailableFlows(p => [...p, safe]); setCurrentFlowName(safe); setEmptyFlow(callTypes); }
    } else { setCurrentFlowName(v); loadFlowData(v); }
  };

  const duplicateCurrentPlaybook = () => {
    const base = currentFlowName.replace('.json', '');
    const copy = prompt(`Enter name for duplicate of "${base}":`, `${base} (Copy)`);
    if (!copy?.trim()) return;
    let safe = copy.trim(); if (!safe.endsWith('.json')) safe += '.json';
    saveToServer();
    if (USE_LOCAL_STORAGE) {
      const orig = localStorage.getItem(`insurance-wizard-${currentFlowName}`);
      if (orig) {
        localStorage.setItem(`insurance-wizard-${safe}`, orig);
        const flows = JSON.parse(localStorage.getItem('insurance-wizard-flows') || '[]');
        if (!flows.includes(safe)) { flows.push(safe); localStorage.setItem('insurance-wizard-flows', JSON.stringify(flows)); setAvailableFlows(flows); }
        setCurrentFlowName(safe); loadFlowData(safe); alert(`Duplicated!`);
      }
    } else {
      fetch(`${API_URL}/copy_flow`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ sourceFilename: currentFlowName, newFilename: safe }) })
        .then(r => r.json()).then(d => { if (d.message?.includes("success")) { refreshFlows(); setCurrentFlowName(safe); loadFlowData(safe); alert(`Duplicated!`); } });
    }
  };

  // ── Auto-Layout ──────────────────────────────────────────────────────────

  const autoLayoutNodes = () => {
    if (nodes.length === 0) return;
    const start = nodes.find(n => n.data?.isStart) || nodes.find(n => n.id === '1') || nodes[0];
    if (!start) return;
    const H = 300, V = 150, SX = 100, SY = 100;
    const levels = new Map<number, string[]>(); const visited = new Set<string>();
    const queue: { id: string; level: number }[] = [{ id: start.id, level: 0 }]; visited.add(start.id);
    while (queue.length > 0) { const { id, level } = queue.shift()!; if (!levels.has(level)) levels.set(level, []); levels.get(level)!.push(id); edges.filter(e => e.source === id).forEach(e => { if (!visited.has(e.target)) { visited.add(e.target); queue.push({ id: e.target, level: level + 1 }); } }); }
    const pos = new Map<string, { x: number; y: number }>();
    levels.forEach((ids, lv) => ids.forEach((id, i) => pos.set(id, { x: SX + lv * H, y: SY + i * V })));
    nodes.forEach(n => { if (!pos.has(n.id)) pos.set(n.id, { x: SX, y: SY + (levels.get(0)?.length || 0) * V + 200 }); });
    setNodes(nodes.map(n => { const p = pos.get(n.id); return p ? { ...n, position: p } : n; }));
    alert(`Layout complete! ${nodes.length} nodes in ${levels.size} levels.`);
  };

  // ── Editor Actions ───────────────────────────────────────────────────────

  const onConnect = useCallback((params: Connection) => { const label = window.prompt("Choice label?", "Next"); setEdges((eds) => addEdge({ ...params, label: label || "Next" }, eds)); }, [setEdges]);

  const makeNode = (type: string, data: any) => setNodes(nds => [...nds, { id: (Math.random()*10000).toFixed(0), type, position: {x:250, y:150}, data: { ...data, onChange: updateNodeData, setAsStartNode, duplicateNode: duplicateNodeFunc } }]);
  const addNewNode = () => makeNode('scriptNode', { label: 'Step', text: '' });
  const addCarrierNode = () => makeNode('carrierNode', { label: 'Select Carrier', callTypes, defaultCallType: callTypes[0] || "Quote" });
  const addQuoteNode = () => makeNode('quoteNode', { label: 'Present Quote', closingQuestion: 'How does that price sound?' });
  const addMadLibsNode = () => makeNode('madLibsNode', { label: 'Word Track', template: '' });
  const addChecklistNode = () => makeNode('checklistNode', { label: 'Compliance Check', items: 'Did you disclose the TCPA? (yes/no)\nDid you verify date of birth?' });

  const deleteSelected = useCallback(() => {
    const ids = nodes.filter(n => n.selected).map(n => n.id);
    setNodes(nds => nds.filter(n => !n.selected));
    setEdges(eds => eds.filter(e => !e.selected && !ids.includes(e.source) && !ids.includes(e.target)));
  }, [nodes, setNodes, setEdges]);

  const handleExport = () => exportPlaybookAsText({ flowName: currentFlowName, nodes, edges, carriers, callTypes });

  // ── Render ───────────────────────────────────────────────────────────────

  const cn = wizard.currentNode;

  return (
    <div className="app-container" style={{display:'flex', width:'100vw', height:'100vh', overflow:'hidden', fontFamily:'Inter, sans-serif'}}>
      {auth.showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '30px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <h2 style={{margin: '0 0 10px 0', fontSize: '24px', color: SLATE}}>🔒 Admin Authentication</h2>
            <p style={{margin: '0 0 20px 0', fontSize: '14px', color: '#666'}}>Enter the admin password to unlock the editor panel.</p>
            <input type="password" value={auth.passwordInput} onChange={(e) => auth.setPasswordInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && auth.handlePasswordSubmit()} placeholder="Enter password" autoFocus
              style={{ width: '100%', padding: '12px', fontSize: '16px', border: `2px solid ${auth.passwordError ? '#ef4444' : BORDER}`, borderRadius: '8px', marginBottom: '10px', boxSizing: 'border-box' }} />
            {auth.passwordError && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '15px', padding: '8px', background: '#fee2e2', borderRadius: '6px' }}>{auth.passwordError}</div>}
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button onClick={auth.dismissPasswordModal} style={{ padding: '10px 20px', border: `1px solid ${BORDER}`, background: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: SLATE }}>Cancel</button>
              <button onClick={auth.handlePasswordSubmit} style={{ padding: '10px 20px', border: 'none', background: JERRY_PINK, color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Unlock</button>
            </div>
          </div>
        </div>
      )}

      <CallTypesManager isOpen={isCallTypesModalOpen} onClose={() => setCallTypesModalOpen(false)} callTypes={callTypes} setCallTypes={setCallTypes} />
      <CarrierManager isOpen={isCarrierModalOpen} onClose={() => setCarrierModalOpen(false)} carriers={carriers} setCarriers={setCarriers} callTypes={callTypes} />
      <SettingsManager isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} settings={quoteSettings} setSettings={setQuoteSettings} />
      <PlaybookManager isOpen={isPlaybookManagerOpen} onClose={() => setPlaybookManagerOpen(false)} availableFlows={availableFlows} refreshList={refreshFlows} currentFlowName={currentFlowName} setCurrentFlowName={setCurrentFlowName} loadFlowData={loadFlowData} />
      <ResourceSidebar resources={resources} setResources={setResources} issues={issues} setIssues={setIssues} />

      <div className="wizard-pane" style={{ flex: auth.showAdmin ? '0 0 400px' : '1', maxWidth: '100%', minWidth: '350px', borderRight: auth.showAdmin ? `1px solid ${BORDER}` : 'none', display:'flex', flexDirection:'column', background: 'white' }}>
        <div className="wizard-header" style={{borderBottom:`1px solid ${BORDER}`, padding:'15px 20px', display:'flex', alignItems:'center'}}>
          <img src={jerryLogo} alt="Jerry" style={{height:'30px', marginRight:'10px'}} />
          <div style={{ fontWeight: '700', fontSize: '18px', color: SLATE }}>Insurance Wizard</div>
          <div style={{ flexGrow: 1 }}></div>
          <div style={{display:'flex', alignItems:'center', gap:'4px', marginRight:'12px'}}>
            <FolderOpen size={16} color={SLATE} />
            <select value={currentFlowName} onChange={handleSwitchFlow} style={{fontSize:'12px', padding:'4px', borderRadius:'4px', maxWidth:'120px', border:`1px solid ${BORDER}`}}>
              {availableFlows.map(f => <option key={f} value={f}>{f.replace('.json','')}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={auth.handleAdminUnlock} style={{marginRight:'10px', color: auth.showAdmin ? JERRY_PINK : '#999', borderColor: 'transparent'}}>
            {auth.showAdmin ? <Unlock size={16}/> : <Lock size={16}/>}
          </button>
          {auth.isAuthenticated && auth.showAdmin && <button className="btn btn-secondary" onClick={auth.handleAdminLock} title="Lock" style={{marginRight:'10px', color: '#ef4444', borderColor: 'transparent'}}><Lock size={16}/></button>}
          <button className="btn btn-secondary" onClick={wizard.resetWizard} style={{color: SLATE}}><RefreshCw size={16} /></button>
        </div>

        <div style={{ padding:'10px 20px', borderBottom: `2px solid ${TONES[selectedTone].borderColor}`, background: '#f9fafb', flexShrink: 0 }}>
          <label style={{fontSize:'11px', fontWeight:'bold', color:'#666', display:'block', marginBottom:'6px', textTransform:'uppercase'}}>Customer Tone:</label>
          <div style={{display:'flex', gap:'6px'}}>
            {Object.entries(TONES).map(([key, tone]) => (
              <button key={key} onClick={() => setSelectedTone(key as ToneKey)}
                style={{ flex: 1, padding: '8px 4px', border: selectedTone === key ? `2px solid ${tone.borderColor}` : `1px solid ${BORDER}`, borderRadius: '8px', background: selectedTone === key ? tone.color : 'white', color: selectedTone === key ? tone.textColor : '#666', fontSize: '10px', fontWeight: selectedTone === key ? '700' : '600', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}
                title={tone.description}>{tone.label}</button>
            ))}
          </div>
        </div>

        <div className="wizard-content" style={{background: 'white', overflowX: 'hidden'}} onScroll={wizard.handleScroll}>
          {wizard.history.map((step, idx) => (
            <div key={idx} className="history-item" onClick={() => wizard.handleHistoryClick(idx)}
              style={{ opacity: 0.6, marginBottom: '20px', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}>
              <div className="bubble" style={{ background: `${TONES[selectedTone].color}80`, borderLeft: `3px solid ${TONES[selectedTone].borderColor}` }}>
                <div className="bubble-label" style={{color: TONES[selectedTone].textColor}}>{step.data.label}</div>
                {step.type === 'scriptNode' && <div className="bubble-text" style={{color: TONES[selectedTone].textColor, width: '100%', minWidth: 0, wordWrap: 'break-word', overflowWrap: 'break-word', wordBreak: 'normal', whiteSpace: 'normal'}} dangerouslySetInnerHTML={{__html: cleanHTML(step.data.toneScripts?.[selectedTone] || step.data.text)}}></div>}
                {step.type === 'carrierNode' && step.carrierInfo && (
                  <div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px'}}>
                      <div style={{fontWeight:'bold', color:JERRY_PINK}}>{step.carrierInfo.name} Selected</div>
                      {step.carrierInfo.selectedCallType && <div style={{fontSize:'10px', background:'#8b5cf6', color:'white', padding:'3px 6px', borderRadius:'4px', fontWeight:'bold'}}>{step.carrierInfo.selectedCallType}</div>}
                    </div>
                    <div style={{fontSize:'12px'}} dangerouslySetInnerHTML={{__html: step.carrierInfo.displayScript || ''}}></div>
                  </div>
                )}
                {step.type === 'checklistNode' && <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>{wizard.renderChecklistItems(step.data.items, step.checklistAnswers, step.id, false)}</div>}
                {step.type === 'madLibsNode' && step.madLibsData && <div style={{background:'white', padding:'10px', borderRadius:'6px', border:'1px solid #10b981'}}><div style={{fontSize:'13px', color:SLATE, lineHeight:'1.6'}}>{step.madLibsData.filledText}</div></div>}
                {step.type === 'quoteNode' && <div style={{fontStyle:'italic', color:'#666'}}>Quote presented.</div>}
              </div>
            </div>
          ))}

          {cn && (
            <div className="bubble" style={{
              borderLeft: `4px solid ${cn.type === 'carrierNode' ? '#8b5cf6' : cn.type === 'quoteNode' ? JERRY_PINK : cn.type === 'checklistNode' ? COMPLIANCE_ORANGE : cn.type === 'madLibsNode' ? '#10b981' : TONES[selectedTone].borderColor}`,
              background: TONES[selectedTone].color, boxShadow: `0 2px 8px ${TONES[selectedTone].borderColor}20`
            }}>
              <div className="bubble-label" style={{color: TONES[selectedTone].textColor}}>{cn.data.label}</div>
              {cn.type === 'scriptNode' && <div className="bubble-text" style={{ color: TONES[selectedTone].textColor, width: '100%', minWidth: 0, wordWrap: 'break-word', overflowWrap: 'break-word', wordBreak: 'normal', whiteSpace: 'normal' }} dangerouslySetInnerHTML={{__html: cleanHTML(cn.data.toneScripts?.[selectedTone] || cn.data.text)}}></div>}
              {cn.type === 'carrierNode' && (() => {
                // 1. Dynamically compute the valid call type to guarantee the dropdown and state match
                const safeCallType = (wizard.selectedCallType && callTypes.includes(wizard.selectedCallType))
                  ? wizard.selectedCallType
                  : (cn.data.defaultCallType && callTypes.includes(cn.data.defaultCallType) ? cn.data.defaultCallType : callTypes[0] || "Quote");

                return (
                  <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                    <div>
                      <label style={{fontSize:'12px', fontWeight:'bold', color:SLATE, display:'block', marginBottom:'6px'}}>Call Type:</label>
                      <select 
                        style={{padding:'8px', borderRadius:'8px', border:`1px solid ${BORDER}`, fontSize:'14px', width:'100%'}} 
                        onChange={(e) => wizard.setSelectedCallType(e.target.value)} 
                        value={safeCallType}
                      >
                        {callTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:'12px', fontWeight:'bold', color:SLATE, display:'block', marginBottom:'6px'}}>Select Carrier:</label>
                      <select style={{padding:'8px', borderRadius:'8px', border:`1px solid ${BORDER}`, fontSize:'14px', width:'100%'}} onChange={(e) => wizard.setSelectedCarrierId(e.target.value)} value={wizard.selectedCarrierId || ""}>
                        <option value="" disabled>-- Choose Carrier --</option>
                        {Object.values(carriers).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {wizard.selectedCarrierId && carriers[wizard.selectedCarrierId] && (
                      <div style={{background:'white', padding:'12px', borderRadius:'8px', border:`2px solid #8b5cf6`}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                          <div style={{fontWeight:'bold', color:'#8b5cf6', fontSize:'15px'}}>{carriers[wizard.selectedCarrierId].name}</div>
                          <div style={{fontSize:'11px', background:'#8b5cf6', color:'white', padding:'4px 8px', borderRadius:'4px', fontWeight:'bold'}}>{safeCallType}</div>
                        </div>
                        {/* 2. CRITICAL FIX: Use ?? instead of || so empty strings don't trigger the ghost script */}
                        <div style={{fontSize:'13px', color:SLATE}} dangerouslySetInnerHTML={{__html: carriers[wizard.selectedCarrierId].scripts?.[safeCallType] ?? carriers[wizard.selectedCarrierId].script ?? "<p><i>No script for this call type yet.</i></p>"}}></div>
                      </div>
                    )}
                  </div>
                );
              })()}
              {cn.type === 'checklistNode' && <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>{wizard.renderChecklistItems(cn.data.items, wizard.activeChecklistState[cn.id], cn.id, true)}</div>}
              {cn.type === 'madLibsNode' && (
                <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                  <div style={{background:'white', padding:'12px', borderRadius:'8px', border:'2px solid #10b981'}}>
                    <div style={{fontSize:'11px', fontWeight:'bold', color:'#10b981', marginBottom:'8px', textTransform:'uppercase'}}>Preview:</div>
                    <div style={{fontSize:'14px', color:SLATE, lineHeight:'1.6'}}>{fillTemplate(cn.data.template, wizard.madLibsValues[cn.id] || {})}</div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    <div style={{fontSize:'11px', fontWeight:'bold', color:'#10b981', textTransform:'uppercase'}}>Fill in the blanks:</div>
                    {extractVariables(cn.data.template).map((variable, idx) => (
                      <div key={idx} style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                        <label style={{fontSize:'12px', fontWeight:'600', color:SLATE}}>{variable}:</label>
                        <input type="text" value={wizard.madLibsValues[cn.id]?.[variable] || ''} onChange={(e) => wizard.updateMadLibsValue(cn.id, variable, e.target.value)} placeholder={`Enter ${variable}...`}
                          style={{ padding:'10px', border:`1px solid ${BORDER}`, borderRadius:'6px', fontSize:'14px', width:'100%' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {cn.type === 'quoteNode' && <QuoteBuilderForm closingQuestion={cn.data.closingQuestion} settings={quoteSettings} carriers={carriers} />}
            </div>
          )}
        </div>

        <div className="wizard-actions" style={{ flexWrap: 'wrap' }}>
          {cn && wizard.options.map((opt, idx) => (
            <button key={idx} className="btn-option" disabled={cn.type === 'carrierNode' && !wizard.selectedCarrierId}
              style={{opacity: (cn.type === 'carrierNode' && !wizard.selectedCarrierId) ? 0.5 : 1, borderColor: BORDER, color: SLATE}}
              onClick={() => wizard.handleOptionClick(opt.targetId, String(opt.label))}>
              <span>{opt.label}</span><ChevronRight size={16} color={JERRY_PINK} />
            </button>
          ))}
          {cn && wizard.options.length === 0 && (
            <div style={{display:'flex', flexDirection:'column', gap:'10px', width:'100%'}}>
              {wizard.history.some(h => h.type === 'checklistNode') && (
                <button onClick={wizard.copyCompliance} className="btn-secondary" style={{borderColor: COMPLIANCE_ORANGE, color: '#9a3412', background:'#fff7ed', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                  <ClipboardCheck size={16}/> Copy Compliance Log
                </button>
              )}
              <button className="btn btn-primary" onClick={wizard.resetWizard} style={{background: JERRY_PINK, border:'none', width: '100%'}}>Complete Call</button>
            </div>
          )}
        </div>
      </div>

      {auth.showAdmin && (
        <div className="editor-pane" style={{width: '70%', minWidth: '350px', display:'flex', flexDirection:'column', background:'#f0f2f5', borderLeft:`1px solid ${BORDER}`}}>
          <div className="editor-toolbar" style={{display:'flex', gap:'8px', padding:'10px', background:'#fff', borderBottom:`1px solid ${BORDER}`}}>
            <button className="btn btn-primary" onClick={saveToServer} style={{background: JERRY_PINK, border:'none'}}><Save size={16}/></button>
            <div style={{width:'1px', height:'20px', background: BORDER, margin:'0 4px'}}></div>
            <div style={{display:'flex', alignItems:'center', gap:'4px', marginRight:'8px'}}>
              <FolderOpen size={16} color={SLATE} />
              <select value={currentFlowName} onChange={handleSwitchFlow} style={{fontSize:'12px', padding:'4px', borderRadius:'4px', maxWidth:'120px'}}>
                {availableFlows.map(f => <option key={f} value={f}>{f.replace('.json','')}</option>)}
                <option value="NEW">+ New Playbook...</option>
              </select>
              <button onClick={duplicateCurrentPlaybook} title="Duplicate" style={{border:'none', background:'none', cursor:'pointer', padding:'4px'}}><Copy size={16} color={SLATE}/></button>
              <button onClick={() => setPlaybookManagerOpen(true)} title="Manage Playbooks" style={{border:'none', background:'none', cursor:'pointer', padding:'4px'}}><FolderCog size={16} color={SLATE}/></button>
            </div>
            <div style={{width:'1px', height:'20px', background: BORDER, margin:'0 4px'}}></div>
            <button className="btn btn-secondary" onClick={() => setSettingsModalOpen(true)} title="Config"><Settings size={16}/></button>
            <button className="btn btn-secondary" onClick={() => setCarrierModalOpen(true)} title="Carriers"><Building2 size={16}/></button>
            <button className="btn btn-secondary" onClick={() => setCallTypesModalOpen(true)} title="Call Types" style={{color:'#8b5cf6'}}><Layers size={16}/></button>
            <button className="btn btn-secondary" onClick={handleExport} title="Export" style={{color:'#10b981'}}><FileText size={16}/></button>
            <button className="btn btn-secondary" onClick={autoLayoutNodes} title="Auto-Layout" style={{color:'#3b82f6'}}><GitBranch size={16}/></button>
            <div style={{width:'1px', height:'20px', background: BORDER, margin:'0 4px'}}></div>
            <button className="btn btn-secondary" onClick={addNewNode} title="Add Script"><Plus size={16}/></button>
            <button className="btn btn-secondary" onClick={addMadLibsNode} style={{color:'#10b981'}} title="Add Word Track"><Edit size={16}/></button>
            <button className="btn btn-secondary" onClick={addChecklistNode} style={{color: COMPLIANCE_ORANGE}} title="Add Checklist"><ClipboardCheck size={16}/></button>
            <button className="btn btn-secondary" onClick={addCarrierNode} style={{color:'#8b5cf6'}} title="Add Carrier"><Building2 size={16}/></button>
            <button className="btn btn-secondary" onClick={addQuoteNode} style={{color: JERRY_PINK}} title="Add Quote"><DollarSign size={16}/></button>
            <div style={{flexGrow:1}}></div>
            <button className="btn btn-secondary" onClick={deleteSelected} style={{color:'red'}}><Trash2 size={16}/></button>
          </div>
          <div style={{flexGrow:1, position:'relative'}}>
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView>
              <Background color="#ccc" gap={20} />
              <Controls />
            </ReactFlow>
          </div>
        </div>
      )}
    </div>
  );
}