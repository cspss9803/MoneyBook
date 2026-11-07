import { PRESET_ICONS } from '../config/presetIcons.js';

export function renderIcon(iconType, iconData, className = 'w-5 h-5') {
    const key = iconData || iconType;
    const svg = PRESET_ICONS[key] || PRESET_ICONS.tag;
    return `<span class="inline-flex items-center justify-center ${className} [&>svg]:w-full [&>svg]:h-full">${svg}</span>`;
}