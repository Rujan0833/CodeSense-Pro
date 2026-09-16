import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
  className?: string;
  isDark?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  label,
  className = '',
  isDark = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className={`block text-xs uppercase tracking-wider font-semibold mb-2 ${
          isDark ? 'text-neutral-400' : 'text-neutral-500'
        }`}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all duration-200 backdrop-blur-md shadow-sm active:scale-[0.99] border ${
          isDark
            ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-neutral-200'
            : 'bg-black/[0.03] hover:bg-black/[0.06] border-black/10 text-neutral-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <span className="capitalize">{selectedOption || 'Select language'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        } ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-2xl overflow-hidden py-1.5 max-h-60 overflow-y-auto border animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-[#121217]/95 border-white/10'
            : 'bg-white/95 border-black/10'
        }`}>
          {options.map((option) => {
            const isSelected = option === value;
            return (
              <button
                type="button"
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? isDark
                      ? 'bg-white/10 text-white font-medium'
                      : 'bg-black/[0.06] text-black font-semibold'
                    : isDark
                      ? 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                      : 'text-neutral-600 hover:bg-black/[0.03] hover:text-neutral-900'
                }`}
              >
                <span className="capitalize">{option}</span>
                {isSelected && (
                  <Check className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-black'}`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;