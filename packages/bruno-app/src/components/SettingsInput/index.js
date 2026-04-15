import React, { useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons';
import { useTheme } from 'providers/Theme';

const SettingsInput = ({
  id,
  label,
  value,
  onChange,
  className = '',
  description = '',
  onKeyDown,
  secret = false
}) => {
  const { theme } = useTheme();
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-900 dark:text-gray-100" htmlFor={id}>
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-700 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      <div className="relative flex items-center">
        <input
          id={id}
          type={secret && !revealed ? 'password' : 'text'}
          className={`block px-2 py-1 rounded-sm outline-none transition-colors duration-100 w-24 h-8 ${secret ? 'pr-7' : ''} ${className}`}
          style={{
            backgroundColor: theme.input.bg,
            border: `1px solid ${theme.input.border}`
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        {secret && (
          <button
            type="button"
            tabIndex="-1"
            className="absolute right-1.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? <IconEyeOff size={14} strokeWidth={1.5} /> : <IconEye size={14} strokeWidth={1.5} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingsInput;
