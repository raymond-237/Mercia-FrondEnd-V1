export function useAdminUI() {
  const sidebarCollapsed = useState<boolean>('admin:sidebar-collapsed', () => false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    sidebarCollapsed,
    toggleSidebar,
  }
}