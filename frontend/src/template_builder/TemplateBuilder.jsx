import React, { useEffect, useMemo, useState, useRef } from "react";

const FIELD_TYPES = [
  { type: "button", label: "Button" },
  { type: "text", label: "Text" },
  { type: "number", label: "Number" },
  { type: "date", label: "Date" },
  { type: "list", label: "List" },
  { type: "datetime", label: "Date Time" },
  { type: "radio", label: "Radio" },
  { type: "temperature", label: "Temperature" },
  { type: "checkbox", label: "Checkbox" },
  { type: "image", label: "Image" },
  { type: "section", label: "Section" },
  { type: "group", label: "Group" },
];

function uid() {
  return "f_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function defaultField(type) {
  const base = {
    id: uid(),
    type,
    key: `${type}_${Math.random().toString(16).slice(2, 6)}`,
    label: type[0].toUpperCase() + type.slice(1),
    required: false,
    helpText: "",
    placeholder: "",
  };

  switch (type) {
    case "button":
      return { ...base, label: "Submit", variant: "primary" };
    case "list":
      return { ...base, label: "Select", options: ["Option 1", "Option 2"], defaultValue: "" };
    case "radio":
      return { ...base, label: "Choose one", options: ["Yes", "No"], defaultValue: "" };
    case "checkbox":
      return { ...base, label: "Accept", defaultValue: false };
    case "number":
      return { ...base, min: "", max: "", step: "1", defaultValue: "" };
    case "temperature":
      return { ...base, unit: "°C", min: "", max: "", defaultValue: "" };
    case "image":
      return { ...base, label: "Image", src: "", alt: "" };
    case "section":
      return { ...base, label: "Section Title", description: "" };
    case "group":
      return { ...base, label: "Group", columns: 2 };
    default:
      return { ...base, defaultValue: "" };
  }
}

function normalizeSchema(initialSchema) {
  if (!initialSchema) return { version: 1, fields: [] };

  // if string json
  if (typeof initialSchema === "string") {
    try {
      return normalizeSchema(JSON.parse(initialSchema));
    } catch {
      return { version: 1, fields: [] };
    }
  }

  // accepted shapes:
  // {version, fields:[...]}
  // {template:{fields:[...]}}
  // {fields:[...]}
  const fields =
    initialSchema.fields ||
    initialSchema?.template?.fields ||
    initialSchema?.template?.schema?.fields ||
    [];

  return {
    version: initialSchema.version || 1,
    fields: Array.isArray(fields) ? fields : [],
  };
}

function FieldIcon({ type }) {
  const map = {
    button: "⭘",
    text: "T",
    number: "123",
    date: "📅",
    list: "▾",
    datetime: "🕘",
    radio: "◉",
    temperature: "🌡️",
    checkbox: "☑",
    image: "🖼️",
    section: "▦",
    group: "▧",
  };
  return (
    <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs font-bold">
      {map[type] ?? "•"}
    </span>
  );
}

