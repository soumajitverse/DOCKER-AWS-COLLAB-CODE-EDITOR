import React, { useRef, useMemo, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

const App = () => {
  const name = new URLSearchParams(window.location.search).get("userName");
  const [userName, setUserName] = useState(() => {
    return name || "";
  });
  const [showEditor, setShowEditor] = useState(name ? true : false);

  const [users, setUsers] = useState([]);

  const [output, setOutput] = useState("");

  const editorRef = useRef(null);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  const runCode = () => {
    try {
      setOutput("");

      const code = editorRef.current.getValue();

      const logs = [];
      const originalLog = console.log;

      console.log = (...args) => {
        logs.push(args.join(" "));
      };

      const timeout = setTimeout(() => {
        throw new Error("Execution timeout");
      }, 1000);

      eval(code);

      clearTimeout(timeout);

      console.log = originalLog;

      setOutput(logs.join("\n"));
    } catch (err) {
      setOutput(err.toString());
    }
  };

  function handleMount(editor, monaco) {
    editorRef.current = editor;

    // Bind Yjs to the editor model
    const monacoBinding = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
    );
  }

  const handleJoin = (e) => {
    setShowEditor(userName ? true : false);
    e.preventDefault();

    window.history.pushState({}, "", "?userName=" + e.target.userName.value);
  };

  useEffect(() => {

    if (userName && showEditor) {
      console.log("hello");
      const provider = new SocketIOProvider(
        "/",
        "monaco",
        ydoc,
        { autoConnect: true },
      );

      provider.awareness.setLocalStateField("user", { userName });

      provider.awareness.on("change", () => {
        const states = Array.from(provider.awareness.getStates().values());
        console.log("halum", states);
        console.log(
          "hulum",
          states
            .filter((item) => item.user && item.user.userName)
            .map((state) => state.user),
        );

        setUsers(
          states
            .filter((item) => item.user && item.user.userName)
            .map((state) => state.user),
        );
      });

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null);
      }

      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        provider.disconnect();
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [userName, showEditor]);

  return showEditor ? (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
      <aside className="h-full w-1/4 bg-gray-750 rounded-lg">
        <h2 className="text-2xl font-bold p-4 border-b border-gray-300 text-white">
          Users
        </h2>
        <ul className="p-4">
          {console.log("users", users)}
          {users.map((user, index) => (
            <li key={index} className="p-2 bg-gray-800 text-white rounded mb-2">
              {user.userName}
              {user.userName.trim() === userName.trim() ? "(me)" : null}
            </li>
          ))}
        </ul>
      </aside>

      <section className="w-4/5 flex flex-col bg-neutral-800 rounded-lg overflow-hidden">
        <div className="flex justify-between p-2 bg-gray-900">
          <div className="text-white">JavaScript IDE</div>
          <button
            onClick={runCode}
            className="bg-green-500 px-4 py-1 rounded text-black font-bold"
          >
            Run
          </button>
        </div>

        <div className="h-2/3">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            defaultValue="// write code"
            theme="vs-dark"
            onMount={handleMount}
          />
        </div>

        <div className="h-1/3 bg-black text-green-400 p-2 overflow-auto">
          <pre>{output}</pre>
        </div>
      </section>
    </main>
  ) : (
    <form
      onSubmit={handleJoin}
      className="h-screen w-full bg-gray-950 flex gap-4 p-4 items-center justify-center"
    >
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Enter your username"
          className="p-2 rounded-lg bg-gray-800 text-white"
          name="userName"
          value={userName}
          onChange={(e) => {
            setUserName(e.target.value);
          }}
        />
        <button className="p-2 rounded-lg bg-amber-50 text-gray-950 font-bold">
          Join
        </button>
      </div>
    </form>
  );
};

export default App;
