/**
 * Module-based constants
 */
export const MODULE = {
    ID: 'token-action-hud-forbidden-lands'
}

/**
 * Core module
 */
export const CORE_MODULE = {
    ID: 'token-action-hud-core'
}

/**
 * Core module version required by the system module
 */
export const REQUIRED_CORE_MODULE_VERSION = '1.5'

/**
 * Action types
 */
export const ACTION_TYPE = {
    item: 'tokenActionHud.template.item',
    utility: 'tokenActionHud.utility'
}

/**
 * Groups
 */
export const GROUP = {
    attributes: { id: 'attributes', name: 'HEADER.ATTRIBUTES', type: 'system' },
    skills: { id: 'skills', name: 'HEADER.SKILLS', type: 'system' },
    armors: { id: 'armors', name: 'HEADER.ARMORS', type: 'system' },
    weapons: { id: 'weapons', name: 'HEADER.WEAPONS', type: 'system' },
    actions: { id: 'actions', name: 'HEADER.ACTIONS', type: 'system' },
    spells_rank_1: { id: 'spells_rank_1', name: 'HEADER.SPELL', type: 'system' },
    spells_rank_2: { id: 'spells_rank_2', name: 'HEADER.SPELL', type: 'system' },
    spells_rank_3: { id: 'spells_rank_3', name: 'HEADER.SPELL', type: 'system' },
    conditions: { id: 'conditions', name: 'HEADER.CONDITION', type: 'system' },
    consumables: { id: 'consumables', name: 'HEADER.CONSUMABLE', type: 'system' },
    token: { id: 'token', name: 'tokenActionHud.token', type: 'system' },
    character_utils: { id: 'character_utils', name: 'ACTOR.TypeCharacter', type: 'system' }
}

/**
 * Item types
 */
export const ITEM_TYPE = {
    armor: { groupId: 'armor' },
    consumable: { groupId: 'consumables' },
    weapon: { groupId: 'weapons' }
}