export default function TemplateBuilder({ initialSchema, onChange }) {
  const normalized = useMemo(() => normalizeSchema(initialSchema), [initialSchema]);

  const [items, setItems] = useState(normalized.fields);
  const [selectedId, setSelectedId] = useState(normalized.fields?.[0]?.id ?? null);

  const selected = useMemo(
    () => items.find((x) => x.id === selectedId) || null,
    [items, selectedId]
  );

  // update local when initialSchema changes (edit mode)
  useEffect(() => {
    const n = normalizeSchema(initialSchema);
    setItems(n.fields);
    setSelectedId(n.fields?.[0]?.id ?? null);
  }, [initialSchema]);

  // emit schema to parent
  useEffect(() => {
    const schema = { version: 1, fields: items };
    onChange?.(schema);
  }, [items, onChange]);

  const onDragStartPalette = (e, type) => {
    e.dataTransfer.setData("application/x-field-type", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const onDragOverCanvas = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const onDropCanvas = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/x-field-type");
    if (!type) return;
    const newField = defaultField(type);
    setItems((prev) => [...prev, newField]);
    setSelectedId(newField.id);
  };

  const onFieldClick = (fieldId) => {
    setSelectedId(fieldId);
  };

  const updateSelected = (patch) => {
    if (!selected) return;
    setItems((prev) => prev.map((x) => (x.id === selected.id ? { ...x, ...patch } : x)));
  };

  const removeSelected = () => {
    if (!selected) return;
    setItems((prev) => prev.filter((x) => x.id !== selected.id));
    setSelectedId(null);
  };

  const moveSelected = (dir) => {
    if (!selected) return;
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === selected.id);
      if (idx === -1) return prev;
      const next = [...prev];
      const to = dir === "up" ? idx - 1 : idx + 1;
      if (to < 0 || to >= next.length) return prev;
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <div className="text-sm font-extrabold text-gray-900 dark:text-white">Template Builder</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Drag fields → drop on canvas → edit properties
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setItems([]);
            setSelectedId(null);
          }}
          className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-3 p-3">
        {/* Palette */}
        <aside className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-xs font-extrabold text-gray-700 dark:text-gray-200">
            Basic Fields
          </div>

          <div className="p-3 grid grid-cols-2 gap-2">
            {FIELD_TYPES.map((f) => (
              <div
                key={f.type}
                draggable
                onDragStart={(e) => onDragStartPalette(e, f.type)}
                className="cursor-grab select-none rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 flex items-center gap-2 hover:shadow-sm"
                title="Drag to canvas"
              >
                <FieldIcon type={f.type} />
                <div className="text-xs font-bold text-gray-900 dark:text-white">{f.label}</div>
              </div>
            ))}
          </div>

          <div className="m-3 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 text-xs text-gray-600 dark:text-gray-300">
            Tip: After dropping a field, edit its label and options from the right panel.
          </div>
        </aside>

        {/* Canvas */}
        <main className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-xs font-extrabold text-gray-700 dark:text-gray-200">
            Canvas
          </div>

          <div
            className="p-3 min-h-[520px] overflow-auto"
            onDragOver={onDragOverCanvas}
            onDrop={onDropCanvas}
            role="region"
            aria-label="Canvas"
          >
            {items.length === 0 ? (
              <div className="h-56 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center flex-col gap-2">
                <div className="text-sm font-extrabold text-gray-900 dark:text-white">Drop fields here</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Drag from the left panel and drop here</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((it, idx) => {
                  const active = it.id === selectedId;
                  return (
                    <div
                      key={it.id}
                      onClick={() => setSelectedId(it.id)}
                      className={[
                        "rounded-2xl border p-3 cursor-pointer transition",
                        active
                          ? "border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/40 dark:bg-primary-900/10"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <FieldIcon type={it.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-extrabold text-gray-900 dark:text-white truncate">
                              {it.label || "(no label)"}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{it.type}</span>
                            {it.required && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                required
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            key: <span className="font-mono">{it.key}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-40"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSelected("up");
                            }}
                            disabled={idx === 0}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-40"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSelected("down");
                            }}
                            disabled={idx === items.length - 1}
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <FieldPreview field={it} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Properties */}
        <aside className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-xs font-extrabold text-gray-700 dark:text-gray-200">
            Properties
          </div>

          <div className="p-3">
            {!selected ? (
              <div className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 text-xs text-gray-600 dark:text-gray-300">
                Select a field from the canvas to edit its properties.
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-extrabold text-red-600 dark:text-red-400"
                    onClick={removeSelected}
                  >
                    Delete
                  </button>

                  <button
                    type="button"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-extrabold text-gray-900 dark:text-white"
                    onClick={() => {
                      const clone = { ...selected, id: uid(), key: selected.key + "_copy" };
                      setItems((prev) => {
                        const idx = prev.findIndex((x) => x.id === selected.id);
                        const next = [...prev];
                        next.splice(idx + 1, 0, clone);
                        return next;
                      });
                      setSelectedId(clone.id);
                    }}
                  >
                    Duplicate
                  </button>
                </div>

                <FieldProperties field={selected} onChange={updateSelected} />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function FieldPreview({ field }) {
  const common =
    "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none";

  const labelRow = (
    <div className="mb-2 flex items-baseline gap-2">
      <div className="text-xs font-extrabold text-gray-900 dark:text-white">{field.label}</div>
      {field.required && <span className="text-xs font-bold text-red-600">*</span>}
      {field.helpText ? <div className="text-xs text-gray-500 dark:text-gray-400">{field.helpText}</div> : null}
    </div>
  );

  switch (field.type) {
    case "section":
      return (
        <div className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
          <div className="text-sm font-extrabold text-gray-900 dark:text-white">{field.label}</div>
          {field.description ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.description}</div> : null}
        </div>
      );

    case "group":
      return (
        <div className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
          <div className="text-xs font-extrabold text-gray-900 dark:text-white">{field.label}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Group container (columns: {field.columns || 2})</div>
        </div>
      );

    case "button":
      return (
        <button
          type="button"
          className={[
            "w-full px-4 py-2 rounded-2xl font-extrabold border",
            field.variant === "primary"
              ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
              : "bg-white text-gray-900 border-gray-900 dark:bg-gray-800 dark:text-white dark:border-white",
          ].join(" ")}
        >
          {field.label || "Button"}
        </button>
      );

    case "radio":
      return (
        <div>
          {labelRow}
          <div className="flex gap-4 flex-wrap text-sm text-gray-700 dark:text-gray-200">
            {(field.options || []).map((o, i) => (
              <label key={i} className="flex items-center gap-2">
                <input type="radio" disabled />
                {o}
              </label>
            ))}
          </div>
        </div>
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled />
          <span className="text-xs font-extrabold text-gray-900 dark:text-white">{field.label}</span>
        </label>
      );

    case "list":
      return (
        <div>
          {labelRow}
          <select className={common} disabled>
            <option value="">{field.placeholder || "Select..."}</option>
            {(field.options || []).map((o, i) => (
              <option key={i} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      );

    case "image":
      return (
        <div>
          {labelRow}
          <div className="h-32 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 font-bold">
            {field.src ? "Image set" : "Image placeholder"}
          </div>
        </div>
      );

    default: {
      const type =
        field.type === "datetime" ? "datetime-local" : field.type === "temperature" ? "number" : field.type;
      return (
        <div>
          {labelRow}
          <input type={type} placeholder={field.placeholder || ""} className={common} disabled />
          {field.type === "temperature" ? (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Unit: {field.unit || "°C"}</div>
          ) : null}
        </div>
      );
    }
  }
}

function FieldProperties({ field, onChange }) {
  const input =
    "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-sm";

  const label = "text-xs font-extrabold text-gray-700 dark:text-gray-200";

  const setOptionsFromText = (text) => {
    const arr = text.split("\n").map((s) => s.trim()).filter(Boolean);
    onChange({ options: arr });
  };

  return (
    <div className="space-y-3">
      <div>
        <div className={label}>Type</div>
        <div className="text-sm font-extrabold text-gray-900 dark:text-white">{field.type}</div>
      </div>

      <div>
        <div className={label}>Label</div>
        <input className={input} value={field.label || ""} onChange={(e) => onChange({ label: e.target.value })} />
      </div>

      <div>
        <div className={label}>Key (API field name)</div>
        <input className={input} value={field.key || ""} onChange={(e) => onChange({ key: e.target.value })} />
      </div>

      <div>
        <div className={label}>Help Text</div>
        <input className={input} value={field.helpText || ""} onChange={(e) => onChange({ helpText: e.target.value })} />
      </div>

      {field.type !== "checkbox" && field.type !== "button" && field.type !== "section" && field.type !== "group" && (
        <div>
          <div className={label}>Placeholder</div>
          <input className={input} value={field.placeholder || ""} onChange={(e) => onChange({ placeholder: e.target.value })} />
        </div>
      )}

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={!!field.required} onChange={(e) => onChange({ required: e.target.checked })} />
        <span className="text-sm font-extrabold text-gray-900 dark:text-white">Required</span>
      </label>

      {field.type === "button" && (
        <div>
          <div className={label}>Variant</div>
          <select className={input} value={field.variant || "primary"} onChange={(e) => onChange({ variant: e.target.value })}>
            <option value="primary">Primary</option>
            <option value="outline">Outline</option>
          </select>
        </div>
      )}

      {(field.type === "list" || field.type === "radio") && (
        <div>
          <div className={label}>Options (one per line)</div>
          <textarea
            className={input + " min-h-[120px] font-mono"}
            value={(field.options || []).join("\n")}
            onChange={(e) => setOptionsFromText(e.target.value)}
          />
        </div>
      )}

      {field.type === "number" && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className={label}>Min</div>
            <input className={input} value={field.min ?? ""} onChange={(e) => onChange({ min: e.target.value })} />
          </div>
          <div>
            <div className={label}>Max</div>
            <input className={input} value={field.max ?? ""} onChange={(e) => onChange({ max: e.target.value })} />
          </div>
          <div>
            <div className={label}>Step</div>
            <input className={input} value={field.step ?? "1"} onChange={(e) => onChange({ step: e.target.value })} />
          </div>
        </div>
      )}

      {field.type === "temperature" && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className={label}>Unit</div>
            <select className={input} value={field.unit || "°C"} onChange={(e) => onChange({ unit: e.target.value })}>
              <option value="°C">°C</option>
              <option value="°F">°F</option>
              <option value="K">K</option>
            </select>
          </div>
          <div>
            <div className={label}>Min</div>
            <input className={input} value={field.min ?? ""} onChange={(e) => onChange({ min: e.target.value })} />
          </div>
          <div>
            <div className={label}>Max</div>
            <input className={input} value={field.max ?? ""} onChange={(e) => onChange({ max: e.target.value })} />
          </div>
        </div>
      )}

      {field.type === "image" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className={label}>Image URL (src)</div>
            <input className={input} value={field.src || ""} onChange={(e) => onChange({ src: e.target.value })} />
          </div>
          <div>
            <div className={label}>Alt Text</div>
            <input className={input} value={field.alt || ""} onChange={(e) => onChange({ alt: e.target.value })} />
          </div>
        </div>
      )}

      {field.type === "section" && (
        <div>
          <div className={label}>Description</div>
          <textarea
            className={input + " min-h-[90px]"}
            value={field.description || ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
      )}

      {field.type === "group" && (
        <div>
          <div className={label}>Columns</div>
          <input
            className={input}
            type="number"
            min="1"
            max="6"
            value={field.columns ?? 2}
            onChange={(e) => onChange({ columns: Number(e.target.value || 2) })}
          />
        </div>
      )}
    </div>
  );
}