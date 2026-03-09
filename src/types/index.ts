import { Node, Edge } from 'reactflow';

export interface Coverage {
  id: string;
  label: string;
  hasInput: boolean;
  placeholder?: string;
  isPolicyLevel: boolean;
  format: string;
  // NEW: Store how this specific coverage is phrased per-tone
  toneFormats?: Record<string, string>; 
}

export interface QuoteSettings {
  coverages: Coverage[];
  coverageFormat: string;
  vehicleTemplate: string;
  template: string;
  toneTemplates?: Record<string, string>; 
}

export interface Carrier {
  id: string;
  name: string;
  scripts: Record<string, string>;
  script?: string;
}

export type CarrierMap = Record<string, Carrier>;

export interface Resource {
  id: string | number;
  title: string;
  type: string;
  content: string;
}

export interface Issue {
  id: string | number;
  title: string;
  category: string;
  keywords: string;
  solution: string;
}

export interface Vehicle {
  id: number;
  name: string;
  coverages: string[];
  values: Record<string, string>;
}

export interface ToneConfig {
  label: string;
  color: string;
  textColor: string;
  borderColor: string;
  description: string;
}

export type ToneKey = 'neutral' | 'fun' | 'efficient' | 'detailed';

export interface BaseNodeData {
  label: string;
  isStart?: boolean;
  onChange: (id: string, data: any) => void;
  setAsStartNode: (id: string) => void;
  duplicateNode?: (id: string) => void;
  callTypes?: string[];
  text?: string;
  toneScripts?: Record<string, string>;
  showToneScripts?: boolean;
  defaultCallType?: string;
  closingQuestion?: string;
  items?: string;
  template?: string;
  toneTemplates?: Record<string, string>;
  [key: string]: any;
}

export interface HistoryEntry {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: BaseNodeData;
  selectedOption?: string;
  carrierInfo?: {
    id: string;
    name: string;
    scripts: Record<string, string>;
    selectedCallType?: string;
    displayScript?: string;
  };
  checklistAnswers?: Record<string, string | null>;
  madLibsData?: {
    filledText: string;
    variables: Record<string, string>;
  };
  selected?: boolean;
}

export interface FlowSaveData {
  filename?: string;
  nodes: Node[];
  edges: Edge[];
  carriers: CarrierMap;
  quoteSettings: QuoteSettings;
  resources: Resource[];
  callTypes: string[];
  issues: Issue[];
  selectedTone?: string;
}

export interface NodeComponentProps {
  id: string;
  data: BaseNodeData;
}

export interface QuoteBuilderFormProps {
  closingQuestion: string;
  settings?: QuoteSettings;
  carriers?: CarrierMap;
  selectedTone?: string; 
}

export interface SettingsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: QuoteSettings;
  setSettings: (s: QuoteSettings) => void;
}

export interface IssuesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  issues: Issue[];
  setIssues: (i: Issue[]) => void;
}

export interface ResourceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  setResources: (r: Resource[]) => void;
}

export interface ResourceSidebarProps {
  resources: Resource[];
  setResources: (r: Resource[]) => void;
  issues: Issue[];
  setIssues: (i: Issue[]) => void;
}

export interface PlaybookManagerProps {
  isOpen: boolean;
  onClose: () => void;
  availableFlows: string[];
  refreshList: (cb?: (flows: string[]) => void) => void;
  currentFlowName: string;
  setCurrentFlowName: (name: string) => void;
  loadFlowData: (name: string) => void;
}

export interface CallTypesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  callTypes: string[];
  setCallTypes: (ct: string[]) => void;
}

export interface CarrierManagerProps {
  isOpen: boolean;
  onClose: () => void;
  carriers: CarrierMap;
  setCarriers: React.Dispatch<React.SetStateAction<CarrierMap>>;
  callTypes: string[];
}