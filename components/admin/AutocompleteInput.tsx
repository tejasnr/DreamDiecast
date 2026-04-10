'use client';

import { useState, useRef, useEffect } from 'react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  required,
  className = '',
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = value.trim()
    ? suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      )
    : [];

  const showDropdown = isOpen && filtered.length > 0;

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
    setActiveIndex(-1);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      onChange(filtered[activeIndex]);
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        required={required}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-sm shadow-xl"
        >
          {filtered.slice(0, 20).map((suggestion, idx) => {
            const matchStart = suggestion.toLowerCase().indexOf(value.toLowerCase());
            const matchEnd = matchStart + value.length;
            return (
              <li
                key={suggestion}
                onMouseDown={() => {
                  onChange(suggestion);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                  idx === activeIndex ? 'bg-accent/20 text-white' : 'text-white/60 hover:bg-white/5'
                }`}
              >
                {matchStart >= 0 ? (
                  <>
                    {suggestion.slice(0, matchStart)}
                    <span className="text-accent font-bold">
                      {suggestion.slice(matchStart, matchEnd)}
                    </span>
                    {suggestion.slice(matchEnd)}
                  </>
                ) : (
                  suggestion
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
