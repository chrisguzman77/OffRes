import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type KioskKeyboardMode = 'text' | 'decimal';

function sanitizeDecimal(raw: string): string {
  let t = raw.replace(/[^0-9.]/g, '');
  const i = t.indexOf('.');
  if (i !== -1) {
    t = t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, '');
  }
  return t;
}

type Props = {
  value: string;
  onChange: (next: string) => void;
  mode: KioskKeyboardMode;
  onClose: () => void;
};

const LETTERS: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const NUMBERS: string[][] = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['@', '#', '$', '%', '&', '*', '(', ')', '-', '+'],
  ['!', '?', ':', ';', '"', "'", '/', '=', ',', '.'],
];

const DECIMAL_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'bksp'],
];

/**
 * Pure React on-screen keyboard — no third-party keyboard library.
 * Avoids Chromium / Pi white-screen crashes from simple-keyboard and similar.
 */
export default function KioskScreenKeyboard({ value, onChange, mode, onClose }: Props) {
  const [textLayer, setTextLayer] = useState<'letters' | 'numbers'>('letters');
  const [caps, setCaps] = useState(false);

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const append = useCallback(
    (ch: string) => {
      if (mode === 'decimal') {
        onChange(sanitizeDecimal(value + ch));
      } else {
        onChange(value + ch);
      }
    },
    [mode, onChange, value],
  );

  const backspace = useCallback(() => {
    onChange(value.slice(0, -1));
  }, [onChange, value]);

  const panelBody: ReactNode = (() => {
    if (mode === 'decimal') {
      return (
        <div className="kiosk-key-grid">
          {DECIMAL_ROWS.map((row, ri) => (
            <div key={ri} className="kiosk-key-row">
              {row.map((id) =>
                id === 'bksp' ? (
                  <button key="bksp" type="button" className="kiosk-key kiosk-key--wide" onClick={backspace}>
                    ⌫
                  </button>
                ) : (
                  <button key={id} type="button" className="kiosk-key" onClick={() => append(id)}>
                    {id}
                  </button>
                ),
              )}
            </div>
          ))}
        </div>
      );
    }

    if (textLayer === 'numbers') {
      return (
        <div className="kiosk-key-grid">
          {NUMBERS.map((row, ri) => (
            <div key={ri} className="kiosk-key-row">
              {row.map((id) => (
                <button key={id} type="button" className="kiosk-key" onClick={() => append(id)}>
                  {id}
                </button>
              ))}
            </div>
          ))}
          <div className="kiosk-key-row">
            <button type="button" className="kiosk-key kiosk-key--wide" onClick={() => setTextLayer('letters')}>
              ABC
            </button>
            <button type="button" className="kiosk-key kiosk-key--grow" onClick={() => append(' ')}>
              space
            </button>
            <button type="button" className="kiosk-key kiosk-key--wide" onClick={backspace}>
              ⌫
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="kiosk-key-grid">
        {LETTERS.map((row, ri) => (
          <div key={ri} className="kiosk-key-row">
            {ri === 2 && (
              <button type="button" className="kiosk-key" onClick={() => setCaps((c) => !c)} aria-pressed={caps}>
                ⇧
              </button>
            )}
            {row.map((ch) => (
              <button
                key={ch}
                type="button"
                className="kiosk-key"
                onClick={() => append(caps ? ch.toUpperCase() : ch)}
              >
                {caps ? ch.toUpperCase() : ch}
              </button>
            ))}
            {ri === 2 && (
              <button type="button" className="kiosk-key kiosk-key--wide" onClick={backspace}>
                ⌫
              </button>
            )}
          </div>
        ))}
        <div className="kiosk-key-row">
          <button type="button" className="kiosk-key" onClick={() => setTextLayer('numbers')}>
            123
          </button>
          <button type="button" className="kiosk-key kiosk-key--grow" onClick={() => append(' ')}>
            space
          </button>
          <button type="button" className="kiosk-key" onClick={() => append('.')}>
            .
          </button>
          <button type="button" className="kiosk-key" onClick={() => append(',')}>
            ,
          </button>
          <button type="button" className="kiosk-key" onClick={() => append('?')}>
            ?
          </button>
        </div>
      </div>
    );
  })();

  const panel = (
    <div className="kiosk-osk-backdrop" role="presentation" onClick={onClose}>
      <div
        className="kiosk-osk-panel"
        role="dialog"
        aria-label="On-screen keyboard"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kiosk-osk-toolbar">
          <span className="kiosk-osk-title">Keyboard</span>
          <button type="button" className="kiosk-osk-done" onClick={onClose}>
            Done
          </button>
        </div>
        <div className="kiosk-osk-keyboard-wrap">{panelBody}</div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(panel, document.body);
}
