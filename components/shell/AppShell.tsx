import React from 'react';
import Sidebar from './Sidebar';
import { HOME_HREF, type Route } from '../../routing/routes';

interface AppShellProps {
  route: Route;
  children: React.ReactNode;
}

/** Header + lecture rail + `<main>` + footer, shared by every route. */
const AppShell: React.FC<AppShellProps> = ({ route, children }) => (
  <div className="it-shell">
    <header className="it-header">
      <a className="it-brand" href={HOME_HREF}>
        Information Theory &amp; the Bent Coin
      </a>
      <span className="it-header-sub">
        A companion to David MacKay’s <em>Information Theory, Pattern Recognition &amp; Neural Networks</em>
      </span>
    </header>
    <div className="it-body">
      <Sidebar route={route} />
      <main className="it-main">{children}</main>
    </div>
    <footer className="it-footer">
      <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
        An interactive companion to MacKay’s ITPRNN course. Built for manipulation, not just reading.
      </p>
    </footer>
  </div>
);

export default AppShell;
