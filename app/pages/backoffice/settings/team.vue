<script setup lang="ts">
import { useAdminSettingsStore } from '~/stores/Models/settings.store'

definePageMeta({ layout: 'admin' })

const store = useAdminSettingsStore()

onMounted(() => {
  if (!store.team.length) store.fetchTeam()
})

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: 'Administrateur',
  tenant_staff: 'Membre du staff',
}

function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const AVATAR_RAMPS = ['secondary', 'info', 'success', 'warning'] as const
function avatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_RAMPS[Math.abs(hash) % AVATAR_RAMPS.length]
}
</script>

<template>
  <div>

    <div class="panel">
      <h2>Membres de l'équipe</h2>
      <p class="panel-hint">Comptes ayant accès à ce backoffice.</p>

      <div v-if="store.loading" class="loading-block">
        <v-progress-circular indeterminate color="secondary" size="26" />
      </div>

      <div v-else-if="store.team.length === 0" class="empty-block">
        <Icon icon="solar:users-group-rounded-line-duotone" width="32" />
        <p>Aucun membre trouvé.</p>
      </div>

      <div v-else class="team-list">
        <div v-for="member in store.team" :key="member.id" class="team-row">
          <div class="avatar" :class="`bg-${avatarColor(member.id)}`">
            {{ initials(member.firstName, member.lastName) }}
          </div>
          <div class="team-info">
            <div class="team-name">{{ member.firstName }} {{ member.lastName }}</div>
            <div class="muted">{{ member.email }}</div>
          </div>
          <div class="team-meta">
            <span class="role-badge">{{ ROLE_LABELS[member.role] ?? member.role }}</span>
            <span class="muted joined">Depuis {{ formatDate(member.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 20px;
}
.panel h2 { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.panel-hint { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 16px; }

.loading-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 32px 0; color: rgb(var(--v-theme-on-surface-variant));
}

.team-list { display: flex; flex-direction: column; gap: 4px; }
.team-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 8px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}
.team-row:last-child { border-bottom: none; }

.avatar {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12.5px; font-weight: 700; color: #FAFAF8; flex-shrink: 0;
}
.bg-secondary { background: rgb(var(--v-theme-secondary)); }
.bg-info      { background: #6E8FB8; }
.bg-success   { background: #4C7A4C; }
.bg-warning   { background: #B8862F; }

.team-info { flex: 1; min-width: 0; }
.team-name { font-size: 13px; font-weight: 700; }
.muted { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.team-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.role-badge {
  display: inline-flex; padding: 3px 10px; border-radius: var(--r-full);
  font-size: 10px; font-weight: 700;
  background: rgba(var(--v-theme-secondary), 0.1); color: rgb(var(--v-theme-secondary));
}
.joined { white-space: nowrap; }
</style>