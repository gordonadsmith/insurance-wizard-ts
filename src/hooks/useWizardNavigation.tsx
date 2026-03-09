import { useState, useMemo, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { HistoryEntry, CarrierMap } from '../types';
import { BORDER, SLATE, COMPLIANCE_ORANGE } from '../constants';
import { fillTemplate } from '../utils/helpers';
import { useAutoScroll } from './useAutoScroll';

export const useWizardNavigation = (
  nodes: Node[],
  edges: Edge[],
  carriers: CarrierMap,
  callTypes: string[]
) => {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);
  const [selectedCallType, setSelectedCallType] = useState("Quote");
  const [madLibsValues, setMadLibsValues] = useState<Record<string, Record<string, string>>>({});
  const [activeChecklistState, setActiveChecklistState] = useState<Record<string, Record<string, string | null>>>({});

  const { handleScroll, scrollToElement, scrollToTop, resetScrollState, triggerAutoScroll } = useAutoScroll();

  // Memoize getCurrentNode instead of calling .find() 15+ times in render
  const currentNode = useMemo(
    () => nodes.find(n => n.id === currentNodeId) || null,
    [nodes, currentNodeId]
  );

  // Safely filter out ghost connections (edges pointing to nodes that no longer exist)
  const options = useMemo(
    () => edges
      .filter(e => e.source === currentNodeId)
      // Ensure the target node actually exists in the nodes array before showing it
      .filter(e => nodes.some(n => n.id === e.target))
      .map(e => ({ label: e.label || "Next", targetId: e.target })),
    [edges, currentNodeId, nodes]
  );

  const handleHistoryClick = useCallback((index: number): void => {
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
  }, [history, scrollToElement]);

  const handleOptionClick = useCallback((targetId: string, label: string): void => {
    if (!currentNode) return;
    let historyData: any = { ...currentNode, selectedOption: label };
    
    if (currentNode.type === 'carrierNode' && selectedCarrierId) {
      // Calculate safeCallType before saving to history to prevent ghost scripts
      const safeCallType = (selectedCallType && callTypes.includes(selectedCallType))
        ? selectedCallType
        : (currentNode.data.defaultCallType && callTypes.includes(currentNode.data.defaultCallType) 
            ? currentNode.data.defaultCallType 
            : callTypes[0] || "Quote");

      historyData.carrierInfo = {
        ...carriers[selectedCarrierId],
        selectedCallType: safeCallType,
        // Use ?? instead of || to prevent ghost text in history
        displayScript: carriers[selectedCarrierId].scripts?.[safeCallType] ?? carriers[selectedCarrierId].script
      };
    }
    
    if (currentNode.type === 'checklistNode') {
      historyData.checklistAnswers = activeChecklistState[currentNode.id] || {};
    }
    if (currentNode.type === 'madLibsNode') {
      historyData.madLibsData = {
        filledText: fillTemplate(currentNode.data.template, madLibsValues[currentNode.id] || {}),
        variables: madLibsValues[currentNode.id] || {}
      };
    }
    
    setHistory(prev => [...prev, historyData]);
    setCurrentNodeId(targetId);
    setSelectedCarrierId(null);
    setSelectedCallType(""); // Clear state; the IIFE in App.tsx will auto-resolve the correct default
    triggerAutoScroll();
  }, [currentNode, selectedCarrierId, selectedCallType, carriers, activeChecklistState, madLibsValues, triggerAutoScroll, callTypes]);

  const resetWizard = useCallback(() => {
    const start = nodes.find(n => n.data.isStart) || nodes.find(n => n.id === '1') || nodes[0];
    if (start) setCurrentNodeId(start.id);
    setHistory([]);
    setSelectedCarrierId(null);
    setSelectedCallType("Quote");
    setActiveChecklistState({});
    setMadLibsValues({});
    resetScrollState();
    setTimeout(scrollToTop, 100);
  }, [nodes, resetScrollState, scrollToTop]);

  const updateChecklistAnswer = useCallback((nodeId: string, itemText: string, value: string | null): void => {
    setActiveChecklistState(prev => {
      const nodeState = prev[nodeId] || {};
      if (value === null) {
        const ns = { ...nodeState };
        delete ns[itemText];
        return { ...prev, [nodeId]: ns };
      }
      return { ...prev, [nodeId]: { ...nodeState, [itemText]: value } };
    });
  }, []);

  const updateMadLibsValue = useCallback((nodeId: string, variableName: string, value: string): void => {
    setMadLibsValues(prev => ({ ...prev, [nodeId]: { ...(prev[nodeId] || {}), [variableName]: value } }));
  }, []);

  const generateComplianceReport = useCallback(() => {
    const complianceSteps = history.filter(h => h.type === 'checklistNode');
    if (complianceSteps.length === 0) return null;
    let report = `COMPLIANCE LOG - ${new Date().toLocaleString()}\n`;
    complianceSteps.forEach(step => {
      report += `\n[${step.data.label}]\n`;
      const allItems = (step.data.items || "").split('\n').filter((i: string) => i.trim() !== "");
      const answers = step.checklistAnswers || {};
      allItems.forEach((rawItem: string) => {
        const isYesNo = rawItem.toLowerCase().includes('(yes/no)');
        const cleanItem = rawItem.replace(/\(yes\/no\)/i, '').trim();
        const val = answers[cleanItem];
        if (isYesNo) report += `[${val ? val.toUpperCase() : ' '}] ${cleanItem}\n`;
        else report += `[${val ? 'X' : ' '}] ${cleanItem}\n`;
      });
    });
    return report;
  }, [history]);

  const copyCompliance = useCallback(() => {
    const text = generateComplianceReport();
    if (text) { navigator.clipboard.writeText(text); alert("Compliance Log copied to clipboard!"); }
    else alert("No compliance steps recorded.");
  }, [generateComplianceReport]);

  const renderChecklistItems = (
    itemsText: string | undefined,
    answers: Record<string, string | null> | undefined,
    nodeId: string,
    isInteractive: boolean
  ) => {
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

  return {
    currentNodeId,
    setCurrentNodeId,
    currentNode,
    options,
    history,
    setHistory,
    selectedCarrierId,
    setSelectedCarrierId,
    selectedCallType,
    setSelectedCallType,
    madLibsValues,
    activeChecklistState,
    setActiveChecklistState,
    handleScroll,
    handleHistoryClick,
    handleOptionClick,
    resetWizard,
    updateChecklistAnswer,
    updateMadLibsValue,
    copyCompliance,
    renderChecklistItems,
  };
};