import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { render } from "react-dom";

window.myGlobal = {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL as string,
  REACT_APP_WS_URL: process.env.REACT_APP_WS_URL as string,
};

render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
