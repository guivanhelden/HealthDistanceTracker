import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Report from "@/pages/Report";
import Settings from "@/pages/Settings";
import Compartilhado from "@/pages/Compartilhado";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/relatorios" component={Report} />
      <Route path="/configuracoes" component={Settings} />
      <Route path="/compartilhado" component={Compartilhado} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
