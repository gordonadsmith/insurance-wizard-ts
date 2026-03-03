import React, { useState, useCallback, useEffect, useRef, ChangeEvent } from 'react';
import ReactFlow, { 
  addEdge, Background, Controls, useNodesState, useEdgesState,
  Node, Edge, Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import 'react-quill-new/dist/quill.snow.css';   
import 'react-quill-new/dist/quill.bubble.css'; 
import { Plus, RefreshCw, ChevronRight, Trash2, Save, Building2, X, DollarSign, Settings, Copy, Layers, Lock, Unlock, Flag, Edit, FolderOpen, ClipboardCheck, FolderCog, FileText, GitBranch } from 'lucide-react';
import './App.css';

// @ts-ignore - image import
import jerryLogo from './jerry_logo.png'; 

// Types
import { CarrierMap, QuoteSettings, Resource, Issue, HistoryEntry, ToneKey } from './types';

// Constants
import {
  API_URL, USE_LOCAL_STORAGE, DISABLE_AUTH,
  JERRY_PINK, SLATE, BORDER, COMPLIANCE_ORANGE,
  DEFAULT_CARRIERS, DEFAULT_CALL_TYPES, DEFAULT_RESOURCES, DEFAULT_ISSUES, DEFAULT_QUOTE_SETTINGS,
  TONES,
} from './constants';

// Utils
import { cleanHTML, extractVariables, fillTemplate } from './utils/helpers';

// Hooks
import { useAutoScroll } from './hooks/useAutoScroll';

// Components
import { nodeTypes } from './components/nodes';
import QuoteBuilderForm from './components/QuoteBuilderForm';
import SettingsManager from './components/SettingsManager';
import CallTypesManager from './components/CallTypesManager';
import CarrierManager from './components/CarrierManager';
import PlaybookManager from './components/PlaybookManager';
import ResourceSidebar from './components/ResourceSidebar';

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  // --- React Flow State ---
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // --- Data State ---
  const [carriers, setCarriers] = useState<CarrierMap>(DEFAULT_CARRIERS);
  const [quoteSettings, setQuoteSettings] = useState<QuoteSettings>(DEFAULT_QUOTE_SETTINGS);
  const [callTypes, setCallTypes] = useState<string[]>(DEFAULT_CALL_TYPES);
  const [selectedTone, setSelectedTone] = useState<ToneKey>('neutral');
  const [resources, setResources] = useState<Resource[]>(DEFAULT_RESOURCES);
  const [issues, setIssues] = useState<Issue[]>(DEFAULT_ISSUES);

  // --- UI State ---
  const [isCarrierModalOpen, setCarrierModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [isPlaybookManagerOpen, setPlaybookManagerOpen] = useState<boolean>(false);
  const [isCallTypesModalOpen, setCallTypesModalOpen] = useState<boolean>(false);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // --- Flow Management State ---
  const [availableFlows, setAvailableFlows] = useState<string[]>([]);
  const [currentFlowName, setCurrentFlowName] = useState(() => {
    if (USE_LOCAL_STORAGE) {
      const lastFlow = localStorage.getItem('insurance-wizard-last-flow');
      return lastFlow || "default_flow.json";
    }
    return "default_flow.json";
  });

  // --- Wizard State ---
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);
  const [selectedCallType, setSelectedCallType] = useState("Quote");
  const [madLibsValues, setMadLibsValues] = useState<Record<string, Record<string, string>>>({});
  const [activeChecklistState, setActiveChecklistState] = useState<Record<string, Record<string, string | null>>>({});

  // --- Scroll Management ---
  const { handleScroll, scrollToElement, scrollToTop, resetScrollState, triggerAutoScroll } = useAutoScroll();

  // --- Auto-set call type on carrier node navigation ---
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (currentNode && currentNode.type === 'carrierNode') {
      const targetType = currentNode.data.defaultCallType || callTypes[0] || "Quote";
      setSelectedCallType(targetType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodeId]);

  // ============================================================================
  // NODE MANAGEMENT
  // ============================================================================

  const setAsStartNode = useCallback((id: string) => {
    setNodes((nds) => nds.map((node) => ({
      ...node,
      data: { ...node.data, isStart: node.id === id }
    })));
  }, [setNodes]);

  const updateNodeData = useCallback((id: string, newData: any) => {
    setNodes((nds) => nds.map((node) => 
      node.id === id ? { ...node, data: { ...newData, onChange: updateNodeData, setAsStartNode, duplicateNode: duplicateNodeFunc } } : node
    ));
  }, [setNodes, setAsStartNode]);

  const duplicateNodeFunc = (nodeId: string): void => {
    setNodes((nds) => {
      const nodeToDuplicate = nds.find(n => n.id === nodeId);
      if (!nodeToDuplicate) return nds;
      const newId = (Math.random()*10000).toFixed(0);
      const newNode = {
        ...nodeToDuplicate,
        id: newId,
        position: { x: nodeToDuplicate.position.x + 50, y: nodeToDuplicate.position.y + 50 },
        data: {
          ...nodeToDuplicate.data,
          label: nodeToDuplicate.data.label + ' (Copy)',
          isStart: false,
          onChange: updateNodeData,
          setAsStartNode: setAsStartNode,
          duplicateNode: duplicateNodeFunc,
          callTypes: nodeToDuplicate.data.callTypes
        },
        selected: false
      };
      return [...nds, newNode];
    });
  };

  // Update existing nodes with handlers when nodes load
  useEffect(() => {
    setNodes((nds) => nds.map((node) => {
      if (!node.data.duplicateNode) {
        return {
          ...node,
          data: { ...node.data, duplicateNode: duplicateNodeFunc, onChange: updateNodeData, setAsStartNode: setAsStartNode }
        };
      }
      return node;
    }));
  }, [nodes.length]);

  // ============================================================================
  // AUTH / SESSION
  // ============================================================================

  const SESSION_TIMEOUT: number = 30 * 60 * 1000;
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isAuthenticated) return;
    const checkSession = setInterval(() => {
      if (Date.now() - lastActivityRef.current > SESSION_TIMEOUT) {
        setIsAuthenticated(false);
        setAuthToken(null);
        setShowAdmin(false);
        sessionStorage.removeItem('admin_token');
        alert('Admin session expired due to inactivity. Please authenticate again.');
      }
    }, 60000);
    return () => clearInterval(checkSession);
  }, [isAuthenticated]);

  useEffect(() => {
    const updateActivity = () => { lastActivityRef.current = Date.now(); };
    if (isAuthenticated) {
      window.addEventListener('click', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('scroll', updateActivity);
      return () => {
        window.removeEventListener('click', updateActivity);
        window.removeEventListener('keydown', updateActivity);
        window.removeEventListener('scroll', updateActivity);
      };
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('admin_token');
    const savedTimestamp = sessionStorage.getItem('admin_timestamp');
    if (savedToken && savedTimestamp) {
      const timeSinceAuth = Date.now() - parseInt(savedTimestamp);
      if (timeSinceAuth < SESSION_TIMEOUT) {
        setIsAuthenticated(true);
        setAuthToken(savedToken);
        lastActivityRef.current = Date.now();
      } else {
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_timestamp');
      }
    }
  }, []);

  const handleAdminUnlock = () => {
    if (DISABLE_AUTH) { setShowAdmin(!showAdmin); return; }
    if (lockoutUntil && Date.now() < lockoutUntil) {
      alert(`Too many failed attempts. Please wait ${Math.ceil((lockoutUntil - Date.now()) / 1000)} seconds.`);
      return;
    }
    if (isAuthenticated) { setShowAdmin(!showAdmin); }
    else { setShowPasswordModal(true); setPasswordInput(''); setPasswordError(''); }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) { setPasswordError('Please enter a password'); return; }
    try {
      const response = await fetch(`${API_URL}/verify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true); setAuthToken(data.token); setShowAdmin(true);
        setShowPasswordModal(false); setPasswordInput(''); setPasswordError('');
        setFailedAttempts(0); setLockoutUntil(null);
        sessionStorage.setItem('admin_token', data.token);
        sessionStorage.setItem('admin_timestamp', Date.now().toString());
        lastActivityRef.current = Date.now();
      } else {
        const newFailed = failedAttempts + 1;
        setFailedAttempts(newFailed);
        if (newFailed >= 3) {
          setLockoutUntil(Date.now() + 60000);
          setPasswordError('Too many failed attempts. Locked out for 1 minute.');
          setShowPasswordModal(false); setPasswordInput('');
          setTimeout(() => { setFailedAttempts(0); setLockoutUntil(null); }, 60000);
        } else {
          setPasswordError(`Incorrect password. ${3 - newFailed} attempts remaining.`);
        }
      }
    } catch (error: any) {
      setPasswordError(`Error connecting to server: ${error.message}. Make sure server is running and ADMIN_PASSWORD is set.`);
    }
  };

  const handleAdminLock = () => {
    setIsAuthenticated(false); setAuthToken(null); setShowAdmin(false);
    sessionStorage.removeItem('admin_token'); sessionStorage.removeItem('admin_timestamp');
  };

  // ============================================================================
  // FLOW PERSISTENCE (save/load/refresh)
  // ============================================================================

  const refreshFlows = (onLoaded?: (flows: string[]) => void): void => {
    if (USE_LOCAL_STORAGE) {
      let finalFlows = ["default_flow.json"];
      const savedFlows = localStorage.getItem('insurance-wizard-flows');
      if (savedFlows) {
        finalFlows = JSON.parse(savedFlows);
        setAvailableFlows(finalFlows);
      } else {
        const hasAnyData = Object.keys(localStorage).some(key => key.startsWith('insurance-wizard-') && key !== 'insurance-wizard-flows' && key !== 'insurance-wizard-last-flow');
        if (hasAnyData) {
          const flowKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('insurance-wizard-') && key !== 'insurance-wizard-flows' && key !== 'insurance-wizard-last-flow')
            .map(key => key.replace('insurance-wizard-', ''));
          finalFlows = flowKeys.length > 0 ? flowKeys : ["default_flow.json"];
        }
        setAvailableFlows(finalFlows);
        localStorage.setItem('insurance-wizard-flows', JSON.stringify(finalFlows));
      }
      if (onLoaded) onLoaded(finalFlows);
    } else {
      fetch(`${API_URL}/flows`)
        .then(res => res.json())
        .then(files => {
          const finalFlows = files.length === 0 ? ["default_flow.json"] : files;
          setAvailableFlows(finalFlows);
          if (onLoaded) onLoaded(finalFlows);
        })
        .catch(() => {
          setAvailableFlows(["default_flow.json"]);
          if (onLoaded) onLoaded(["default_flow.json"]);
        });
    }
  };

  const loadFlowData = (filename: string): void => {
    const applyData = (data: any) => {
      const nodesWithHandler = data.nodes.map((n: any) => ({
        ...n,
        data: { ...n.data, onChange: updateNodeData, setAsStartNode: setAsStartNode, callTypes: data.callTypes || DEFAULT_CALL_TYPES }
      }));
      setNodes(nodesWithHandler);
      setEdges(data.edges || []);
      setCarriers(data.carriers || DEFAULT_CARRIERS);
      setResources(data.resources || DEFAULT_RESOURCES);
      setQuoteSettings(data.quoteSettings || DEFAULT_QUOTE_SETTINGS);
      setCallTypes(data.callTypes || DEFAULT_CALL_TYPES);
      setIssues(data.issues || DEFAULT_ISSUES);
      setSelectedTone(data.selectedTone || 'neutral');
      setHistory([]);
      setActiveChecklistState({});
      const start = nodesWithHandler.find((n: any) => n.data.isStart) || nodesWithHandler.find((n: any) => n.id === '1') || nodesWithHandler[0];
      if (start) setCurrentNodeId(start.id);
    };

    const setEmpty = (ct?: string[]) => {
      setNodes([{ id: '1', type: 'scriptNode', position: {x:250, y:150}, data: {label:'Start', text:'Welcome to the Insurance Wizard', onChange: updateNodeData, setAsStartNode: setAsStartNode, isStart: true, callTypes: ct || DEFAULT_CALL_TYPES}}]);
      setEdges([]); setCarriers(DEFAULT_CARRIERS); setResources(DEFAULT_RESOURCES);
      setQuoteSettings(DEFAULT_QUOTE_SETTINGS); setCallTypes(ct || DEFAULT_CALL_TYPES);
      setHistory([]); setCurrentNodeId('1');
    };

    if (USE_LOCAL_STORAGE) {
      const savedData = localStorage.getItem(`insurance-wizard-${filename}`);
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (!data.nodes || data.nodes.length === 0) { setEmpty(data.callTypes); return; }
          applyData(data);
        } catch (err) {
          console.error('Error loading from localStorage:', err);
          setNodes([{ id: '1', type: 'scriptNode', position: {x:250, y:150}, data: {label:'Start', text:'Error loading file. Resetting...', onChange: updateNodeData, setAsStartNode: setAsStartNode, isStart: true}}]);
          setEdges([]); setHistory([]);
        }
      } else {
        setEmpty();
      }
    } else {
      fetch(`${API_URL}/load?filename=${filename}`)
        .then(res => res.json())
        .then(data => {
          if (!data.nodes || data.nodes.length === 0) { setEmpty(data.callTypes); return; }
          applyData(data);
        }).catch(() => {
          setNodes([{ id: '1', type: 'scriptNode', position: {x:250, y:150}, data: {label:'Start', text:'Error loading file. Resetting...', onChange: updateNodeData, setAsStartNode: setAsStartNode, isStart: true}}]);
          setEdges([]); setHistory([]);
        });
    }
  };

  // Initial load
  useEffect(() => {
    refreshFlows((fetchedFlows) => {
      let targetFlow = currentFlowName;
      if (!fetchedFlows.includes(targetFlow) && fetchedFlows.length > 0) {
        targetFlow = fetchedFlows[0];
        setCurrentFlowName(targetFlow);
      }
      loadFlowData(targetFlow);
    });
  }, []);

  const saveToServer = () => {
    const cleanNodes = nodes.map(n => { const { onChange, setAsStartNode: _, ...rest } = n.data; return { ...n, data: rest }; });
    const dataToSave = {
      filename: currentFlowName, nodes: cleanNodes, edges, carriers,
      quoteSettings, resources, callTypes, issues, selectedTone: selectedTone || 'neutral'
    };
    if (USE_LOCAL_STORAGE) {
      localStorage.setItem(`insurance-wizard-${currentFlowName}`, JSON.stringify(dataToSave));
      const savedFlows = localStorage.getItem('insurance-wizard-flows');
      const flows = savedFlows ? JSON.parse(savedFlows) : [];
      if (!flows.includes(currentFlowName)) {
        flows.push(currentFlowName);
        localStorage.setItem('insurance-wizard-flows', JSON.stringify(flows));
        setAvailableFlows(flows);
      }
      alert('Playbook saved successfully!');
    } else {
      fetch(`${API_URL}/save`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dataToSave) })
        .then(res => res.json()).then(d => alert(d.message));
    }
  };

  const handleSwitchFlow = (e: ChangeEvent<HTMLSelectElement>): void => {
    const newFile = e.target.value;
    if (newFile === "NEW") {
      const name = prompt("Enter name for new Playbook (e.g., 'Home Insurance'):");
      if (name) {
        const safeName = name.toLowerCase().replace(/ /g, '_') + ".json";
        setAvailableFlows(prev => [...prev, safeName]);
        setCurrentFlowName(safeName);
        setNodes([{ id: '1', type: 'scriptNode', position: {x:250, y:150}, data: {label:'Start', text:'', onChange: updateNodeData, setAsStartNode: setAsStartNode, isStart: true, callTypes}}]);
        setEdges([]); setCarriers(DEFAULT_CARRIERS); setResources(DEFAULT_RESOURCES);
        setQuoteSettings(DEFAULT_QUOTE_SETTINGS); setCallTypes(DEFAULT_CALL_TYPES);
        setHistory([]); setCurrentNodeId('1');
      }
    } else {
      setCurrentFlowName(newFile);
      loadFlowData(newFile);
    }
  };

  const duplicateCurrentPlaybook = () => {
    const baseName = currentFlowName.replace('.json', '');
    const copyName = prompt(`Enter name for duplicate of "${baseName}":`, `${baseName} (Copy)`);
    if (!copyName || copyName.trim() === '') return;
    let safeCopyName = copyName.trim();
    if (!safeCopyName.endsWith('.json')) safeCopyName += '.json';
    saveToServer();
    if (USE_LOCAL_STORAGE) {
      const originalData = localStorage.getItem(`insurance-wizard-${currentFlowName}`);
      if (originalData) {
        localStorage.setItem(`insurance-wizard-${safeCopyName}`, originalData);
        const flows = JSON.parse(localStorage.getItem('insurance-wizard-flows') || '[]');
        if (!flows.includes(safeCopyName)) {
          flows.push(safeCopyName);
          localStorage.setItem('insurance-wizard-flows', JSON.stringify(flows));
          setAvailableFlows(flows);
        }
        setCurrentFlowName(safeCopyName); loadFlowData(safeCopyName);
        alert(`Playbook duplicated as "${safeCopyName.replace('.json', '')}"!`);
      }
    } else {
      fetch(`${API_URL}/copy_flow`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ sourceFilename: currentFlowName, newFilename: safeCopyName })
      }).then(res => res.json()).then(data => {
        if (data.message?.includes("success")) {
          refreshFlows(); setCurrentFlowName(safeCopyName); loadFlowData(safeCopyName);
          alert(`Playbook duplicated as "${safeCopyName.replace('.json', '')}"!`);
        }
      });
    }
  };

  // ============================================================================
  // EXPORT
  // ============================================================================

  const exportPlaybookAsText = () => {
    try {
      const output: string[] = [];
      const HR = '═'.repeat(88);
      const SEC = '─'.repeat(88);
      const SUB = '·'.repeat(88);
      
      output.push(HR, '                    INSURANCE WIZARD PLAYBOOK', '                     LEGAL COMPLIANCE REVIEW', HR, '');
      output.push('  PLAYBOOK INFORMATION:', '');
      output.push('    Name:             ' + currentFlowName.replace('.json', ''));
      output.push('    Export Date:      ' + new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
      output.push('    Total Steps:      ' + nodes.length);
      output.push('    Total Paths:      ' + edges.length);
      output.push('', SEC, '', '  SECTION 1: CALL TYPES', '');
      callTypes.forEach((type, idx) => output.push('    ' + (idx + 1) + '. ' + type));
      output.push('', SEC, '', '  SECTION 2: CARRIER SCRIPTS', '');

      Object.values(carriers).forEach((carrier, idx) => {
        output.push(SUB, '', '  CARRIER ' + (idx + 1) + ': ' + carrier.name.toUpperCase(), '');
        if (carrier.scripts) {
          callTypes.forEach(ct => {
            const script = carrier.scripts[ct];
            if (script?.trim()) {
              output.push('    Call Type: ' + ct.toUpperCase());
              const clean = script.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
              if (clean) clean.split('\n').forEach(l => { if (l.trim()) output.push('      ' + l.trim()); });
              output.push('');
            }
          });
        }
      });

      output.push(SEC, '', '  SECTION 3: CALL FLOW', '');
      const startNode = nodes.find(n => n.data?.isStart) || nodes[0];
      if (startNode) {
        const visited = new Set<string>();
        let stepNum = 1;
        const buildTree = (nodeId: string, depth: number) => {
          if (!nodeId || visited.has(nodeId) || depth > 20) return;
          visited.add(nodeId);
          const node = nodes.find(n => n.id === nodeId);
          if (!node?.data) return;
          const indent = '  ' + '│  '.repeat(depth);
          output.push(indent + 'STEP ' + stepNum + ': ' + (node.data.label || ''));
          stepNum++;
          if (node.type === 'scriptNode' && node.data.text) {
            output.push(indent + '  ' + node.data.text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
          }
          const children = edges.filter(e => e.source === nodeId);
          children.forEach(edge => {
            output.push(indent + '  → [' + (edge.label || 'Next') + ']');
            buildTree(edge.target, depth + 1);
          });
          if (children.length === 0) output.push(indent + '  [END]');
        };
        buildTree(startNode.id, 0);
      }

      output.push('', HR, '', '  END OF DOCUMENT', '', '  Exported: ' + new Date().toLocaleString(), '', HR);
      const blob = new Blob([output.join('\n')], { type: 'text/plain; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFlowName.replace('.json', '') + '_LEGAL_REVIEW.txt';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Error exporting: ' + error.message);
    }
  };

  // ============================================================================
  // AUTO-LAYOUT
  // ============================================================================

  const autoLayoutNodes = () => {
    if (nodes.length === 0) return;
    const startNode = nodes.find(n => n.data?.isStart) || nodes.find(n => n.id === '1') || nodes[0];
    if (!startNode) return;
    const HORIZONTAL_SPACING = 300, VERTICAL_SPACING = 150, START_X = 100, START_Y = 100;
    const levels = new Map<number, string[]>();
    const nodePositions = new Map<string, { x: number; y: number }>();
    const visited = new Set<string>();
    const queue: { id: string; level: number }[] = [{ id: startNode.id, level: 0 }];
    visited.add(startNode.id);
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (!levels.has(level)) levels.set(level, []);
      levels.get(level)!.push(id);
      edges.filter(e => e.source === id).forEach(edge => {
        if (!visited.has(edge.target)) { visited.add(edge.target); queue.push({ id: edge.target, level: level + 1 }); }
      });
    }
    levels.forEach((nodeIds, level) => {
      nodeIds.forEach((nodeId, index) => {
        nodePositions.set(nodeId, { x: START_X + level * HORIZONTAL_SPACING, y: START_Y + index * VERTICAL_SPACING });
      });
    });
    nodes.forEach(node => {
      if (!nodePositions.has(node.id)) {
        nodePositions.set(node.id, { x: START_X, y: START_Y + (levels.get(0)?.length || 0) * VERTICAL_SPACING + 200 });
      }
    });
    setNodes(nodes.map(node => {
      const pos = nodePositions.get(node.id);
      return pos ? { ...node, position: pos } : node;
    }));
    const orphans = nodes.length - visited.size;
    alert(`Layout complete! ${nodes.length} nodes in ${levels.size} levels.${orphans > 0 ? ` ${orphans} orphan(s).` : ''}`);
  };

  // ============================================================================
  // EDITOR ACTIONS (add/delete/connect nodes)
  // ============================================================================

  const onConnect = useCallback((params: Connection) => {
    const label = window.prompt("Choice label?", "Next");
    setEdges((eds) => addEdge({ ...params, label: label || "Next" }, eds));
  }, [setEdges]);

  const addNewNode = () => setNodes((nds) => [...nds, { id: (Math.random()*10000).toFixed(0), type: 'scriptNode', position: {x:250, y:150}, data: {label:'Step', text:'', onChange: updateNodeData, setAsStartNode: setAsStartNode, duplicateNode: duplicateNodeFunc}}]);
  const addCarrierNode = () => setNodes((nds) => [...nds, { id: (Math.random()*10000).toFixed(0), type: 'carrierNode', position: {x:250, y:150}, data: {label:'Select Carrier', onChange: updateNodeData, setAsStartNode: setAsStartNode, duplicateNode: duplicateNodeFunc, callTypes, defaultCallType: callTypes[0] || "Quote"}}]);
  const addQuoteNode = () => setNodes((nds) => [...nds, { id: (Math.random()*10000).toFixed(0), type: 'quoteNode', position: {x:250, y:150}, data: {label:'Present Quote', closingQuestion:'How does that price sound?', onChange: updateNodeData, setAsStartNode: setAsStartNode, duplicateNode: duplicateNodeFunc}}]);
  const addMadLibsNode = () => setNodes((nds) => [...nds, { id: (Math.random()*10000).toFixed(0), type: 'madLibsNode', position: {x:250, y:150}, data: {label:'Word Track', template:'', onChange: updateNodeData, setAsStartNode: setAsStartNode, duplicateNode: duplicateNodeFunc}}]);
  const addChecklistNode = () => setNodes((nds) => [...nds, { id: (Math.random()*10000).toFixed(0), type: 'checklistNode', position: {x:250, y:150}, data: {label:'Compliance Check', items:'Did you disclose the TCPA? (yes/no)\nDid you verify date of birth?', onChange: updateNodeData, setAsStartNode: setAsStartNode, duplicateNode: duplicateNodeFunc}}]);

  const deleteSelected = useCallback(() => {
    const deletedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected && !deletedNodeIds.includes(e.source) && !deletedNodeIds.includes(e.target)));
  }, [nodes, setNodes, setEdges]);

  // ============================================================================
  // WIZARD NAVIGATION
  // ============================================================================

  const getCurrentNode = () => nodes.find(n => n.id === currentNodeId);
  const getOptions = () => edges.filter(e => e.source === currentNodeId).map(e => ({ label: e.label || "Next", targetId: e.target }));

  const handleHistoryClick = (index: number): void => {
    const newHistory = history.slice(0, index);
    setHistory(newHistory);
    const clickedStep = history[index];
    setCurrentNodeId(clickedStep.id);
    if (clickedStep.type === 'carrierNode' && clickedStep.carrierInfo) {
      setSelectedCarrierId(clickedStep.carrierInfo.id);
      setSelectedCallType(clickedStep.carrierInfo.selectedCallType || "Quote");
    } else {
      setSelectedCarrierId(null);
      setSelectedCallType("Quote");
    }
    setTimeout(() => {
      const wizardContent = document.querySelector('.wizard-content');
      if (wizardContent) {
        const historyItems = wizardContent.querySelectorAll('.history-item');
        if (historyItems[index]) scrollToElement(historyItems[index]);
      }
    }, 100);
  };

  const handleOptionClick = (targetId: string, label: string): void => {
    const current = getCurrentNode();
    let historyData: any = { ...current, selectedOption: label };
    if (current.type === 'carrierNode' && selectedCarrierId) {
      historyData.carrierInfo = {
        ...carriers[selectedCarrierId],
        selectedCallType: selectedCallType,
        displayScript: carriers[selectedCarrierId].scripts?.[selectedCallType] || carriers[selectedCarrierId].script
      };
    }
    if (current.type === 'checklistNode') {
      historyData.checklistAnswers = activeChecklistState[current.id] || {};
    }
    if (current.type === 'madLibsNode') {
      historyData.madLibsData = {
        filledText: fillTemplate(current.data.template, madLibsValues[current.id] || {}),
        variables: madLibsValues[current.id] || {}
      };
    }
    setHistory(prev => [...prev, historyData]);
    setCurrentNodeId(targetId);
    setSelectedCarrierId(null);
    setSelectedCallType("Quote");
    triggerAutoScroll();
  };

  const resetWizard = () => {
    const start = nodes.find(n => n.data.isStart) || nodes.find(n => n.id === '1') || nodes[0];
    if (start) setCurrentNodeId(start.id);
    setHistory([]); setSelectedCarrierId(null); setSelectedCallType("Quote");
    setActiveChecklistState({}); setMadLibsValues({});
    resetScrollState();
    setTimeout(scrollToTop, 100);
  };

  // ============================================================================
  // CHECKLIST / MAD LIBS / COMPLIANCE
  // ============================================================================

  const updateChecklistAnswer = (nodeId: string, itemText: string, value: string | null): void => {
    setActiveChecklistState(prev => {
      const nodeState = prev[nodeId] || {};
      if (value === null) { const ns = { ...nodeState }; delete ns[itemText]; return { ...prev, [nodeId]: ns }; }
      return { ...prev, [nodeId]: { ...nodeState, [itemText]: value } };
    });
  };

  const updateMadLibsValue = (nodeId: string, variableName: string, value: string): void => {
    setMadLibsValues(prev => ({ ...prev, [nodeId]: { ...(prev[nodeId] || {}), [variableName]: value } }));
  };

  const generateComplianceReport = () => {
    let report = `COMPLIANCE LOG - ${new Date().toLocaleString()}\n`;
    const complianceSteps = history.filter(h => h.type === 'checklistNode');
    if (complianceSteps.length === 0) return null;
    complianceSteps.forEach(step => {
      report += `\n[${step.data.label}]\n`;
      const allItems = (step.data.items || "").split('\n').filter(i => i.trim() !== "");
      const answers = step.checklistAnswers || {};
      allItems.forEach(rawItem => {
        const isYesNo = rawItem.toLowerCase().includes('(yes/no)');
        const cleanItem = rawItem.replace(/\(yes\/no\)/i, '').trim();
        const val = answers[cleanItem];
        if (isYesNo) report += `[${val ? val.toUpperCase() : ' '}] ${cleanItem}\n`;
        else report += `[${val ? 'X' : ' '}] ${cleanItem}\n`;
      });
    });
    return report;
  };

  const copyCompliance = () => {
    const text = generateComplianceReport();
    if (text) { navigator.clipboard.writeText(text); alert("Compliance Log copied to clipboard!"); }
    else alert("No compliance steps recorded.");
  };

  const renderChecklistItems = (itemsText: string | undefined, answers: Record<string, string | null> | undefined, nodeId: string, isInteractive: boolean) => {
    return (itemsText || "").split('\n').map((rawItem, i) => {
      if (!rawItem.trim()) return null;
      const isYesNo = rawItem.toLowerCase().includes('(yes/no)');
      const cleanItem = rawItem.replace(/\(yes\/no\)/i, '').trim();
      const currentVal = answers ? answers[cleanItem] : null;
      if (isYesNo) {
        return (
          <div key={i} style={{margin:'8px 0', padding:'8px', background:'white', border:`1px solid ${BORDER}`, borderRadius:'6px'}}>
            <div style={{fontSize:'14px', color:SLATE, marginBottom:'6px', fontWeight:'500', wordWrap: 'break-word'}}>{cleanItem}</div>
            <div style={{display:'flex', gap:'12px'}}>
              <label style={{display:'flex', alignItems:'center', gap:'4px', cursor: isInteractive ? 'pointer' : 'default'}}>
                <input type="radio" disabled={!isInteractive} checked={currentVal === 'Yes'} onChange={() => isInteractive && updateChecklistAnswer(nodeId, cleanItem, 'Yes')} style={{accentColor: COMPLIANCE_ORANGE}} />
                <span style={{fontSize:'13px'}}>Yes</span>
              </label>
              <label style={{display:'flex', alignItems:'center', gap:'4px', cursor: isInteractive ? 'pointer' : 'default'}}>
                <input type="radio" disabled={!isInteractive} checked={currentVal === 'No'} onChange={() => isInteractive && updateChecklistAnswer(nodeId, cleanItem, 'No')} style={{accentColor: COMPLIANCE_ORANGE}} />
                <span style={{fontSize:'13px'}}>No</span>
              </label>
            </div>
          </div>
        );
      } else {
        return (
          <label key={i} style={{display:'flex', gap:'10px', alignItems:'center', cursor: isInteractive ? 'pointer' : 'default', padding:'8px', background: isInteractive ? 'white' : 'transparent', borderRadius:'6px', border: isInteractive ? `1px solid ${BORDER}` : 'none'}}>
            <input type="checkbox" disabled={!isInteractive} checked={!!currentVal} onChange={() => isInteractive && updateChecklistAnswer(nodeId, cleanItem, currentVal ? null : 'checked')} style={{width:'16px', height:'16px', accentColor: COMPLIANCE_ORANGE, flexShrink: 0}} />
            <span style={{fontSize:'14px', color:SLATE, wordWrap: 'break-word'}}>{cleanItem}</span>
          </label>
        );
      }
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="app-container" style={{display:'flex', width:'100vw', height:'100vh', overflow:'hidden', fontFamily:'Inter, sans-serif'}}>
      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '30px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <h2 style={{margin: '0 0 10px 0', fontSize: '24px', color: SLATE}}>🔒 Admin Authentication</h2>
            <p style={{margin: '0 0 20px 0', fontSize: '14px', color: '#666'}}>Enter the admin password to unlock the editor panel.</p>
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()} placeholder="Enter password" autoFocus
              style={{ width: '100%', padding: '12px', fontSize: '16px', border: `2px solid ${passwordError ? '#ef4444' : BORDER}`, borderRadius: '8px', marginBottom: '10px', boxSizing: 'border-box' }} />
            {passwordError && (
              <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '15px', padding: '8px', background: '#fee2e2', borderRadius: '6px' }}>{passwordError}</div>
            )}
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setPasswordError(''); }}
                style={{ padding: '10px 20px', border: `1px solid ${BORDER}`, background: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: SLATE }}>Cancel</button>
              <button onClick={handlePasswordSubmit}
                style={{ padding: '10px 20px', border: 'none', background: JERRY_PINK, color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>Unlock</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CallTypesManager isOpen={isCallTypesModalOpen} onClose={() => setCallTypesModalOpen(false)} callTypes={callTypes} setCallTypes={setCallTypes} />
      <CarrierManager isOpen={isCarrierModalOpen} onClose={() => setCarrierModalOpen(false)} carriers={carriers} setCarriers={setCarriers} callTypes={callTypes} />
      <SettingsManager isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} settings={quoteSettings} setSettings={setQuoteSettings} />
      <PlaybookManager isOpen={isPlaybookManagerOpen} onClose={() => setPlaybookManagerOpen(false)} availableFlows={availableFlows} refreshList={refreshFlows} currentFlowName={currentFlowName} setCurrentFlowName={setCurrentFlowName} loadFlowData={loadFlowData} />

      {/* Resource Sidebar */}
      <ResourceSidebar resources={resources} setResources={setResources} issues={issues} setIssues={setIssues} />

      {/* ==================== WIZARD PANE ==================== */}
      <div className="wizard-pane" style={{ flex: showAdmin ? '0 0 400px' : '1', maxWidth: '100%', minWidth: '350px', borderRight: showAdmin ? `1px solid ${BORDER}` : 'none', display:'flex', flexDirection:'column', background: 'white' }}>
        {/* Header */}
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
          <button className="btn btn-secondary" onClick={handleAdminUnlock} style={{marginRight:'10px', color: showAdmin ? JERRY_PINK : '#999', borderColor: 'transparent'}}>
            {showAdmin ? <Unlock size={16}/> : <Lock size={16}/>}
          </button>
          {isAuthenticated && showAdmin && (
            <button className="btn btn-secondary" onClick={handleAdminLock} title="Lock Admin Panel" style={{marginRight:'10px', color: '#ef4444', borderColor: 'transparent'}}><Lock size={16}/></button>
          )}
          <button className="btn btn-secondary" onClick={resetWizard} style={{color: SLATE}}><RefreshCw size={16} /></button>
        </div>

        {/* Tone Selector */}
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

        {/* Wizard Content (conversation history + current node) */}
        <div className="wizard-content" style={{background: 'white', overflowX: 'hidden'}} onScroll={handleScroll}>
          {history.map((step, idx) => (
            <div key={idx} className="history-item" onClick={() => handleHistoryClick(idx)}
              style={{ opacity: 0.6, marginBottom: '20px', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}>
              <div className="bubble" style={{ background: `${TONES[selectedTone].color}80`, borderLeft: `3px solid ${TONES[selectedTone].borderColor}` }}>
                <div className="bubble-label" style={{color: TONES[selectedTone].textColor}}>{step.data.label}</div>
                {step.type === 'scriptNode' && <div className="bubble-text" style={{color: TONES[selectedTone].textColor, width: '100%', minWidth: 0, wordWrap: 'break-word', overflowWrap: 'break-word', wordBreak: 'normal', whiteSpace: 'normal'}} dangerouslySetInnerHTML={{__html: cleanHTML(step.data.toneScripts?.[selectedTone] || step.data.text)}}></div>}
                {step.type === 'carrierNode' && step.carrierInfo && (
                  <div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px'}}>
                      <div style={{fontWeight:'bold', color:JERRY_PINK}}>{step.carrierInfo.name} Selected</div>
                      {step.carrierInfo.selectedCallType && (
                        <div style={{fontSize:'10px', background:'#8b5cf6', color:'white', padding:'3px 6px', borderRadius:'4px', fontWeight:'bold'}}>{step.carrierInfo.selectedCallType}</div>
                      )}
                    </div>
                    <div style={{fontSize:'12px'}} dangerouslySetInnerHTML={{__html: step.carrierInfo.displayScript || ''}}></div>
                  </div>
                )}
                {step.type === 'checklistNode' && (
                  <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                    {renderChecklistItems(step.data.items, step.checklistAnswers, step.id, false)}
                  </div>
                )}
                {step.type === 'madLibsNode' && step.madLibsData && (
                  <div style={{background:'white', padding:'10px', borderRadius:'6px', border:'1px solid #10b981'}}>
                    <div style={{fontSize:'13px', color:SLATE, lineHeight:'1.6'}}>{step.madLibsData.filledText}</div>
                  </div>
                )}
                {step.type === 'quoteNode' && <div style={{fontStyle:'italic', color:'#666'}}>Quote presented.</div>}
              </div>
            </div>
          ))}

          {/* Current Node */}
          {getCurrentNode() && (
            <div className="bubble" style={{
              borderLeft: `4px solid ${getCurrentNode()!.type === 'carrierNode' ? '#8b5cf6' : getCurrentNode()!.type === 'quoteNode' ? JERRY_PINK : getCurrentNode()!.type === 'checklistNode' ? COMPLIANCE_ORANGE : getCurrentNode()!.type === 'madLibsNode' ? '#10b981' : TONES[selectedTone].borderColor}`,
              background: TONES[selectedTone].color,
              boxShadow: `0 2px 8px ${TONES[selectedTone].borderColor}20`
            }}>
              <div className="bubble-label" style={{color: TONES[selectedTone].textColor}}>{getCurrentNode()!.data.label}</div>
              
              {getCurrentNode()!.type === 'scriptNode' && (
                <div className="bubble-text" style={{ color: TONES[selectedTone].textColor, width: '100%', minWidth: 0, wordWrap: 'break-word', overflowWrap: 'break-word', wordBreak: 'normal', whiteSpace: 'normal' }}
                  dangerouslySetInnerHTML={{__html: cleanHTML(getCurrentNode()!.data.toneScripts?.[selectedTone] || getCurrentNode()!.data.text)}}></div>
              )}

              {getCurrentNode()!.type === 'carrierNode' && (
                <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                  <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:SLATE, display:'block', marginBottom:'6px'}}>Call Type:</label>
                    <select style={{padding:'8px', borderRadius:'8px', border:`1px solid ${BORDER}`, fontSize:'14px', width:'100%'}} onChange={(e) => setSelectedCallType(e.target.value)} value={selectedCallType || getCurrentNode()!.data.defaultCallType || callTypes[0] || "Quote"}>
                      {callTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:SLATE, display:'block', marginBottom:'6px'}}>Select Carrier:</label>
                    <select style={{padding:'8px', borderRadius:'8px', border:`1px solid ${BORDER}`, fontSize:'14px', width:'100%'}} onChange={(e) => setSelectedCarrierId(e.target.value)} value={selectedCarrierId || ""}>
                      <option value="" disabled>-- Choose Carrier --</option>
                      {Object.values(carriers).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {selectedCarrierId && carriers[selectedCarrierId] && (
                    <div style={{background:'white', padding:'12px', borderRadius:'8px', border:`2px solid #8b5cf6`}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                        <div style={{fontWeight:'bold', color:'#8b5cf6', fontSize:'15px'}}>{carriers[selectedCarrierId].name}</div>
                        <div style={{fontSize:'11px', background:'#8b5cf6', color:'white', padding:'4px 8px', borderRadius:'4px', fontWeight:'bold'}}>{selectedCallType}</div>
                      </div>
                      <div style={{fontSize:'13px', color:SLATE}} dangerouslySetInnerHTML={{__html: carriers[selectedCarrierId].scripts?.[selectedCallType] || carriers[selectedCarrierId].script || "<p><i>No script for this call type yet.</i></p>"}}></div>
                    </div>
                  )}
                </div>
              )}

              {getCurrentNode()!.type === 'checklistNode' && (
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {renderChecklistItems(getCurrentNode()!.data.items, activeChecklistState[getCurrentNode()!.id], getCurrentNode()!.id, true)}
                </div>
              )}

              {getCurrentNode()!.type === 'madLibsNode' && (
                <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                  <div style={{background:'white', padding:'12px', borderRadius:'8px', border:'2px solid #10b981'}}>
                    <div style={{fontSize:'11px', fontWeight:'bold', color:'#10b981', marginBottom:'8px', textTransform:'uppercase'}}>Preview:</div>
                    <div style={{fontSize:'14px', color:SLATE, lineHeight:'1.6', fontFamily:'inherit'}}>
                      {fillTemplate(getCurrentNode()!.data.template, madLibsValues[getCurrentNode()!.id] || {})}
                    </div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    <div style={{fontSize:'11px', fontWeight:'bold', color:'#10b981', textTransform:'uppercase'}}>Fill in the blanks:</div>
                    {extractVariables(getCurrentNode()!.data.template).map((variable, idx) => (
                      <div key={idx} style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                        <label style={{fontSize:'12px', fontWeight:'600', color:SLATE}}>{variable}:</label>
                        <input type="text" value={madLibsValues[getCurrentNode()!.id]?.[variable] || ''} onChange={(e) => updateMadLibsValue(getCurrentNode()!.id, variable, e.target.value)} placeholder={`Enter ${variable}...`}
                          style={{ padding:'10px', border:`1px solid ${BORDER}`, borderRadius:'6px', fontSize:'14px', width:'100%' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getCurrentNode()!.type === 'quoteNode' && (
                <QuoteBuilderForm closingQuestion={getCurrentNode()!.data.closingQuestion} settings={quoteSettings} carriers={carriers} />
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="wizard-actions" style={{ flexWrap: 'wrap' }}>
          {getCurrentNode() && getOptions().map((opt, idx) => (
            <button key={idx} className="btn-option" disabled={getCurrentNode()!.type === 'carrierNode' && !selectedCarrierId}
              style={{opacity: (getCurrentNode()!.type === 'carrierNode' && !selectedCarrierId) ? 0.5 : 1, borderColor: BORDER, color: SLATE}}
              onClick={() => handleOptionClick(opt.targetId, String(opt.label))}>
              <span>{opt.label}</span><ChevronRight size={16} color={JERRY_PINK} />
            </button>
          ))}
          {getCurrentNode() && getOptions().length === 0 && (
            <div style={{display:'flex', flexDirection:'column', gap:'10px', width:'100%'}}>
              {history.some(h => h.type === 'checklistNode') && (
                <button onClick={copyCompliance} className="btn-secondary" style={{borderColor: COMPLIANCE_ORANGE, color: '#9a3412', background:'#fff7ed', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                  <ClipboardCheck size={16}/> Copy Compliance Log
                </button>
              )}
              <button className="btn btn-primary" onClick={resetWizard} style={{background: JERRY_PINK, border:'none', width: '100%'}}>Complete Call</button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== EDITOR PANE ==================== */}
      {showAdmin && (
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
              <button onClick={duplicateCurrentPlaybook} title="Duplicate Current Playbook" style={{border:'none', background:'none', cursor:'pointer', padding:'4px'}}><Copy size={16} color={SLATE}/></button>
              <button onClick={() => setPlaybookManagerOpen(true)} title="Manage Playbooks" style={{border:'none', background:'none', cursor:'pointer', padding:'4px'}}><FolderCog size={16} color={SLATE}/></button>
            </div>
            <div style={{width:'1px', height:'20px', background: BORDER, margin:'0 4px'}}></div>
            <button className="btn btn-secondary" onClick={() => setSettingsModalOpen(true)} title="Config"><Settings size={16}/></button>
            <button className="btn btn-secondary" onClick={() => setCarrierModalOpen(true)} title="Carriers"><Building2 size={16}/></button>
            <button className="btn btn-secondary" onClick={() => setCallTypesModalOpen(true)} title="Manage Call Types" style={{color:'#8b5cf6'}}><Layers size={16}/></button>
            <button className="btn btn-secondary" onClick={exportPlaybookAsText} title="Export for Legal Review" style={{color:'#10b981'}}><FileText size={16}/></button>
            <button className="btn btn-secondary" onClick={autoLayoutNodes} title="Auto-Organize Playbook" style={{color:'#3b82f6'}}><GitBranch size={16}/></button>
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
