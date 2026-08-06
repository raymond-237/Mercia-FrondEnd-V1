<script setup lang="ts">
const sf = useStorefront()

const LOCALES = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' },
]

const menu = ref(false)

const current = computed(() =>
    LOCALES.find(l => l.code === sf.locale.value) ?? LOCALES[0]
)

function select(code: string) {
    sf.setLocale(code)
    menu.value = false
}
</script>

<template>
    <v-menu
        v-model="menu"
        location="bottom end"
        offset="8"
        :close-on-content-click="false"
    >
        <template #activator="{ props }">
            <button class="lang-trigger" v-bind="props">
                <span class="lang-code">{{ current.code.toUpperCase() }}</span>
                <Icon
                    icon="solar:alt-arrow-down-line-duotone"
                    width="14"
                    class="lang-chevron"
                    :class="{ open: menu }"
                />
            </button>
        </template>

        <div class="lang-dropdown">
            <button
                v-for="locale in LOCALES"
                :key="locale.code"
                class="lang-option"
                :class="{ active: locale.code === current.code }"
                @click="select(locale.code)"
            >
                <span class="lang-option-code">{{ locale.code.toUpperCase() }}</span>
                <span class="lang-option-label">{{ locale.label }}</span>
                <Icon
                    v-if="locale.code === current.code"
                    icon="solar:check-circle-bold-duotone"
                    width="16"
                    class="lang-option-check"
                />
            </button>
        </div>
    </v-menu>
</template>

<style scoped>
.lang-trigger {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 40px;
    padding: 0 12px;
    border-radius: var(--r-full);
    background: rgb(var(--v-theme-surface-variant));
    border: none;
    cursor: pointer;
    transition: background .15s ease;
}
.lang-trigger:hover {
    background: rgb(var(--v-theme-surface));
}

.lang-code {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: rgb(var(--v-theme-on-surface));
}

.lang-chevron {
    color: rgb(var(--v-theme-on-surface-variant));
    transition: transform .2s ease;
}
.lang-chevron.open {
    transform: rotate(180deg);
}

.lang-dropdown {
    background: rgb(var(--v-theme-surface));
    border-radius: var(--r-lg);
    padding: 6px;
    min-width: 160px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
}

.lang-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 10px;
    border: none;
    background: transparent;
    border-radius: var(--r-sm);
    cursor: pointer;
    text-align: left;
    transition: background .15s ease;
}
.lang-option:hover {
    background: rgb(var(--v-theme-surface-variant));
}
.lang-option.active {
    background: rgb(var(--v-theme-surface-variant));
}

.lang-option-code {
    font-size: 11px;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface-variant));
    width: 24px;
    flex-shrink: 0;
}

.lang-option-label {
    font-size: 13px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
    flex: 1;
}

.lang-option-check {
    color: rgb(var(--v-theme-primary));
    flex-shrink: 0;
}

@media (max-width: 768px) {
    .lang-trigger { height: 36px; padding: 0 10px; }
}
</style>