import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  MousePointerClick, Type, Hash, Calendar, List, Clock, Circle,
  Thermometer, CheckSquare, ImageIcon, Minus, LayoutGrid, Plus,
  Trash2, Copy, ChevronUp, ChevronDown, Eye, Code2, GripVertical,
  Wand2, AlertCircle, X, Settings, SquareMousePointer
} from "lucide-react";

const FIELD_CATEGORIES = [
  {
    label: "Input",
    fields: [
      { type: "text",        label: "Text",        icon: Type,              color: "violet"  },
      { type: "number",      label: "Number",       icon: Hash,              color: "emerald" },
      { type: "date",        label: "Date",         icon: Calendar,          color: "amber"   },
      { type: "datetime",    label: "Date & Time",  icon: Clock,             color: "cyan"    },
      { type: "temperature", label: "Temperature",  icon: Thermometer,       color: "rose"    },
    ],
  },
  {
    label: "Choice",
    fields: [
      { type: "list",     label: "Dropdown",  icon: List,        color: "orange" },
      { type: "radio",    label: "Radio",     icon: Circle,      color: "pink"   },
      { type: "checkbox", label: "Checkbox",  icon: CheckSquare, color: "teal"   },
    ],
  },
  {
    label: "Display",
    fields: [
      { type: "button",  label: "Button",  icon: MousePointerClick, color: "blue"   },
      { type: "image",   label: "Image",   icon: ImageIcon,          color: "indigo" },
      { type: "section", label: "Section", icon: Minus,              color: "slate"  },
      { type: "group",   label: "Group",   icon: LayoutGrid,         color: "gray"   },
    ],
  },
];

const FIELD_TYPES_FLAT = FIELD_CATEGORIES.flatMap((c) => c.fields);

