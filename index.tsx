
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Order matters: KaTeX's stylesheet must land before the site's own CSS so the
// override block in index.css wins the cascade. Never `@import` KaTeX inside
// index.css — an `@import` must lead the file and would invert the order.
import 'katex/dist/katex.min.css';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
