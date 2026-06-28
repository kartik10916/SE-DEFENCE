import React, { useRef } from 'react';

const SAMPLES = [
  {
    label: '🎣 Phishing email',
    text: 'URGENT: Your PayPal account has been compromised! Click here immediately to verify your credentials and avoid permanent suspension: http://secure-paypa1.tk/verify?token=abc123. Failure to act within 24 hours will result in account closure.',
  },
  {
    label: '👮 Government threat',
    text: 'This is an official notice from the IRS. You owe $3,200 in unpaid taxes. Failure to respond immediately will result in legal action and an arrest warrant. Call 1-800-555-0199 now or visit http://irs-payment.tk/pay',
  },
  {
    label: '🎁 Prize scam',
    text: "Congratulations! You've been selected as a lucky winner. You've won $1,000,000 in our international lottery. To claim your prize, send us your bank account details and a $250 processing fee via Bitcoin immediately.",
  },
];

const MAX = 10000;

const TextInput = ({ value, onChange, onClear }) => {
  const ref = useRef(null);

  const load = (txt) => {
    onChange(txt);
    ref.current?.focus();
  };

  const nearLimit = value.length > MAX * 0.85;

  return (
    <div className="input-section">
      {/* Label row */}
      <div className="input-label-row">
        <label htmlFor="msg-input" className="input-label">
          📋 Paste the suspicious message
        </label>
        <span className="input-label-hint">Up to 10,000 characters</span>
      </div>

      {/* Textarea */}
      <div className="text-area-wrap">
        <textarea
          id="msg-input"
          ref={ref}
          className="text-area"
          value={value}
          onChange={e => onChange(e.target.value.slice(0, MAX))}
          placeholder="Paste any suspicious email, SMS, chat message, or website content here…"
          spellCheck={false}
          aria-label="Message to analyze"
          aria-describedby="char-hint"
        />
        <span
          id="char-hint"
          className="char-counter"
          style={{ color: nearLimit ? 'var(--warning)' : undefined }}
          aria-live="polite"
        >
          {value.length.toLocaleString()} / {MAX.toLocaleString()}
        </span>
      </div>

      {/* Samples */}
      <div className="samples-row">
        <span className="samples-label">Try a sample:</span>
        {SAMPLES.map(s => (
          <button
            key={s.label}
            className="sample-chip"
            onClick={() => load(s.text)}
            type="button"
            aria-label={`Load sample: ${s.label}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TextInput;
