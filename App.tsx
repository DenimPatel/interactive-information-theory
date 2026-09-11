import React, { useEffect } from 'react';
import AppShell from './components/shell/AppShell';
import PageRouter from './components/shell/PageRouter';
import { useHashRoute } from './routing/useHashRoute';

const App: React.FC = () => {
  const route = useHashRoute();
  const routeKey = route.kind === 'page' ? route.slug : route.kind;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [routeKey]);

  return (
    <AppShell route={route}>
      <PageRouter route={route} />
    </AppShell>
  );
};

export default App;
