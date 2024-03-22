import { GROUP } from './constants.js'

/**
 * Default layout and groups
 */
export let DEFAULTS = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    const groups = GROUP
    Object.values(groups).forEach(group => {
        group.name = coreModule.api.Utils.i18n(group.name)
        group.listName = `Group: ${coreModule.api.Utils.i18n(group.listName ?? group.name)}`
    })
    const groupsArray = Object.values(groups)

    DEFAULTS = {
        layout: [
            {
                nestId: 'character',
                id: 'character',
                name: coreModule.api.Utils.i18n('HEADER.ATTRIBUTES'),
                groups: [
                    { ...groups.attributes, nestId: 'character_attributes' },
                    { ...groups.skills, nestId: 'character_skills' },
                ]
            },
            {
                nestId: 'combat',
                id: 'combat',
                name: coreModule.api.Utils.i18n('TAB.COMBAT'),
                groups: [
                    { ...groups.weapons, nestId: 'combat_weapons' },
                    { ...groups.armors, nestId: 'combat_armors' },
                ]
            },
            {
                nestId: 'spells',
                id: 'spells',
                name: coreModule.api.Utils.i18n('HEADER.SPELL'),
                groups: [
                    { ...groups.spells_rank_1, nestId: 'spells_spells_rank_1' },
                    { ...groups.spells_rank_2, nestId: 'spells_spells_rank_2' },
                    { ...groups.spells_rank_3, nestId: 'spells_spells_rank_3' },
                ]
            },
            {
                nestId: 'conditions',
                id: 'conditions',
                name: coreModule.api.Utils.i18n('HEADER.CONDITION'),
                groups: [
                    { ...groups.conditions, nestId: 'conditions_conditions' },
                ]
            },
            {
                nestId: 'consumables',
                id: 'consumables',
                name: coreModule.api.Utils.i18n('HEADER.CONSUMABLE'),
                groups: [
                    { ...groups.consumables, nestId: 'consumables_consumables' },
                ]
            },
            {
                nestId: 'utility',
                id: 'utility',
                name: coreModule.api.Utils.i18n('tokenActionHud.utility'),
                groups: [
                    { ...groups.token, nestId: 'utility_token' },
                ]
            }
        ],
        groups: groupsArray
    }
})
