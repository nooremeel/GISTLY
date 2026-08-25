import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';


export default function AppShell() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}