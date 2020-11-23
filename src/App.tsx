import React, { useState } from "react";
import "./App.css";

import PreviewUrl from "./components/PreviewUrl";

function App() {
  const [text, setText] = useState("");

  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault();
    setText(event.currentTarget.value);
  };

  return (
    <div className="App" style={{ marginTop: '40px' }}>
      <input type="text" onChange={handleChange}  style={{ marginBottom: '40px' }} />
      <PreviewUrl url={text} />
    </div>
  );
}

export default App;
