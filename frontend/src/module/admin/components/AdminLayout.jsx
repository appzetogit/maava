import { useState, useEffect, useCallback } from "react"
import { Outlet } from "react-router-dom"
import AdminSidebar from "./AdminSidebar"
import AdminNavbar from "./AdminNavbar"
import { toast } from "sonner"
import { useHibermartAdminOrderNotifications } from "../hooks/useHibermartAdminOrderNotifications"

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Get initial collapsed state from localStorage to set initial margin
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adminSidebarCollapsed')
      if (saved !== null) {
        setIsSidebarCollapsed(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Error loading sidebar collapsed state:', e)
    }
  }, [])

  const handleCollapseChange = (collapsed) => {
    setIsSidebarCollapsed(collapsed)
  }

  const handleHibermartNewOrder = useCallback((payload) => {
    // Play notification sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.warn("Sound play failed (browser restriction):", e));
    } catch (e) {
      console.error("Audio play error:", e);
    }

    toast.success("New Hibermart order received", {
      description: `Order ${payload?.orderId || 'Incoming'} from ${payload?.customerName || 'a Customer'}`,
      duration: 10000,
    });

    try {
      window.dispatchEvent(new CustomEvent('hibermart_new_order', { detail: payload }));
    } catch {
      // ignore
    }
  }, []);

  useHibermartAdminOrderNotifications({ onNewOrder: handleHibermartNewOrder })

  return (
    <div className="min-h-screen bg-neutral-200 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCollapseChange={handleCollapseChange}
      />

      {/* Main Content Area */}
      <div className={`
        flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0
        ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'}
      `}>
        {/* Top Navbar */}
        <AdminNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 w-full max-w-full overflow-x-hidden bg-neutral-100 admin-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
