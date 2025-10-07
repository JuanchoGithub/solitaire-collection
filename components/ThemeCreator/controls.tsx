import React from 'react';

export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xl font-bold text-green-700 mb-3 border-b-2 border-green-200 pb-2">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

interface ControlProps {
  label: string;
  children: React.ReactNode;
  helpText?: string;
}

const Control: React.FC<ControlProps> = ({ label, children, helpText }) => (
  <div>
    <label className="flex justify-between items-center text-gray-700 font-semibold">
      <span>{label}</span>
      {children}
    </label>
    {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
  </div>
);

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => (
  <Control label={label}>
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-gray-500">{value}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 p-0 border-none rounded-md cursor-pointer"
        style={{ backgroundColor: value }}
      />
    </div>
  </Control>
);

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, value, onChange, helpText }) => (
  <Control label={label} helpText={helpText}>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-40 p-1 border border-gray-300 rounded-md text-right focus:ring-green-500 focus:border-green-500 bg-white text-black"
    />
  </Control>
);

interface SelectInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string, label: string }[];
}

export const SelectInput: React.FC<SelectInputProps> = ({ label, value, onChange, options }) => (
    <Control label={label}>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-40 p-1 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white text-black text-right"
        >
            {options.map(opt => <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>)}
        </select>
    </Control>
);

interface ToggleInputProps {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
}

export const ToggleInput: React.FC<ToggleInputProps> = ({ label, value, onChange }) => (
    <Control label={label}>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
    </Control>
);
