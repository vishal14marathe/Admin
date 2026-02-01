// src/components/common/RichTextEditor.jsx
import MDEditor from "@uiw/react-md-editor";
import { useState } from "react";

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Enter content...",
}) => {
  const [text, setText] = useState(value || "");

  const handleChange = (newValue) => {
    setText(newValue || "");
    if (onChange) {
      onChange(newValue || "");
    }
  };

  return (
    <div className="w-full">
      <MDEditor
        value={text}
        onChange={handleChange}
        height={400}
        preview="edit"
        textareaProps={{
          placeholder: placeholder,
        }}
      />
      <div className="mt-2 text-sm text-gray-500">{text.length} characters</div>
    </div>
  );
};

export default RichTextEditor;
