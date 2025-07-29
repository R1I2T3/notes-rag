"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import { EditorProps as WysiwygEditorProps } from "react-draft-wysiwyg";

interface EditorProps extends WysiwygEditorProps {
  defaultMarkdown?: string;
}
import { convertFromHTML, ContentState, EditorState } from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { useState, useEffect } from "react";
import { marked } from "marked";
const Editor = dynamic(
  () => import("react-draft-wysiwyg").then((mod) => mod.Editor),
  { ssr: false }
);

const getInitialState = (defaultMarkdown: string) => {
  console.log("defaultMarkdown", defaultMarkdown);
  const html = typeof marked === "function" ? marked(defaultMarkdown) : "";
  const blocksFromHTML = convertFromHTML(html as string);
  const contentState = ContentState.createFromBlockArray(
    blocksFromHTML.contentBlocks,
    blocksFromHTML.entityMap
  );

  return EditorState.createWithContent(contentState);
};

export default forwardRef<object, EditorProps>(
  function RichTextEditor(props, ref) {
    const [mounted, setMounted] = useState(false);
    const [editorState, setEditorState] = useState(() =>
      getInitialState(props.defaultMarkdown || "")
    );
    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
      <Editor
        editorClassName={
          "border rounded-md px-3 min-h-[250px] cursor-text ring-offset- focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        }
        placeholder="Enter the content of the blog here"
        editorState={editorState}
        onEditorStateChange={setEditorState}
        toolbar={{
          options: ["inline", "list", "history"],
          inline: {
            options: ["bold", "italic", "underline"],
          },
        }}
        editorRef={(r) => {
          if (typeof ref === "function") {
            ref(r);
          } else if (ref) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ref as any).current = r;
          }
        }}
        {...props}
      />
    );
  }
);
