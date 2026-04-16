'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[] | string[];
  label?: string;
  required?: boolean;
  placeholder?: string;
  allowCustom?: boolean;
  customLabel?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  label,
  required,
  placeholder,
  allowCustom = false,
  customLabel = 'Other (type below)',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect if current value is custom (not in options list)
  const isValueCustom = value !== '' && !options.includes(value);

  useEffect(() => {
    if (isValueCustom && allowCustom) {
      setIsCustomMode(true);
      setCustomValue(value);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isCustomMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCustomMode]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setIsCustomMode(false);
    setCustomValue('');
  };

  const handleCustomSelect = () => {
    setIsCustomMode(true);
    setIsOpen(false);
    setCustomValue(isValueCustom ? value : '');
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
    }
  };

  const displayValue = isCustomMode
    ? customValue || placeholder || 'Type a value...'
    : value || placeholder || 'Select...';

  return (
    <div ref={wrapperRef} className="relative">
      {isCustomMode && allowCustom ? (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value);
              onChange(e.target.value);
            }}
            onBlur={handleCustomSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCustomSubmit();
              }
            }}
            placeholder="Type brand name..."
            className="flex-1 bg-white/5 border border-accent/50 px-4 py-3 text-sm focus:border-accent outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(false);
              setCustomValue('');
              onChange(options[0] as string);
            }}
            className="px-3 py-3 bg-white/5 border border-white/10 text-white/40 hover:text-white text-xs uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-left focus:border-accent outline-none transition-colors flex items-center justify-between"
        >
          <span className={value ? 'text-white' : 'text-white/40'}>{displayValue}</span>
          <ChevronDown
            size={14}
            className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 max-h-52 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-sm shadow-xl">
          {(options as string[]).map((option) => (
            <li
              key={option}
              onMouseDown={() => handleSelect(option)}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                value === option
                  ? 'bg-accent/20 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {option}
            </li>
          ))}
          {allowCustom && (
            <li
              onMouseDown={handleCustomSelect}
              className="px-4 py-2.5 text-sm cursor-pointer transition-colors text-accent/80 hover:bg-accent/10 hover:text-accent border-t border-white/5"
            >
              + {customLabel}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
