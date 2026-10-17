import { render } from "preact";
import "./index.css";
import { App } from "./app";

const root = document.getElementById("app");
if (root) render(<App />, root);
