/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

render(() => <App />, document.getElementById("root") as HTMLElement);