const COLOR_MAP = {
  violet:  { bg: "bg-violet-100 dark:bg-violet-900/30",  icon: "text-violet-600 dark:text-violet-400",  badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30",icon: "text-emerald-600 dark:text-emerald-400",badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  amber:   { bg: "bg-amber-100 dark:bg-amber-900/30",    icon: "text-amber-600 dark:text-amber-400",    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  cyan:    { bg: "bg-cyan-100 dark:bg-cyan-900/30",      icon: "text-cyan-600 dark:text-cyan-400",      badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  rose:    { bg: "bg-rose-100 dark:bg-rose-900/30",      icon: "text-rose-600 dark:text-rose-400",      badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  orange:  { bg: "bg-orange-100 dark:bg-orange-900/30",  icon: "text-orange-600 dark:text-orange-400",  badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  pink:    { bg: "bg-pink-100 dark:bg-pink-900/30",      icon: "text-pink-600 dark:text-pink-400",      badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  teal:    { bg: "bg-teal-100 dark:bg-teal-900/30",      icon: "text-teal-600 dark:text-teal-400",      badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
  blue:    { bg: "bg-blue-100 dark:bg-blue-900/30",      icon: "text-blue-600 dark:text-blue-400",      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  indigo:  { bg: "bg-indigo-100 dark:bg-indigo-900/30",  icon: "text-indigo-600 dark:text-indigo-400",  badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  slate:   { bg: "bg-slate-100 dark:bg-slate-800",       icon: "text-slate-600 dark:text-slate-400",    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  gray:    { bg: "bg-gray-100 dark:bg-gray-700",         icon: "text-gray-600 dark:text-gray-400",      badge: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
};

function getFieldMeta(type) {
  return FIELD_TYPES_FLAT.find((f) => f.type === type) ?? { type, label: type, icon: Settings, color: "gray" };
}

function uid() {
  return "f_" + Math.random().toString(36).slice(2) + "_" + Date.now().toString(36);
}

function defaultField(type) {
  const base = {
    id: uid(), type,
    key: type + "_" + Math.random().toString(36).slice(2, 6),
    label: getFieldMeta(type).label,
    required: false, helpText: "", placeholder: "",
  };
  switch (type) {
    case "button":      return { ...base, label: "Submit", variant: "primary" };
    case "list":        return { ...base, label: "Select option", options: ["Option 1", "Option 2", "Option 3"], defaultValue: "" };
    case "radio":       return { ...base, label: "Choose one", options: ["Yes", "No"], defaultValue: "" };
    case "checkbox":    return { ...base, label: "I accept the terms", defaultValue: false };
    case "number":      return { ...base, label: "Number", min: "", max: "", step: "1", defaultValue: "" };
    case "temperature": return { ...base, label: "Temperature", unit: "C", min: "", max: "", defaultValue: "" };
    case "image":       return { ...base, label: "Image", src: "", alt: "" };
    case "section":     return { ...base, label: "Section Title", description: "" };
    case "group":       return { ...base, label: "Group", columns: 2 };
    default:            return { ...base, defaultValue: "" };
  }
}

function normalizeSchema(s) {
  if (!s) return { version: 1, fields: [] };
  if (typeof s === "string") { try { return normalizeSchema(JSON.parse(s)); } catch { return { version: 1, fields: [] }; } }
  const fields = s.fields ?? s?.template?.fields ?? s?.template?.schema?.fields ?? [];
  return { version: s.version || 1, fields: Array.isArray(fields) ? fields : [] };
}

function FieldTypeIcon({ type, size = 16 }) {
  const meta = getFieldMeta(type);
  const colors = COLOR_MAP[meta.color] ?? COLOR_MAP.gray;
  const Icon = meta.icon;
  return (
    <span className={"inline-flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 " + colors.bg + " " + colors.icon}>
      <Icon size={size} />
    </span>
  );
}

function TypeBadge({ type }) {
  const meta = getFieldMeta(type);
  const colors = COLOR_MAP[meta.color] ?? COLOR_MAP.gray;
  return (
    <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide " + colors.badge}>
      {type}
    </span>
  );
}

function PaletteCard({ field, onAdd }) {
  const colors = COLOR_MAP[field.color] ?? COLOR_MAP.gray;
  const Icon = field.icon;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-field-type", field.type);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => onAdd(field.type)}
      title={"Add " + field.label}
      className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 cursor-grab active:cursor-grabbing hover:border-transparent hover:shadow-md hover:scale-[1.02] transition-all duration-150 select-none"
    >
      <span className={"inline-flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 " + colors.bg + " " + colors.icon}>
        <Icon size={14} />
      </span>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{field.label}</span>
      <Plus size={12} className="ml-auto opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity" />
    </div>
  );
}

function CanvasCard({ field, index, total, isSelected, onSelect, onMoveUp, onMoveDown, onDuplicate, onDelete }) {
  return (
    <div
      onClick={onSelect}
      className={"relative rounded-xl border transition-all duration-150 cursor-pointer group " +
        (isSelected
          ? "border-primary-500 ring-2 ring-primary-500/25 bg-primary-50/60 dark:bg-primary-900/10 shadow-sm"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm")}
    >
      {isSelected && <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-primary-500" />}
      <div className="flex items-start gap-3 p-3">
        <GripVertical size={16} className="mt-0.5 text-gray-300 dark:text-gray-600 flex-shrink-0 cursor-grab" />
        <FieldTypeIcon type={field.type} size={14} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{field.label || "(no label)"}</span>
            <TypeBadge type={field.type} />
            {field.required && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">required</span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 font-mono truncate">{field.key}</div>
        </div>
        <div className={"flex items-center gap-1 flex-shrink-0 transition-opacity " + (isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={index === 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 disabled:opacity-30 transition-colors">
            <ChevronUp size={14} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={index === total - 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 disabled:opacity-30 transition-colors">
            <ChevronDown size={14} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicate"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
            <Copy size={14} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete"
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {isSelected && (
        <div className="px-4 pb-3">
          <FieldPreviewMini field={field} />
        </div>
      )}
    </div>
  );
}

function FieldPreviewMini({ field }) {
  const base = "w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 pointer-events-none";
  switch (field.type) {
    case "section":
      return (
        <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{field.label}</div>
          {field.description && <div className="text-[11px] text-gray-500 mt-0.5">{field.description}</div>}
        </div>
      );
    case "group":
      return (
        <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-500">
          Group container  {field.columns || 2} columns
        </div>
      );
    case "button":
      return (
        <button type="button" className={"w-full py-1.5 px-4 rounded-lg text-xs font-bold pointer-events-none " +
          (field.variant === "primary" ? "bg-primary-600 text-white" : "border border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-300 bg-transparent")}>
          {field.label}
        </button>
      );
    case "radio":
      return (
        <div className="flex gap-4 flex-wrap">
          {(field.options || []).map((o, i) => (
            <label key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 pointer-events-none">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 inline-flex" />
              {o}
            </label>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 pointer-events-none">
          <span className="w-4 h-4 rounded border-2 border-gray-400" />{field.label}
        </label>
      );
    case "list":
      return <select disabled className={base}><option>{field.placeholder || "Select..."}</option></select>;
    case "image":
      return (
        <div className="h-16 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/30 flex items-center justify-center">
          <ImageIcon size={16} className="text-gray-400" />
        </div>
      );
    default:
      return <input disabled type={field.type === "datetime" ? "datetime-local" : field.type === "temperature" ? "number" : field.type} placeholder={field.placeholder || "Enter value..."} className={base} />;
  }
}

function PropertiesPanel({ field, onChange, onDelete, onDuplicate }) {
  const input = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500/50 transition";
  const lbl = "block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1";

  const setOptionsFromText = (text) => {
    onChange({ options: text.split("\n").map((s) => s.trim()).filter(Boolean) });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <FieldTypeIcon type={field.type} size={14} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{field.label || "(no label)"}</div>
            <TypeBadge type={field.type} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onDuplicate}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition">
            <Copy size={12} />Duplicate
          </button>
          <button type="button" onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-800/50 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition">
            <Trash2 size={12} />Delete
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
        <div>
          <label className={lbl}>Label</label>
          <input className={input} value={field.label || ""} onChange={(e) => onChange({ label: e.target.value })} placeholder="Field label" />
        </div>
        <div>
          <label className={lbl}>Key (API field name)</label>
          <input className={input + " font-mono text-xs"} value={field.key || ""} onChange={(e) => onChange({ key: e.target.value })} placeholder="field_key" />
        </div>
        <div>
          <label className={lbl}>Help Text</label>
          <input className={input} value={field.helpText || ""} onChange={(e) => onChange({ helpText: e.target.value })} placeholder="Shown below the field" />
        </div>
        {!["checkbox", "button", "section", "group", "radio", "image"].includes(field.type) && (
          <div>
            <label className={lbl}>Placeholder</label>
            <input className={input} value={field.placeholder || ""} onChange={(e) => onChange({ placeholder: e.target.value })} placeholder="Placeholder text" />
          </div>
        )}
        {!["section", "group", "button"].includes(field.type) && (
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={!!field.required} onChange={(e) => onChange({ required: e.target.checked })} />
              <div className="w-9 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Required field</span>
          </label>
        )}
        {field.type === "button" && (
          <div>
            <label className={lbl}>Variant</label>
            <select className={input} value={field.variant || "primary"} onChange={(e) => onChange({ variant: e.target.value })}>
              <option value="primary">Primary (filled)</option>
              <option value="outline">Outline</option>
            </select>
          </div>
        )}
        {(field.type === "list" || field.type === "radio") && (
          <div>
            <label className={lbl}>Options (one per line)</label>
            <textarea rows={5} className={input + " font-mono resize-none"}
              value={(field.options || []).join("\n")}
              onChange={(e) => setOptionsFromText(e.target.value)}
              placeholder={"Option 1\nOption 2\nOption 3"} />
            <div className="mt-1 text-xs text-gray-400">{(field.options || []).length} options</div>
          </div>
        )}
        {field.type === "number" && (
          <div className="grid grid-cols-3 gap-2">
            {[["Min","min"],["Max","max"],["Step","step"]].map(([l,k]) => (
              <div key={k}>
                <label className={lbl}>{l}</label>
                <input className={input} type="number" value={field[k] ?? ""} onChange={(e) => onChange({ [k]: e.target.value })} />
              </div>
            ))}
          </div>
        )}
        {field.type === "temperature" && (
          <div className="space-y-3">
            <div>
              <label className={lbl}>Unit</label>
              <select className={input} value={field.unit || "C"} onChange={(e) => onChange({ unit: e.target.value })}>
                <option value="C">Celsius</option>
                <option value="F">Fahrenheit</option>
                <option value="K">Kelvin</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[["Min","min"],["Max","max"]].map(([l,k]) => (
                <div key={k}>
                  <label className={lbl}>{l}</label>
                  <input className={input} type="number" value={field[k] ?? ""} onChange={(e) => onChange({ [k]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>
        )}
        {field.type === "image" && (
          <div className="space-y-3">
            <div>
              <label className={lbl}>Image URL (src)</label>
              <input className={input} value={field.src || ""} onChange={(e) => onChange({ src: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className={lbl}>Alt Text</label>
              <input className={input} value={field.alt || ""} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Image description" />
            </div>
          </div>
        )}
        {field.type === "section" && (
          <div>
            <label className={lbl}>Description</label>
            <textarea rows={3} className={input + " resize-none"} value={field.description || ""}
              onChange={(e) => onChange({ description: e.target.value })} placeholder="Optional section description" />
          </div>
        )}
        {field.type === "group" && (
          <div>
            <label className={lbl}>Column Count (1-6)</label>
            <div className="flex gap-2 mt-1">
              {[1,2,3,4,6].map((n) => (
                <button key={n} type="button" onClick={() => onChange({ columns: n })}
                  className={"flex-1 py-2 rounded-lg text-sm font-bold border transition " +
                    ((field.columns ?? 2) === n
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-400")}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JsonPreview({ schema }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(schema, null, 2);
  const copy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <div className="relative h-full flex flex-col overflow-hidden rounded-xl border border-gray-700">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900 dark:bg-gray-950 border-b border-gray-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-gray-400 font-mono">schema.json</span>
        <button type="button" onClick={copy} className="text-xs text-gray-400 hover:text-white transition font-medium">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-4 bg-gray-900 dark:bg-gray-950 text-green-400 text-xs font-mono leading-relaxed min-h-[400px]">{text}</pre>
    </div>
  );
}

export default function TemplateBuilder({ initialSchema, onChange }) {
  const normalized = useMemo(() => normalizeSchema(initialSchema), [initialSchema]);
  const [items, setItems] = useState(normalized.fields);
  const [selectedId, setSelectedId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("canvas");

  const selected = useMemo(() => items.find((x) => x.id === selectedId) ?? null, [items, selectedId]);

  useEffect(() => {
    const n = normalizeSchema(initialSchema);
    setItems(n.fields);
    setSelectedId(n.fields[0]?.id ?? null);
  }, [initialSchema]);

  useEffect(() => {
    onChange?.({ version: 1, fields: items });
  }, [items, onChange]);

  const addField = useCallback((type) => {
    const f = defaultField(type);
    setItems((prev) => [...prev, f]);
    setSelectedId(f.id);
    setActiveTab("canvas");
  }, []);

  const updateSelected = useCallback((patch) => {
    if (!selectedId) return;
    setItems((prev) => prev.map((x) => (x.id === selectedId ? { ...x, ...patch } : x)));
  }, [selectedId]);

  const deleteField = useCallback((id) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      return next;
    });
    setSelectedId((prev) => {
      if (prev !== id) return prev;
      const remaining = items.filter((x) => x.id !== id);
      return remaining[0]?.id ?? null;
    });
  }, [items]);

  const duplicateField = useCallback((id) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) return prev;
      const clone = { ...prev[idx], id: uid(), key: prev[idx].key + "_copy" };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }, []);

  const moveField = useCallback((id, dir) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) return prev;
      const to = dir === "up" ? idx - 1 : idx + 1;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  }, []);

  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setIsDragOver(true); };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e) => { e.preventDefault(); setIsDragOver(false); const type = e.dataTransfer.getData("application/x-field-type"); if (type) addField(type); };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow">
            <Wand2 size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-sm">Template Builder</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {items.length} field{items.length !== 1 ? "s" : ""} &bull; drag &amp; drop or click to add
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {[{ key: "canvas", Icon: Eye, label: "Canvas" }, { key: "json", Icon: Code2, label: "JSON" }].map(({ key, Icon, label }) => (
              <button key={key} type="button" onClick={() => setActiveTab(key)}
                className={"flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition " +
                  (activeTab === key ? "bg-primary-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700")}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setItems([]); setSelectedId(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition">
            <X size={12} />Reset
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_290px] min-h-[560px]">
        {/* Palette */}
        <aside className="border-r border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/20 overflow-auto">
          <div className="p-3 space-y-4">
            {FIELD_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <div className="px-1 mb-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{cat.label}</div>
                <div className="grid grid-cols-1 gap-1.5">
                  {cat.fields.map((f) => <PaletteCard key={f.type} field={f} onAdd={addField} />)}
                </div>
              </div>
            ))}
            <div className="p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
              <SquareMousePointer size={14} className="mx-auto mb-1 opacity-50" />
              Drag to canvas or click to add
            </div>
          </div>
        </aside>

        {/* Canvas / JSON */}
        <div className="flex flex-col overflow-hidden">
          {activeTab === "json" ? (
            <div className="flex-1 p-3"><JsonPreview schema={{ version: 1, fields: items }} /></div>
          ) : (
            <div
              className={"flex-1 p-3 overflow-auto transition-all " + (isDragOver ? "bg-primary-50/60 dark:bg-primary-900/10" : "bg-white dark:bg-gray-800")}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            >
              {items.length === 0 ? (
                <div className={"h-full min-h-[420px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors " +
                  (isDragOver ? "border-primary-400 bg-primary-50/50 dark:bg-primary-900/10" : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10")}>
                  <div className={"w-14 h-14 rounded-2xl flex items-center justify-center transition-colors " + (isDragOver ? "bg-primary-100 dark:bg-primary-900/30" : "bg-gray-100 dark:bg-gray-700")}>
                    <Plus size={24} className={isDragOver ? "text-primary-600" : "text-gray-400"} />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{isDragOver ? "Release to add field" : "Drop fields here"}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Drag from the panel or click any field type</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {isDragOver && (
                    <div className="h-12 rounded-xl border-2 border-dashed border-primary-400 bg-primary-50/60 dark:bg-primary-900/10 flex items-center justify-center text-xs text-primary-600 font-semibold">
                      Drop here to add
                    </div>
                  )}
                  {items.map((item, idx) => (
                    <CanvasCard
                      key={item.id} field={item} index={idx} total={items.length}
                      isSelected={item.id === selectedId}
                      onSelect={() => setSelectedId(item.id === selectedId ? null : item.id)}
                      onMoveUp={() => moveField(item.id, "up")}
                      onMoveDown={() => moveField(item.id, "down")}
                      onDuplicate={() => duplicateField(item.id)}
                      onDelete={() => deleteField(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Properties */}
        <aside className="border-l border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/20 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Settings size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Properties</span>
          </div>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                <AlertCircle size={20} className="text-gray-400" />
              </div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">No field selected</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click a field on the canvas to edit its properties</div>
            </div>
          ) : (
            <PropertiesPanel field={selected} onChange={updateSelected} onDelete={() => deleteField(selected.id)} onDuplicate={() => duplicateField(selected.id)} />
          )}
        </aside>
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="px-5 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/10 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <span><strong className="text-gray-700 dark:text-gray-300">{items.length}</strong> fields</span>
          <span><strong className="text-gray-700 dark:text-gray-300">{items.filter((x) => x.required).length}</strong> required</span>
          {FIELD_TYPES_FLAT.map((f) => {
            const count = items.filter((x) => x.type === f.type).length;
            if (!count) return null;
            return <span key={f.type}>{count} {f.label.toLowerCase()}</span>;
          })}
        </div>
      )}
    </div>
  );
}
