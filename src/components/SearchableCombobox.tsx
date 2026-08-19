import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Plus, Check, X } from 'lucide-react';

export interface ComboboxItem {
  id: string;
  label: string;
  subtext?: string;
  badge?: string;
}

interface SearchableComboboxProps {
  label?: string;
  placeholder?: string;
  items: ComboboxItem[];
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  allowAddNew?: boolean;
  addNewLabel?: string;
  onAddNew?: () => void;
  className?: string;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  label,
  placeholder = 'Select an item...',
  items,
  value,
  onChange,
  required = false,
  disabled = false,
  allowAddNew = false,
  addNewLabel = '+ Add New',
  onAddNew,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find(i => i.id === value);

  const filteredItems = items.filter(item => {
    const q = search.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      (item.subtext && item.subtext.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (itemId: string) => {
    onChange(itemId);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[highlightIndex]) {
        handleSelect(filteredItems[highlightIndex].id);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        className={`w-full min-h-[42px] px-3 py-2 bg-white border rounded-lg text-sm flex items-center justify-between gap-2 cursor-pointer transition-all duration-150 ${
          disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed border-slate-200' : ''
        } ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-slate-400'}`}
      >
        <div className="flex-1 truncate">
          {selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-slate-900 truncate">{selectedItem.label}</span>
              {selectedItem.subtext && (
                <span className="text-xs text-slate-500 truncate">({selectedItem.subtext})</span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {selectedItem && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-600 rounded-full hover:bg-slate-100"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </div>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in duration-150">
          {/* Search Bar Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setHighlightIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type to filter list..."
              className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List Items */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const isSelected = item.id === value;
                const isHighlighted = index === highlightIndex;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    onMouseEnter={() => setHighlightIndex(index)}
                    className={`px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 font-semibold text-indigo-900'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{item.label}</span>
                      {item.subtext && <span className="text-xs text-slate-500 font-normal truncate">{item.subtext}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-full bg-slate-100 text-slate-600">
                          {item.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-slate-500 text-center italic">
                No matching records found
              </div>
            )}
          </div>

          {/* Optional Add New Button */}
          {allowAddNew && onAddNew && (
            <div className="p-2 border-t border-slate-100 bg-indigo-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                className="w-full px-3 py-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100/60 rounded-md flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {addNewLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
