// System Module Imports
import { ACTION_TYPE, ITEM_TYPE } from "./constants.js";
import { Utils } from "./utils.js";

export let ActionHandler = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  /**
   * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
   */
  ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
    /**
     * Build system actions
     * Called by Token Action HUD Core
     * @override
     * @param {array} groupIds
     */
    async buildSystemActions(_groupIds) {
      // Set actor and token variables
      this.actors = !this.actor ? this.#getActors() : [this.actor];
      this.actorType = this.actor?.type;

      if (this.actorType === "character") {
        this.#buildCharacterActions();
      } else if (this.actorType === "monster") {
        this.#buildMonsterActions();
      } else if (!this.actor) {
        this.#buildMultipleTokenActions();
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
     * Build monster actions
     * @private
     */
    #buildMonsterActions() {
      this.#buildAttributes();
      this.#buildSkills();
      this.#buildMonsterCombat();
      this.#buildSpells();
      this.#buildTokenUtility();
    }

    /**
     * Build multiple token actions
     * @private
     * @returns {object}
     */
    #buildMultipleTokenActions() {
      this.#buildTokenUtility();
    }

    /**
     * Build attributes
     * @private
     */
    async #buildAttributes() {
      const actionType = "attributes";

      // Get attributes
      const attributes = {
        ...(!this.actor
          ? game.fbl.config.attributes
          : this.actor.system.attribute),
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
          const name = translatedLabel;
          const description = `<div><h3>${name}</h3><ul><li>${coreModule.api.Utils.i18n("VALUE")}: ${attribute.value}</li></ul></div>`;

          const tooltip = {
            content: description,
            class: "tah-system-tooltip",
            direction: "DOWN",
          };

          actions.push({
            id,
            name,
            tooltip,
            system: { actionType, actionId: id },
          });
        }
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Create group data
      const parentGroupData = { id: "character" };
      const groupData = {
        id: "attributes",
        name: coreModule.api.Utils.i18n("HEADER.ATTRIBUTES"),
        type: "system",
      };

      // Add actions to HUD
      this.addGroup(groupData, parentGroupData);
      this.addActions(actions, groupData);
    }

    /**
     * Build skills
     * @private
     */
    async #buildSkills() {
      const actionType = "skills";

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
          const translatedAttributeLabel = coreModule.api.Utils.i18n(
            attribute.label,
          );
          const name = translatedSkillLabel;
          const description = `<div><h3>${name}</h3><ul><li>${translatedAttributeLabel}: ${attribute.value}</li><li>${translatedSkillLabel}: ${skill.value}</li><li>${coreModule.api.Utils.i18n("VALUE")}: ${attribute.value + skill.value}</li></ul></div>`;

          const tooltip = {
            content: description,
            class: "tah-system-tooltip",
            direction: "DOWN",
          };

          actions.push({
            id,
            name,
            tooltip,
            system: { actionType, actionId: id },
          });
        }
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Create group data
      const parentGroupData = { id: "character" };
      const groupData = {
        id: "skills",
        name: coreModule.api.Utils.i18n("HEADER.SKILLS"),
        type: "system",
      };

      // Add actions to HUD
      this.addGroup(groupData, parentGroupData);
      this.addActions(actions, groupData);
    }

    /**
     * Build combat tab
     * @private
     */
    async #buildCombat() {
      const allowedTypes = ["weapon", "armor"];
      // Get items
      const items = this.actor.items;
      // Exit if there are no skills
      if (items.length === 0) return;

      let actionsMap = {};
      let armorTotal = "";

      try {
        items.forEach((item) => {
          const id = item._id;
          const actionType = item.type;

          if (!allowedTypes.includes(actionType)) return;

          const name = item.name;

          let description = item.system.description;
          if (actionType === "weapon") {
            const category = coreModule.api.Utils.i18n(
              `WEAPON.${item.system.category.toUpperCase()}`,
            );
            const range = coreModule.api.Utils.i18n(
              `RANGE.${item.system.range.toUpperCase()}`,
            );

            const features = [];
            for (const [name, enabled] of Object.entries(
              item.system.features,
            )) {
              let formatedName = name;
              if (name === "slowReload") formatedName = "slow_reload";
              if (enabled)
                features.push(
                  coreModule.api.Utils.i18n(
                    `WEAPON.FEATURES.${formatedName.toUpperCase()}`,
                  ),
                );
            }

            description = `<div><h3>${name}</h3><ul><li>${coreModule.api.Utils.i18n("WEAPON.CATEGORY")}: ${category}</li><li>${coreModule.api.Utils.i18n("WEAPON.RANGE")}: ${range}</li><li>${coreModule.api.Utils.i18n("WEAPON.DAMAGE")}: ${item.system.damage}</li><li>${coreModule.api.Utils.i18n("WEAPON.FEATURE")}: ${features.join(", ")}</li><li>${coreModule.api.Utils.i18n("tokenActionHud.template.weaponTooltipParry")}</li><li>${coreModule.api.Utils.i18n("tokenActionHud.template.weaponTooltipDisarm")}</li></ul></div>`;
          } else if (actionType === "armor") {
            let part = item.system.part;
            if (part === "head") part = "helmet";
            const armorPart = coreModule.api.Utils.i18n(
              `ARMOR.${part.toUpperCase()}`,
            );

            description = `<div><h3>${name}</h3><ul><li>${coreModule.api.Utils.i18n("GEAR.TYPE")}: ${armorPart}</li><li>${item.system.features}</li><li>${coreModule.api.Utils.i18n("GEAR.BONUS")}: ${item.system.bonus.value}/${item.system.bonus.max}</li></ul></div>`;

            armorTotal += item.system.bonus.value;
          }

          const tooltip = {
            content: description,
            class: "tah-system-tooltip",
            direction: "DOWN",
          };

          const img = Utils.getImage(item);

          if (!actionsMap[actionType]) actionsMap[actionType] = [];

          actionsMap[actionType].push({
            id,
            name,
            img,
            tooltip,
            system: { actionType, actionId: id },
          });
        });
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Add global armor action
      const tooltip = {
        content: `<div><h3>${coreModule.api.Utils.i18n("ARMOR.TOTAL")}</h3><ul><li>${coreModule.api.Utils.i18n("GEAR.BONUS")}: ${armorTotal}</li></ul></div>`,
        class: "tah-system-tooltip",
        direction: "DOWN",
      };
      const globalArmor = {
        id: "all",
        name: coreModule.api.Utils.i18n("ARMOR.TOTAL"),
        tooltip,
        system: { actionType: "armor", actionId: "all" },
      };
      if (!actionsMap["armor"]) actionsMap["armor"] = [];
      actionsMap["armor"].push(globalArmor);

      // Create group data
      const parentGroupData = { id: "combat" };
      for (const type of Object.keys(actionsMap)) {
        const groupData = {
          id: type,
          name: coreModule.api.Utils.i18n(`HEADER.${type.toUpperCase()}`),
          type: "system",
        };

        // // Add actions to HUD
        this.addGroup(groupData, parentGroupData);
        this.addActions(actionsMap[type], groupData);
      }

      // Creation Standard combat actions
      const COMBAT_ACTIONS = [
        { label: "BREAK_FREE", value: "break-free" },
        { label: "DISARM", value: "disarm" },
        { label: "DODGE", value: "dodge" },
        { label: "GRAPPLE", value: "grapple" },
        { label: "GRAPPLE_ATTACK", value: "grapple-attack" },
        { label: "PARRY", value: "parry" },
        { label: "RETREAT", value: "retreat" },
        { label: "SHOVE", value: "shove" },
        { label: "UNARMED_STRIKE", value: "unarmed" },
      ];
      let actions = [];
      COMBAT_ACTIONS.forEach((combat_action) => {
        actions.push({
          id: combat_action.value,
          name: coreModule.api.Utils.i18n(`ACTION.${combat_action.label}`),
          system: { actionType: "action", actionId: combat_action.value },
        });
      });

      const groupData = {
        id: "actions",
        name: coreModule.api.Utils.i18n(`HEADER.ACTIONS`),
        type: "system",
      };

      // // Add actions to HUD
      this.addGroup(groupData, parentGroupData);
      this.addActions(actions, groupData);
    }

    /**
     * Build combat tab
     * @private
     */
    async #buildMonsterCombat() {
      const allowedTypes = ["monsterAttack", "armor"];
      // Get items
      const items = this.actor.items;
      // Exit if there are no skills
      if (items.length === 0) return;

      let actionsMap = {};
      const randomAttack = {
        id: "random",
        name: coreModule.api.Utils.i18n("HEADER.ATTACK"),
        system: { actionType: "monsterAttack", actionId: "random" },
      };
      actionsMap["monsterAttack"] = [randomAttack];

      try {
        items.forEach((item) => {
          const id = item._id;
          const actionType = item.type;

          if (!allowedTypes.includes(actionType)) return;

          const name = item.name;

          let description = item.system.description;
          if (actionType === "monsterAttack") {
            const category = coreModule.api.Utils.i18n(
              `ATTACK.${item.system.damageType.toUpperCase()}`,
            );
            const range = coreModule.api.Utils.i18n(
              `RANGE.${item.system.range.toUpperCase()}`,
            );

            description = `<div><h3>${name}</h3><ul><li>${coreModule.api.Utils.i18n("WEAPON.CATEGORY")}: ${category}</li><li>${coreModule.api.Utils.i18n("WEAPON.RANGE")}: ${range}</li><li>${coreModule.api.Utils.i18n("WEAPON.DAMAGE")}: ${item.system.damage}</li><li>${item.system.description}</li></ul></div>`;
          }
          const tooltip = {
            content: description,
            class: "tah-system-tooltip",
            direction: "DOWN",
          };

          const img = Utils.getImage(item);

          if (!actionsMap[actionType]) actionsMap[actionType] = [];

          actionsMap[actionType].push({
            id,
            name,
            img,
            tooltip,
            system: { actionType, actionId: id },
          });
        });
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      const parentGroupData = { id: "combat" };

      // Add monster attack group
      const attackGroupData = {
        id: "monsterAttack",
        name: coreModule.api.Utils.i18n(`ITEM.TypeMonsterattack`),
        type: "system",
      };
      // // Add actions to HUD
      this.addGroup(attackGroupData, parentGroupData);
      this.addActions(actionsMap["monsterAttack"], attackGroupData);

      // Add global armor action
      const armorGroupData = {
        id: "armor",
        name: coreModule.api.Utils.i18n(`MONSTER.ARMOR`),
        type: "system",
      };
      let description = `<div><h3>${coreModule.api.Utils.i18n(`MONSTER.ARMOR`)}</h3><ul><li>${coreModule.api.Utils.i18n("GEAR.BONUS")}: ${this.actor.system.armor.value}</li>`;
      if (this.actor.system.armor.description) {
        description += `<li>${this.actor.system.armor.description}</li>`;
      }
      description += `</ul></div>`;

      const tooltip = {
        content: description,
        class: "tah-system-tooltip",
        direction: "DOWN",
      };

      const armor = {
        id: "monster",
        name: coreModule.api.Utils.i18n("ARMOR.TOTAL"),
        tooltip,
        system: { actionType: "armor", actionId: "monster" },
      };
      // // Add actions to HUD
      this.addGroup(armorGroupData, parentGroupData);
      this.addActions([armor], armorGroupData);

      // Creation Standard combat actions
      const COMBAT_ACTIONS = [
        { label: "BREAK_FREE", value: "break-free" },
        { label: "DISARM", value: "disarm" },
        { label: "DODGE", value: "dodge" },
        { label: "GRAPPLE", value: "grapple" },
        { label: "GRAPPLE_ATTACK", value: "grapple-attack" },
        { label: "PARRY", value: "parry" },
        { label: "RETREAT", value: "retreat" },
        { label: "SHOVE", value: "shove" },
        { label: "UNARMED_STRIKE", value: "unarmed" },
      ];
      let actions = [];
      COMBAT_ACTIONS.forEach((combat_action) => {
        actions.push({
          id: combat_action.value,
          name: coreModule.api.Utils.i18n(`ACTION.${combat_action.label}`),
          system: { actionType: "action", actionId: combat_action.value },
        });
      });

      const groupData = {
        id: "actions",
        name: coreModule.api.Utils.i18n(`HEADER.ACTIONS`),
        type: "system",
      };

      // // Add actions to HUD
      this.addGroup(groupData, parentGroupData);
      this.addActions(actions, groupData);
    }

    /**
     * Build spells
     * @private
     */
    async #buildSpells() {
      const allowedTypes = ["spell"];
      // Get items
      const items = this.actor.items;
      // Exit if there are no skills
      if (items.length === 0) return;

      let actionsMap = {};
      try {
        items.forEach((item) => {
          const id = item._id;
          const actionType = item.type;

          if (!allowedTypes.includes(actionType)) return;

          const name = item.name;
          const type = coreModule.api.Utils.i18n(`${item.system.spellType}`);
          const range = coreModule.api.Utils.i18n(
            `RANGE.${item.system.range.toUpperCase()}`,
          );

          const description = `<div><h3>${item.name}</h3><ul><li>${coreModule.api.Utils.i18n(`SPELL.SPELL_TYPE`)}: ${type}</li><li>${coreModule.api.Utils.i18n(`SPELL.RANK`)}: ${item.system.rank}</li><li>${coreModule.api.Utils.i18n(`SPELL.RANGE`)}: ${range}</li><li>${coreModule.api.Utils.i18n(`SPELL.DURATION`)}: ${item.system.duration}</li><li>${coreModule.api.Utils.i18n(`SPELL.INGREDIENT`)}: ${item.system.ingredient}</li><li>${item.system.description}</li></ul></div>`;
          const tooltip = {
            content: description,
            class: "tah-system-tooltip",
            direction: "DOWN",
          };

          const img = Utils.getImage(item);

          if (!actionsMap[item.system.rank]) actionsMap[item.system.rank] = [];

          actionsMap[item.system.rank].push({
            id,
            name,
            img,
            tooltip,
            system: { actionType, actionId: id },
          });
        });
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Create group data
      const parentGroupData = { id: "spells" };
      for (const type of Object.keys(actionsMap)) {
        const id = `spells_rank_${type}`;
        const name = `${coreModule.api.Utils.i18n("SPELL.RANK")} ${type}`;
        const groupData = { id, name, type: "system" };

        // // Add actions to HUD
        this.addGroup(groupData, parentGroupData);
        this.addActions(actionsMap[type], groupData);
      }
    }

    /**
     * Build conditions
     * @private
     */
    async #buildConditions() {
      const actionType = "condition";

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

          const cssClass = condition.value ? " active" : "";

          actions.push({
            id,
            name,
            cssClass,
            system: { actionType, actionId: id },
          });
        }
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Create group data
      const groupData = {
        id: "conditions",
        name: coreModule.api.Utils.i18n("HEADER.CONDITION"),
        type: "system",
      };

      // Add actions to HUD
      this.addActions(actions, groupData);
    }

    /**
     * Build consumables
     * @private
     */
    async #buildConsumables() {
      const actionType = "consumable";

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
          const translatedValue =
            game.fbl.config.consumableDice[consumable.value] ?? "0";
          const name = `${translatedLabel} ${translatedValue}`;

          actions.push({
            id,
            name,
            system: { actionType, actionId: id },
          });
        }
      } catch (e) {
        coreModule.api.Logger.error(e);
        return null;
      }

      // Create group data
      const groupData = {
        id: "consumables",
        name: coreModule.api.Utils.i18n("HEADER.CONSUMABLE"),
        type: "system",
      };

      // Add actions to HUD
      this.addActions(actions, groupData);
    }

    /**
     * Build token utility
     * @private
     */
    #buildTokenUtility() {
      const actionType = "utility";

      // Set combat types
      const combatTypes = {
        initiative: {
          id: "initiative",
          name: coreModule.api.Utils.i18n("COMBAT.InitiativeRoll"),
        },
        endTurn: {
          id: "endTurn",
          name: coreModule.api.Utils.i18n("tokenActionHud.endTurn"),
        },
      };

      // Delete endTurn for multiple tokens
      if (game.combat?.current?.tokenId !== this.token?.id)
        delete combatTypes.endTurn;

      // Get actions
      const actions = Object.entries(combatTypes).map((combatType) => {
        const id = combatType[1].id;
        const name = combatType[1].name;
        const actionTypeName =
          `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? "";
        const listName = `${actionTypeName}${name}`;
        const info1 = {};
        let cssClass = "";
        if (combatType[0] === "initiative" && game.combat) {
          const tokens = coreModule.api.Utils.getControlledTokens();
          const tokenIds = tokens?.map((token) => token.id);
          const combatants = game.combat.combatants.filter((combatant) =>
            tokenIds.includes(combatant.tokenId),
          );

          // Get initiative for single token
          if (combatants.length === 1) {
            const currentInitiative = combatants[0].initiative;
            info1.class = "tah-spotlight";
            info1.text = currentInitiative;
          }

          const active =
            combatants.length > 0 &&
            combatants.every((combatant) => combatant?.initiative)
              ? " active"
              : "";
          cssClass = `toggle${active}`;
        }

        return {
          id,
          name,
          info1,
          cssClass,
          listName,
          system: { actionType, actionId: id },
        };
      });

      const parentGroupData = { id: "utility" };
      const groupData = {
        id: "token",
        name: coreModule.api.Utils.i18n("tokenActionHud.token"),
        type: "system",
      };

      // Add actions to HUD
      this.addGroup(groupData, parentGroupData);
      this.addActions(actions, groupData);
    }

    /**
     * Build character utility
     * @private
     */
    #buildCharacterUtility() {
      const actionType = "utility";

      // Set combat types
      const characterTypes = {
        rest: {
          id: "rests",
          name: coreModule.api.Utils.i18n("SHEET.HEADER.REST"),
        },
        pride: { id: "pride", name: coreModule.api.Utils.i18n("BIO.PRIDE") },
        reputation: {
          id: "reputation",
          name: coreModule.api.Utils.i18n("BIO.REPUTATION"),
        },
      };

      // Get actions
      const actions = Object.entries(characterTypes).map((characterType) => {
        const id = characterType[1].id;
        const name = characterType[1].name;
        const actionTypeName =
          `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? "";
        const listName = `${actionTypeName}${name}`;

        return {
          id,
          name,
          listName,
          system: { actionType, actionId: id },
        };
      });

      const parentGroupData = { id: "utility" };
      const groupData = {
        id: "character_utils",
        name: coreModule.api.Utils.i18n("ACTOR.TypeCharacter"),
        type: "system",
      };

      // Add actions to HUD
      this.addGroup(groupData, parentGroupData);
      this.addActions(actions, groupData);
    }

    /** Get selected actors from canvas. */
    #getActors() {
      const allowedTypes = ["character", "monster"];
      const tokens = coreModule.api.Utils.getControlledTokens();
      const actors = tokens
        .filter((token) => token.actor)
        .map((token) => token.actor);
      if (actors.every((actor) => allowedTypes.includes(actor.type))) {
        return actors;
      }

      return [];
    }
  };
});
