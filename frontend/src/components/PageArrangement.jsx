import React, { useState, useEffect, useRef } from 'react';
import { GripVertical, ChevronDown, ChevronUp, Trash2, Plus, FolderOpen } from 'lucide-react';

const PageArrangement = ({ pages, value = [], onChange }) => {
  const [pagesWithOrder, setPagesWithOrder] = useState(value || []);
  const [expandedPages, setExpandedPages] = useState(new Set());
  const [showCatInput, setShowCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const catInputRef = useRef(null);
  const isInternalUpdate = useRef(false);
  const prevValueRef = useRef(null);

  // Log on mount and when value changes
  useEffect(() => {
    console.log('🎨 PageArrangement mounted/updated, value prop:', value, 'Length:', value?.length);
    console.log('🎨 Current pagesWithOrder state:', pagesWithOrder, 'Length:', pagesWithOrder?.length);
  });

  useEffect(() => {
    // Only update if value actually changed and it's not from our own onChange
    const valueChanged = prevValueRef.current === null || JSON.stringify(prevValueRef.current) !== JSON.stringify(value);
    
    console.log('🔄 PageArrangement value effect triggered');
    console.log('   - isInternalUpdate:', isInternalUpdate.current);
    console.log('   - valueChanged:', valueChanged);
    console.log('   - value length:', value?.length);
    console.log('   - prevValueRef:', prevValueRef.current);
    
    if (!isInternalUpdate.current && valueChanged) {
      console.log('📦 PageArrangement value changed externally:', value);
      if (value && value.length > 0) {
        console.log('✅ Setting pagesWithOrder with', value.length, 'pages');
        setPagesWithOrder(value);
      } else {
        console.log('⚠️ Value is empty, resetting to empty array');
        setPagesWithOrder([]);
      }
      prevValueRef.current = value;
    }
    
    // Reset the flag after processing
    isInternalUpdate.current = false;
  }, [value]);

  const getAvailablePages = () => {
    const selectedPageIds = pagesWithOrder.map(p => p.page_id);
    return pages.filter(page => !selectedPageIds.includes(page.id));
  };

  const addPage = (pageId, parentPageId = null) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    const newPage = {
      page_id: pageId,
      name: page.name,
      url: page.url,
      icon: page.icon,
      parent_page_id: parentPageId,
      display_order: pagesWithOrder.filter(p => p.parent_page_id === parentPageId).length,
    };

    const updated = [...pagesWithOrder, newPage];
    setPagesWithOrder(updated);
    isInternalUpdate.current = true;
    onChange(updated);
  };

  const removePage = (pageId) => {
    // Remove the page and all its children
    const updated = pagesWithOrder.filter(p => 
      p.page_id !== pageId && p.parent_page_id !== pageId
    );
    
    // Reorder remaining pages
    const reordered = updated.map((page, index) => ({
      ...page,
      display_order: index,
    }));
    
    setPagesWithOrder(reordered);
    isInternalUpdate.current = true;
    onChange(reordered);
  };

  const moveUp = (pageId) => {
    const index = pagesWithOrder.findIndex(p => p.page_id === pageId);
    if (index <= 0) return;

    const page = pagesWithOrder[index];
    const siblings = pagesWithOrder.filter(p => p.parent_page_id === page.parent_page_id);
    const siblingIndex = siblings.findIndex(p => p.page_id === pageId);
    
    if (siblingIndex <= 0) return;

    const updated = [...pagesWithOrder];
    const prevSibling = siblings[siblingIndex - 1];
    
    // Swap display orders
    const pageIndex = updated.findIndex(p => p.page_id === pageId);
    const prevIndex = updated.findIndex(p => p.page_id === prevSibling.page_id);
    
    const temp = updated[pageIndex].display_order;
    updated[pageIndex].display_order = updated[prevIndex].display_order;
    updated[prevIndex].display_order = temp;
    
    // Sort by display_order
    updated.sort((a, b) => a.display_order - b.display_order);
    
    setPagesWithOrder(updated);
    isInternalUpdate.current = true;
    onChange(updated);
  };

  const moveDown = (pageId) => {
    const page = pagesWithOrder.find(p => p.page_id === pageId);
    if (!page) return;

    const siblings = pagesWithOrder.filter(p => p.parent_page_id === page.parent_page_id);
    const siblingIndex = siblings.findIndex(p => p.page_id === pageId);
    
    if (siblingIndex >= siblings.length - 1) return;

    const updated = [...pagesWithOrder];
    const nextSibling = siblings[siblingIndex + 1];
    
    // Swap display orders
    const pageIndex = updated.findIndex(p => p.page_id === pageId);
    const nextIndex = updated.findIndex(p => p.page_id === nextSibling.page_id);
    
    const temp = updated[pageIndex].display_order;
    updated[pageIndex].display_order = updated[nextIndex].display_order;
    updated[nextIndex].display_order = temp;
    
    // Sort by display_order
    updated.sort((a, b) => a.display_order - b.display_order);
    
    setPagesWithOrder(updated);
    isInternalUpdate.current = true;
    onChange(updated);
  };

  const makeSubmenu = (pageId, newParentId) => {
    const updated = pagesWithOrder.map(p => {
      if (p.page_id === pageId) {
        return {
          ...p,
          parent_page_id: newParentId,
          display_order: pagesWithOrder.filter(
            pg => pg.parent_page_id === newParentId
          ).length,
        };
      }
      return p;
    });

    setPagesWithOrder(updated);    isInternalUpdate.current = true;
    onChange(updated);
  };

  const makeMainMenu = (pageId) => {
    makeSubmenu(pageId, null);
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    const catId = `cat_${Date.now()}`;
    const newCat = {
      page_id: catId,
      name,
      url: null,
      icon: null,
      is_category: true,
      parent_page_id: null,
      display_order: pagesWithOrder.filter(p => p.parent_page_id === null).length,
    };
    const updated = [...pagesWithOrder, newCat];
    setExpandedPages(prev => new Set([...prev, catId]));
    setPagesWithOrder(updated);
    isInternalUpdate.current = true;
    onChange(updated);
    setNewCatName('');
    setShowCatInput(false);
  };

  const renameHeader = (pageId, newLabel) => {
    const updated = pagesWithOrder.map(p =>
      p.page_id === pageId ? { ...p, name: newLabel } : p
    );
    setPagesWithOrder(updated);
    isInternalUpdate.current = true;
    onChange(updated);
  };

  const toggleExpanded = (pageId) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const renderPage = (page, depth = 0) => {
    const children = pagesWithOrder.filter(p => p.parent_page_id === page.page_id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedPages.has(page.page_id);
    const isCategory = !!page.is_category;
    const isMainHeader = depth === 0;

    return (
      <div key={page.page_id} className="mb-2">
        <div
          className={`flex items-center gap-2 p-2 rounded border group transition-colors ${
            isMainHeader
              ? isCategory
                ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600 hover:bg-indigo-200 dark:hover:bg-indigo-900/60'
                : 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 hover:bg-gray-300 dark:hover:bg-gray-500'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Expand/Collapse button — always visible for main headers (depth 0) */}
          {(hasChildren || depth === 0) ? (
            <button
              type="button"
              onClick={() => toggleExpanded(page.page_id)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Drag handle (visual only for now) */}
          <GripVertical className="h-4 w-4 text-gray-400" />

          {/* Page info */}
          <div className="flex-1 min-w-0">
            {isMainHeader ? (
              /* Editable header input for main pages / categories */
              <div className="flex items-center gap-1.5">
                {isCategory && <FolderOpen className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                <input
                  type="text"
                  value={page.name}
                  onChange={(e) => renameHeader(page.page_id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Category label…"
                  className={`w-full text-sm font-bold uppercase tracking-wide bg-transparent border-b border-dashed focus:outline-none placeholder-gray-400 ${
                    isCategory
                      ? 'text-indigo-700 dark:text-indigo-300 border-indigo-400 focus:border-indigo-600'
                      : 'text-gray-800 dark:text-gray-100 border-gray-400 focus:border-blue-500'
                  }`}
                />
                {isCategory && (
                  <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 font-semibold">
                    Category
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {page.name}
                </span>
                {page.parent_page_id && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    Sub-page
                  </span>
                )}
              </div>
            )}
            {depth > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{page.url}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Move up/down */}
            <button
              type="button"
              onClick={() => moveUp(page.page_id)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
              title="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveDown(page.page_id)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
              title="Move down"
            >
              ↓
            </button>



            {/* Remove button */}
            <button
              type="button"
              onClick={() => removePage(page.page_id)}
              className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
              title="Remove"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Render children + inline add-sub-page for main headers */}
        {depth === 0 && isExpanded && (
          <div className="mt-1 ml-3 border-l-2 border-gray-300 dark:border-gray-600 pl-2">
            {children
              .sort((a, b) => a.display_order - b.display_order)
              .map(child => renderPage(child, depth + 1))}

            {/* Inline sub-page selector */}
            {(() => {
              const subAvailable = pages.filter(
                pg => !pagesWithOrder.some(p => p.page_id === pg.id)
              );
              return subAvailable.length > 0 ? (
                <div className="flex items-center gap-2 mt-1 py-1">
                  <Plus className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addPage(parseInt(e.target.value), page.page_id);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 text-xs px-2 py-1 border border-dashed border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">+ Add sub-page here…</option>
                    {subAvailable.map(pg => (
                      <option key={pg.id} value={pg.id}>
                        {pg.name} ({pg.url})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Non-main (deeper) children render normally */}
        {depth > 0 && hasChildren && isExpanded && (
          <div className="mt-1">
            {children
              .sort((a, b) => a.display_order - b.display_order)
              .map(child => renderPage(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const mainPages = pagesWithOrder
    .filter(p => p.parent_page_id === null)
    .sort((a, b) => a.display_order - b.display_order);

  const availablePages = getAvailablePages();
  const hasCategories = pagesWithOrder.some(p => p.is_category);

  return (
    <div className="space-y-4">
      {/* Toolbar: Add Category only */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Categories
        </label>

        {/* Add Category button / inline input */}
        {!showCatInput ? (
          <button
            type="button"
            onClick={() => {
              setShowCatInput(true);
              setTimeout(() => catInputRef.current?.focus(), 50);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            Add Category
          </button>
        ) : (
          <div className="flex gap-2 items-center p-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30">
            <FolderOpen className="h-4 w-4 text-indigo-500 shrink-0" />
            <input
              ref={catInputRef}
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCategory();
                if (e.key === 'Escape') { setShowCatInput(false); setNewCatName(''); }
              }}
              placeholder="Category name (e.g. Reports, Tools…)"
              className="flex-1 text-sm px-2 py-1 rounded border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addCategory}
              disabled={!newCatName.trim()}
              className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => { setShowCatInput(false); setNewCatName(''); }}
              className="px-2 py-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {!hasCategories && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span>⚠</span> Create a category first — pages can only be added inside a category.
          </p>
        )}
      </div>

      {/* Page List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Arrange & Organize Pages
        </label>
        
        {pagesWithOrder.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <FolderOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No categories yet.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Start by clicking <strong>Add Category</strong>, then add pages inside it.
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 max-h-96 overflow-y-auto">
            {mainPages.map(page => renderPage(page))}
          </div>
        )}

        {pagesWithOrder.length > 0 && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Tips:</strong> Use ↑↓ to reorder categories • Expand a category (▼) then use its dropdown to add pages inside • Use ↑↓ on pages to reorder within a category
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageArrangement;
