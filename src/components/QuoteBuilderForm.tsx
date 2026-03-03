import React, { useState } from 'react';
import { Plus, X, Copy, Layers } from 'lucide-react';
import { QuoteBuilderFormProps, Vehicle } from '../types';
import { JERRY_PINK, JERRY_BG, SLATE, BORDER, DEFAULT_QUOTE_SETTINGS } from '../constants';
import { cleanHTML } from '../utils/helpers';

const QuoteBuilderForm: React.FC<QuoteBuilderFormProps> = ({ closingQuestion, settings = DEFAULT_QUOTE_SETTINGS, carriers = {} }) => {
  const [downPayment, setDownPayment] = useState<string>("");
  const [monthly, setMonthly] = useState<string>("");
  const [term, setTerm] = useState<string>("6-month");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("");
  const [policyValues, setPolicyValues] = useState<Record<string, string>>({}); 
  const [policyChecks, setPolicyChecks] = useState<string[]>([]); 
  const [vehicles, setVehicles] = useState<Vehicle[]>([{ id: 1, name: "", coverages: [], values: {} }]);

  const togglePolicyCov = (cId: string): void => {
    setPolicyChecks(prev => {
      const has = prev.includes(cId);
      if (has) { const n = { ...policyValues }; delete n[cId]; setPolicyValues(n); return prev.filter(c => c !== cId); }
      return [...prev, cId];
    });
  };
  const updatePolicyVal = (cId: string, val: string): void => setPolicyValues(prev => ({ ...prev, [cId]: val }));
  const addVehicle = (): void => setVehicles([...vehicles, { id: Date.now(), name: "", coverages: [], values: {} }]);
  const removeVehicle = (id: number): void => { if(vehicles.length > 1) setVehicles(vehicles.filter(v => v.id !== id)); };
  const updateName = (id: number, name: string): void => setVehicles(vehicles.map(v => v.id === id ? { ...v, name } : v));
  const toggleVehCov = (vId: number, cId: string): void => setVehicles(vehicles.map(v => v.id === vId ? { ...v, coverages: v.coverages.includes(cId) ? v.coverages.filter(c => c !== cId) : [...v.coverages, cId] } : v));
  const updateVehVal = (vId: number, cId: string, val: string): void => setVehicles(vehicles.map(v => v.id === vId ? { ...v, values: { ...v.values, [cId]: val } } : v));
  const matchVehicleOne = (targetId: number): void => { const v1 = vehicles[0]; setVehicles(vehicles.map(v => v.id === targetId ? { ...v, coverages: [...v1.coverages], values: { ...v1.values } } : v)); };

  const generateScript = () => {
    if (!downPayment || !monthly) return "<p><i>Enter pricing to generate script.</i></p>";
    const joinList = (l) => l.length === 0 ? "" : l.length === 1 ? l[0] : l.length === 2 ? `${l[0]} and ${l[1]}` : `${l.slice(0, -1).join(", ")}, and ${l.slice(-1)}`;
    const formatItem = (cId, val) => {
      const conf = settings.coverages.find(s => s.id === cId);
      if (!conf) return "";
      const fmt = conf.format || settings.coverageFormat || "{label} with {value}";
      if (fmt.includes("{value}") && (!val || val.trim() === "")) return `<b>${conf.label}</b>`;
      return fmt.replace("{label}", conf.label).replace("{value}", val || "");
    };

    const policyItems = policyChecks.map(cId => formatItem(cId, policyValues[cId]));
    let policyString = policyItems.length > 0 ? `On the policy level, we have included ${joinList(policyItems)}` : "This includes basic state minimums";

    const vehiclesString = vehicles.map(v => {
        const covItems = v.coverages.map(cId => formatItem(cId, v.values[cId]));
        const covList = covItems.length > 0 ? joinList(covItems) : "state minimums";
        return (settings.vehicleTemplate || "for {name}, we have {coverages}").replace("{name}", `<b>${v.name || "Vehicle"}</b>`).replace("{coverages}", covList);
    }).join(". ");

    const carrierName = carriers[selectedCarrier]?.name || "our partner";
    const dSym = downPayment.includes('$') ? '' : '$'; const mSym = monthly.includes('$') ? '' : '$';
    let script = settings.template;
    script = script.replace("{carrier}", carrierName).replace("{policy}", policyString).replace("{vehicles}", vehiclesString);
    script = script.replace("{down}", `${dSym}${downPayment}`).replace("{monthly}", `${mSym}${monthly}`).replace("{term}", term);
    script = script.replace("{closing}", closingQuestion || "Did you want this policy to start effective today?");
    return script;
  };

  const policyFields = settings.coverages.filter(c => c.isPolicyLevel);
  const vehicleFields = settings.coverages.filter(c => !c.isPolicyLevel);

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
      <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
        <div style={{flexGrow:1, minWidth:'150px'}}><label style={{fontSize:'11px', fontWeight:'bold', color: SLATE}}>CARRIER</label><select style={{width:'100%', padding:'8px', borderRadius:'6px', border:`1px solid ${BORDER}`, background:'white'}} value={selectedCarrier} onChange={e => setSelectedCarrier(e.target.value)}><option value="">-- Select --</option>{Object.values(carriers).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div style={{width:'90px'}}><label style={{fontSize:'11px', fontWeight:'bold', color: SLATE}}>DOWN</label><input style={{width:'100%', padding:'8px', borderRadius:'6px', border:`1px solid ${BORDER}`}} placeholder="$0.00" value={downPayment} onChange={e => setDownPayment(e.target.value)}/></div>
        <div style={{width:'90px'}}><label style={{fontSize:'11px', fontWeight:'bold', color: SLATE}}>MONTHLY</label><input style={{width:'100%', padding:'8px', borderRadius:'6px', border:`1px solid ${BORDER}`}} placeholder="$0.00" value={monthly} onChange={e => setMonthly(e.target.value)}/></div>
      </div>
      {policyFields.length > 0 && (
        <div style={{background: JERRY_BG, border:`1px solid #FBCFE8`, borderRadius:'8px', padding:'10px'}}>
          <div style={{fontSize:'11px', fontWeight:'bold', color: JERRY_PINK, marginBottom:'6px', display:'flex', alignItems:'center', gap:'4px'}}><Layers size={12}/> POLICY LEVEL</div>
          <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>{policyFields.map(c => { const isChecked = policyChecks.includes(c.id); return (<div key={c.id} style={{display:'flex', alignItems:'center', gap:'8px'}}><button onClick={() => togglePolicyCov(c.id)} style={{flexGrow: 1, textAlign: 'left', fontSize:'12px', padding:'6px 8px', borderRadius:'6px', cursor:'pointer', border:'1px solid', backgroundColor: 'white', borderColor: isChecked ? JERRY_PINK : BORDER, color: isChecked ? JERRY_PINK : SLATE, display: 'flex', alignItems: 'center', gap: '6px'}}><div style={{width:'12px', height:'12px', borderRadius:'12px', border: `1px solid ${isChecked ? JERRY_PINK : '#ccc'}`, background: isChecked ? JERRY_PINK : 'transparent'}}></div>{c.label}</button>{isChecked && c.hasInput && (<input className="nodrag" placeholder={c.placeholder || "Val"} value={policyValues[c.id] || ""} onChange={(e) => updatePolicyVal(c.id, e.target.value)} style={{width:'80px', fontSize:'12px', padding:'6px', border:`1px solid ${BORDER}`, borderRadius:'6px'}} />)}</div>); })}</div>
        </div>
      )}
      <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
        {vehicles.map((v, idx) => (
          <div key={v.id} style={{background:'#f9fafb', border:`1px solid ${BORDER}`, borderRadius:'8px', padding:'10px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', alignItems:'center'}}>
              <input placeholder={`Vehicle ${idx + 1} Name`} style={{border:`1px solid ${BORDER}`, padding:'4px 8px', borderRadius:'4px', width:'60%', fontSize:'13px', fontWeight:'bold'}} value={v.name} onChange={e => updateName(v.id, e.target.value)}/>
              <div style={{display:'flex', gap:'4px'}}>
                {idx > 0 && <button onClick={() => matchVehicleOne(v.id)} title="Copy V1" style={{border:`1px solid ${BORDER}`, background:'white', color: SLATE, cursor:'pointer', padding:'4px', borderRadius:'4px'}}><Copy size={14}/></button>}
                {vehicles.length > 1 && <button onClick={() => removeVehicle(v.id)} style={{border:'none', background:'none', color:'#ff4444', cursor:'pointer'}}><X size={14}/></button>}
              </div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>{vehicleFields.map(c => { const isChecked = v.coverages.includes(c.id); return (<div key={c.id} style={{display:'flex', alignItems:'center', gap:'8px'}}><button onClick={() => toggleVehCov(v.id, c.id)} style={{flexGrow: 1, textAlign: 'left', fontSize:'12px', padding:'6px 8px', borderRadius:'6px', cursor:'pointer', border:'1px solid', backgroundColor: 'white', borderColor: isChecked ? JERRY_PINK : BORDER, color: isChecked ? JERRY_PINK : SLATE, display: 'flex', alignItems: 'center', gap: '6px'}}><div style={{width:'12px', height:'12px', borderRadius:'12px', border: `1px solid ${isChecked ? JERRY_PINK : '#ccc'}`, background: isChecked ? JERRY_PINK : 'transparent'}}></div>{c.label}</button>{isChecked && c.hasInput && (<input className="nodrag" placeholder={c.placeholder || "Val"} value={v.values[c.id] || ""} onChange={(e) => updateVehVal(v.id, c.id, e.target.value)} style={{width:'80px', fontSize:'12px', padding:'6px', border:`1px solid ${BORDER}`, borderRadius:'6px'}} />)}</div>); })}</div>
          </div>
        ))}
        <button onClick={addVehicle} style={{fontSize:'12px', color: JERRY_PINK, background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:0, fontWeight:'bold'}}>+ Add another vehicle</button>
      </div>
      <div style={{marginTop:'4px'}}>
        <label style={{fontSize:'11px', fontWeight:'bold', color: JERRY_PINK}}>WORD TRACK:</label>
        <div style={{background:'white', border:`2px solid ${JERRY_PINK}`, borderRadius:'8px', padding:'12px', fontSize:'15px', lineHeight:'1.6', wordWrap: 'break-word', whiteSpace: 'normal', wordBreak: 'normal', overflowWrap: 'break-word'}} dangerouslySetInnerHTML={{__html: cleanHTML(generateScript())}}></div>
      </div>
    </div>
  );
};

export default QuoteBuilderForm;
