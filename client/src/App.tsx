import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import HuntsPage from "@/pages/hunts";
import HuntDetailPage from "@/pages/hunt-detail";
import AdminPage from "@/pages/admin";
import OBSOverlayPage from "@/pages/obs-overlay";
import LiveOBSOverlay from "@/pages/live-obs-overlay";
import LatestHuntPage from "@/pages/latest-hunt";
import PublicHuntPage from "@/pages/public-hunt";
import LiveHuntsPage from "@/pages/live";
import MyHunts from "@/pages/MyHunts";
import AdminKeys from "@/pages/AdminKeys";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HuntsPage} />
      <Route path="/live" component={LiveHuntsPage} />
      <Route path="/my-hunts" component={MyHunts} />
      <Route path="/admin-keys" component={AdminKeys} />
      <Route path="/profile" component={Profile} />
      <Route path="/hunts/:id" component={HuntDetailPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/obs" component={OBSOverlayPage} />
      <Route path="/obs-v2" component={OBSOverlayPage} />
      <Route path="/obs-overlay/:id" component={LiveOBSOverlay} />
      <Route path="/live-obs-overlay" component={LiveOBSOverlay} />
      <Route path="/latest-hunt" component={LatestHuntPage} />
      <Route path="/public/:token" component={PublicHuntPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-dark text-gray-100">
          <Switch>
            <Route path="/obs*" component={() => <Router />} />
            <Route path="/public*" component={() => <Router />} />
            <Route>
              <Navigation />
              <Router />
            </Route>
          </Switch>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
