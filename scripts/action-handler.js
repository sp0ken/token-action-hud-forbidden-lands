// System Module Imports
import { ACTION_TYPE, ITEM_TYPE } from './constants.js'
import { Utils } from './utils.js'

export let ActionHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
   */
  ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
      /**
       * Build system actions
       * Called by Token Action HUD Core
       * @override
       * @param {array} groupIds
       */a
    async buildSystemActions(groupIds) {
      // Set actor and token variables
      this.actors = (!this.actor) ? this._getActors() : [this.actor]
      this.actorType = this.actor?.type

      if (this.actorType === 'character') {
        this.#buildCharacterActions();
      } else if (!this.actor) {
        this.#buildMultipleTokenActions()
      }
    }

    /**
     * Build character actions
     * @private
     */
    #buildCharacterActions() {
      this.#buildAttributes();
      this.#buildSkills();
      this.#buildCombat();
      this.#buildSpells();
      this.#buildConditions();
      this.#buildConsumables();
      this.#buildTokenUtility();
      this.#buildCharacterUtility();
    }

    /**
     * Build multiple token actions
     * @private
     * @returns {object}
     */
    #buildMultipleTokenActions() {
    }

    /**
     * Build attributes
     * @private
     */
    async #buildAttributes() {
      const actionType = 'attributes';

      // Get attributes
      const attributes = {
        ...(!this.actor ? game.fbl.config.attributes : this.actor.system.attribute),
      };
      // Exit if there are no attributes
      if (attributes.length === 0) return;

      let actions = [];
      try {
        for (const attributeArray of Object.entries(attributes)) {
          const id = attributeArray[0];
          const attribute = attributeArray[1];

          if (!game.fbl.config.attributes.includes(id)) continue;

          const translatedLabel = coreModule.api.Utils.i18n(attribute.label);
          const name = `${translatedLabel} - ${attribute.value}`;

          const encodedValue = [actionType, id].join(this.delimiter);
            
          actions.push({
            id,
            name,
            encodedValue,
          })
        }
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Create group data
      const parentGroupData = { id: 'character' };
      const groupData = { id: 'attributes', name: coreModule.api.Utils.i18n('HEADER.ATTRIBUTES'), type: 'system' };

      // Add actions to HUD
      this.addGroup(groupData, parentGroupData)
      this.addActions(actions, groupData);
    }

    /**
     * Build skills
     * @private
     */
    async #buildSkills() {
      const actionType = 'skills';

      // Get skills
      const skills = this.actor.system.skill;
      // Exit if there are no skills
      if (skills.length === 0) return;

      let actions = [];
      try {
        for (const skillArray of Object.entries(skills)) {
          const id = skillArray[0];
          const skill = skillArray[1];
          const attribute = this.actor.system.attribute[skill.attribute];

          const translatedSkillLabel = coreModule.api.Utils.i18n(skill.label);
          const translatedAttributeLabel = coreModule.api.Utils.i18n(attribute.label);
          const name = `${translatedSkillLabel} - ${skill.value + attribute.value}`;
          const tooltip = `${translatedAttributeLabel}: ${attribute.value} + ${translatedSkillLabel}: ${skill.value}`

          const encodedValue = [actionType, id].join(this.delimiter);
            
          actions.push({
            id,
            name,
            encodedValue,
            tooltip
          })
        }
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Create group data
      const parentGroupData = { id: 'character' };
      const groupData = { id: 'skills', name: coreModule.api.Utils.i18n('HEADER.SKILLS'), type: 'system' };

      // Add actions to HUD
      this.addGroup(groupData, parentGroupData)
      this.addActions(actions, groupData);
    }

    /**
     * Build combat tab
     * @private
     */
    async #buildCombat() {
      const allowedTypes = ['weapon', 'armor'];
      // Get items
      const items = this.actor.items;
      // Exit if there are no skills
      if (items.length === 0) return;

      let actionsMap = {};

      try {
        items.forEach(item => {
          const id = item._id;
          const actionType = item.type;

          if (!allowedTypes.includes(actionType)) return;

          const name = item.name;

          let description = item.system.description;
          if (actionType === 'weapon') {
            const category = coreModule.api.Utils.i18n(`WEAPON.${item.system.category.toUpperCase()}`);
            const range = coreModule.api.Utils.i18n(`RANGE.${item.system.range.toUpperCase()}`);
              
            description = `${category} - ${range} - ${item.system.damage} ${coreModule.api.Utils.i18n('DAMAGE')}`
          } else if (actionType === 'armor') {
            let part = item.system.part;
            if (part === 'head') part = 'helmet';
            const armorPart = coreModule.api.Utils.i18n(`ARMOR.${part.toUpperCase()}`);
              
            description = `${armorPart} - ${item.system.features} - ${item.system.bonus.value}/${item.system.bonus.max}`
          }
          const tooltip = description;
            
          const encodedValue = [actionType, id].join(this.delimiter);
          const img = Utils.getImage(item);

          if (!actionsMap[actionType]) actionsMap[actionType] = [];
            
          actionsMap[actionType].push({
            id,
            name,
            img,
            encodedValue,
            tooltip
          })
        })
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Add global armor action
      const globalArmor = {
        id: 'all',
        name: coreModule.api.Utils.i18n('ARMOR.TOTAL'),
        encodedValue: 'armor|all',
      };
      actionsMap['armor'].push(globalArmor);

      // Create group data
      const parentGroupData = { id: 'combat' };
      for (const type of Object.keys(actionsMap)) {
        const groupData = { id: type, name: coreModule.api.Utils.i18n(`HEADER.${type.toUpperCase()}`), type: 'system' };
          
        // // Add actions to HUD
        this.addGroup(groupData, parentGroupData)
        this.addActions(actionsMap[type], groupData);
      }

      // Creation Standard combat actions
      const COMBAT_ACTIONS = [{ label: 'BREAK_FREE', value: 'break-free' }, { label: 'DISARM', value: 'disarm' }, { label: 'DODGE', value: 'dodge' }, { label: 'GRAPPLE', value: 'grapple' }, { label: 'GRAPPLE_ATTACK', value: 'grapple-attack' }, { label: 'PARRY', value: 'parry' }, { label: 'RETREAT', value: 'retreat' }, { label: 'SHOVE', value: 'shove' }, { label: 'UNARMED_STRIKE', value: 'unarmed' }];
      let actions = [];
      COMBAT_ACTIONS.forEach(combat_action => {
        actions.push({
          id: combat_action.value,
          name: coreModule.api.Utils.i18n(`ACTION.${combat_action.label}`),
          encodedValue: ['action', combat_action.value].join(this.delimiter),
        })
      })
  
      const groupData = { id: 'actions', name: coreModule.api.Utils.i18n(`HEADER.ACTIONS`), type: 'system' };
          
      // // Add actions to HUD
      this.addGroup(groupData, parentGroupData)
      this.addActions(actions, groupData);
    }

    /**
     * Build spells
     * @private
     */
    async #buildSpells() {
      const allowedTypes = ['spell'];
      // Get items
      const items = this.actor.items;
      // Exit if there are no skills
      if (items.length === 0) return;

      let actionsMap = {};
      try {
        items.forEach(item => {
          const id = item._id;
          const actionType = item.type;

          if (!allowedTypes.includes(actionType)) return;

          const name = `${item.name} ${item.system.rank}`;

          const description = item.system.description;
          const tooltip = description;
            
          const encodedValue = [actionType, id].join(this.delimiter);
          const img = Utils.getImage(item);

          if (!actionsMap[item.system.rank]) actionsMap[item.system.rank] = [];
            
          actionsMap[item.system.rank].push({
            id,
            name,
            img,
            encodedValue,
            tooltip
          })
        })
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Create group data
      const parentGroupData = { id: 'spells' };
      for (const type of Object.keys(actionsMap)) {
        const id = `spells_rank_${type}`;
        const name = `${coreModule.api.Utils.i18n('SPELL.RANK')} ${type}`
        const groupData = { id, name, type: 'system' };
          
        // // Add actions to HUD
        this.addGroup(groupData, parentGroupData)
        this.addActions(actionsMap[type], groupData);
      }
    }

    /**
     * Build conditions
     * @private
     */
    async #buildConditions() {
      const actionType = 'condition';

      // Get conditions
      const conditions = this.actor.system.condition;
      // Exit if there are no conditions
      if (conditions.length === 0) return;

      let actions = [];
      try {
        for (const conditionsArray of Object.entries(conditions)) {
          const id = conditionsArray[0];
          const condition = conditionsArray[1];

          const translatedLabel = coreModule.api.Utils.i18n(condition.label);
          const name = translatedLabel;

          const encodedValue = [actionType, id].join(this.delimiter);

          const cssClass = condition.value ? ' active' : ''
            
          actions.push({
            id,
            name,
            cssClass,
            encodedValue,
          })
        }
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Create group data
      const groupData = { id: 'conditions', name: coreModule.api.Utils.i18n('HEADER.CONDITION'), type: 'system' };

      // Add actions to HUD
      this.addActions(actions, groupData);
    }

    /**
     * Build consumables
     * @private
     */
    async #buildConsumables() {
      const actionType = 'consumable';

      // Get consumables
      const consumables = this.actor.system.consumable;
      // Exit if there are no consumables
      if (consumables.length === 0) return;

      let actions = [];
      try {
        for (const consumablesArray of Object.entries(consumables)) {
          const id = consumablesArray[0];
          const consumable = consumablesArray[1];

          const translatedLabel = coreModule.api.Utils.i18n(consumable.label);
          const translatedValue = game.fbl.config.consumableDice[consumable.value] ?? '0';
          const name = `${translatedLabel} ${translatedValue}`;

          const encodedValue = [actionType, id].join(this.delimiter);
            
          actions.push({
            id,
            name,
            encodedValue,
          })
        }
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Create group data
      const groupData = { id: 'consumables', name: coreModule.api.Utils.i18n('HEADER.CONSUMABLE'), type: 'system' };

      // Add actions to HUD
      this.addActions(actions, groupData);
    }

    /**
     * Build token utility
     * @private
     */
    #buildTokenUtility() {
      const actionType = 'utility'

      // Set combat types
      const combatTypes = {
        initiative: { id: 'initiative', name: coreModule.api.Utils.i18n('COMBAT.InitiativeRoll') },
        endTurn: { id: 'endTurn', name: coreModule.api.Utils.i18n('tokenActionHud.endTurn') }
      }

      // Delete endTurn for multiple tokens
      if (game.combat?.current?.tokenId !== this.token?.id) delete combatTypes.endTurn

      // Get actions
      const actions = Object.entries(combatTypes).map((combatType) => {
        const id = combatType[1].id
        const name = combatType[1].name
        const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? ''
        const listName = `${actionTypeName}${name}`
        const encodedValue = [actionType, id].join(this.delimiter)
        const info1 = {}
        let cssClass = ''
        if (combatType[0] === 'initiative' && game.combat) {
          const tokens = coreModule.api.Utils.getControlledTokens()
          const tokenIds = tokens?.map((token) => token.id)
          const combatants = game.combat.combatants.filter((combatant) => tokenIds.includes(combatant.tokenId))

          // Get initiative for single token
          if (combatants.length === 1) {
            const currentInitiative = combatants[0].initiative
            info1.class = 'tah-spotlight'
            info1.text = currentInitiative
          }

          const active = combatants.length > 0 && (combatants.every((combatant) => combatant?.initiative)) ? ' active' : ''
          cssClass = `toggle${active}`
        }

        return {
          id,
          name,
          encodedValue,
          info1,
          cssClass,
          listName
        }
      })

      const parentGroupData = { id: 'utility' };
      const groupData = { id: 'token', name: coreModule.api.Utils.i18n('tokenActionHud.token'), type: 'system' };

      // Add actions to HUD
      this.addGroup(groupData, parentGroupData)
      this.addActions(actions, groupData);
    }

    /**
      * Build character utility
      * @private
      */
    #buildCharacterUtility() {
      const actionType = 'utility'

      // Set combat types
      const characterTypes = {
        rest: { id: 'rests', name: coreModule.api.Utils.i18n('SHEET.HEADER.REST') },
        pride: { id: 'pride', name: coreModule.api.Utils.i18n('BIO.PRIDE') },
        reputation: { id: 'reputation', name: coreModule.api.Utils.i18n('BIO.REPUTATION') },
      }

      // Get actions
      const actions = Object.entries(characterTypes).map((characterType) => {
        const id = characterType[1].id
        const name = characterType[1].name
        const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? ''
        const listName = `${actionTypeName}${name}`
        const encodedValue = [actionType, id].join(this.delimiter)
        return {
          id,
          name,
          encodedValue,
          listName
        }
      })

      const parentGroupData = { id: 'utility' };
      const groupData = { id: 'character_utils', name: coreModule.api.Utils.i18n('ACTOR.TypeCharacter'), type: 'system' };

      // Add actions to HUD
      this.addGroup(groupData, parentGroupData)
      this.addActions(actions, groupData);
    }
  }
})
