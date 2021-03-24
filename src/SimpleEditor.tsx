import React from 'react';
import classNames from 'classnames';
import { range } from './tools';
import './SimpleEditor.css';

export interface SimpleEditorProps {
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => any;
}

const SimpleEditor: React.FC<SimpleEditorProps> = props => {
  const [lineCount, setLineCount] = React.useState(1);
  const [isFocused, setIsFocused] = React.useState(false);

  const { className, placeholder, value, onChange } = props;

  const recomputeLineCount = React.useCallback(
    (text: string) => {
      const lines = text.split(/\r\n|\n|\r/).length;
      setLineCount(lines);
    },
    [setLineCount],
  );

  React.useEffect(() => {
    recomputeLineCount(value);
  }, [recomputeLineCount, value]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    recomputeLineCount(text);
    onChange(text);
  }

  function handleFocus() {
    setIsFocused(true);
  }

  function handleBlur() {
    setIsFocused(false);
  }

  return (
    <div
      className={classNames('simple-editor', className, { focused: isFocused })}
    >
      <div className="simple-editor__scroller">
        <div className="simple-editor__line-numbers">
          {range(1, lineCount + 1).map(ln => (
            <div key={ln}>{ln}</div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default SimpleEditor;
