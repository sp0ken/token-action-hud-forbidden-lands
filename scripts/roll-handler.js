export let RollHandler = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  /**
   * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
   */
  RollHandler = class RollHandler extends coreModule.api.RollHandler {
    /**
     * Handle action click
     * Called by Token Action HUD Core when an action is left or right-clicked
     * @override
     * @param {object} event        The event
     */
    async handleActionClick(event) {
      const { actionId, actionType } = this.action.system;

      let keyModifier = "";
      if (event.shiftKey) {
        keyModifier = "shift";
      } else if (event.altKey) {
        keyModifier = "alt";
      }

      const renderable = ["item"];

      if (renderable.includes(actionType) && this.isRenderItem()) {
        return this.doRenderItem(this.actor, actionId);
      }

      const knownCharacters = ["character", "monster"];

      // If single actor is selected
      if (this.actor) {
        await this.#handleAction(
          event,
          this.actor,
          this.token,
          actionType,
          actionId,
          keyModifier,
        );
        return;
      }

      // If multiple actors are selected
      const controlledTokens = canvas.tokens.controlled.filter((token) =>
        knownCharacters.includes(token.actor?.type),
      );

      if (actionType === "utility" && actionId === "initiative") {
        this.#handleGroupInitiative(controlledTokens);
      } else {
        for (const token of controlledTokens) {
          const actor = token.actor;
          await this.#handleAction(
            event,
            actor,
            token,
            actionType,
            actionId,
            keyModifier,
          );
        }
      }
    }

    /**
     * Handle action hover
     * Called by Token Action HUD Core when an action is hovered on or off
     * @override
     * @param {object} event        The event
     * @param {string} encodedValue The encoded value
     */
    async handleActionHover(event, encodedValue) {}

    /**
     * Handle group click
     * Called by Token Action HUD Core when a group is right-clicked while the HUD is locked
     * @override
     * @param {object} event The event
     * @param {object} group The group
     */
    async handleGroupClick(event, group) {}

    /**
     * Handle action
     * @private
     * @param {object} event        The event
     * @param {object} actor        The actor
     * @param {object} token        The token
     * @param {string} actionType The action type id
     * @param {string} actionId     The actionId
     * @param {string} keyModifier     Which key is pressed (shift or alt)
     */
    async #handleAction(
      event,
      actor,
      token,
      actionType,
      actionId,
      keyModifier,
    ) {
      switch (actionType) {
        case "attributes":
          this.#handleAttributeAction(event, actor, actionId);
          break;
        case "skills":
          this.#handleSkillAction(event, actor, actionId);
          break;
        case "armor":
          this.#handleArmorAction(event, actor, actionId);
          break;
        case "weapon":
          this.#handleWeaponAction(event, actor, actionId, keyModifier);
          break;
        case "monsterAttack":
          this.#handleMonsterAttackAction(event, actor, actionId);
          break;
        case "action":
          this.#handleCombatAction(event, actor, actionId);
          break;
        case "spell":
          this.#handleSpellAction(event, actor, actionId);
          break;
        case "condition":
          this.#handleConditionAction(event, actor, actionId);
          break;
        case "consumable":
          this.#handleConsumableAction(event, actor, actionId);
          break;
        case "utility":
          this.#handleUtilityAction(actor, token, actionId);
          break;
      }
    }

    /**
     * Handle utility action
     * @private
     * @param {object} actor    The actor
     * @param {object} token    The token
     * @param {string} actionId The action id
     */
    async #handleUtilityAction(actor, token, actionId) {
      switch (actionId) {
        case "rests":
          actor.rest();
          break;
        case "pride":
          actor.sheet.rollPride();
          break;
        case "reputation":
          actor.sheet.rollReputation();
          break;
        case "initiative":
          const combatants = [...game.combat?.combatants?.entries()];
          if (combatants.length) {
            const pendingCombatants = combatants.filter(
              ([_key, combatant]) => !combatant.initiative,
            );
            const combatantId = pendingCombatants.find(
              ([_key, combatant]) => combatant.actorId === actor.id,
            )?.[0];
            if (combatantId) game.combat.rollInitiative(combatantId);
          }
          break;
        case "endTurn":
          if (game.combat?.current?.tokenId === token.id) {
            await game.combat?.nextTurn();
          }
          break;
      }
    }

    /**
     * Handle group initiative action
     * @private
     * @param {object} tokens    The tokens
     */
    async #handleGroupInitiative(tokens) {
      const combatants = [...game.combat?.combatants?.entries()];
      if (combatants.length) {
        const combatantsId = [];
        for (const token of tokens) {
          const actorId = token.document.actorId;
          const combatantId = combatants.find(
            ([_key, combatant]) => combatant.actorId === actorId,
          )?.[0];
          if (combatantId) combatantsId.push(combatantId);
        }
        if (combatantsId.length) game.combat.rollInitiative(combatantsId);
      }
    }

    /**
     * Handle attribute action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleAttributeAction(_event, actor, actionId) {
      actor.sheet.rollAttribute(actionId);
    }

    /**
     * Handle skill action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleSkillAction(_event, actor, actionId) {
      actor.sheet.rollSkill(actionId);
    }

    /**
     * Handle armor action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleArmorAction(_event, actor, actionId) {
      if (actionId === "all" || actionId === "monster") {
        actor.sheet.rollArmor();
      } else {
        actor.sheet.rollSpecificArmor(actionId);
      }
    }

    /**
     * Handle weapon action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     * @param {string} keyModifier     Which key is pressed (shift or alt)
     */
    #handleWeaponAction(_event, actor, actionId, keyModifier) {
      switch (keyModifier) {
        case "shift":
          actor.sheet.rollAction("parry", actionId);
          break;
        case "alt":
          actor.sheet.rollAction("disarm", actionId);
          break;
        default:
          actor.sheet.rollGear(actionId);
          break;
      }
    }

    /**
     * Handle monster attack
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleMonsterAttackAction(_event, actor, actionId) {
      if (actionId === "random") {
        actor.sheet.rollAttack();
      } else {
        actor.sheet.rollSpecificAttack(actionId);
      }
    }

    /**
     * Handle Combat action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleCombatAction(_event, actor, actionId) {
      actor.sheet.rollAction(actionId);
    }

    /**
     * Handle spell action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleSpellAction(_event, actor, actionId) {
      actor.sheet.rollSpell(actionId);
    }

    /**
     * Handle condition action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleConditionAction(_event, actor, actionId) {
      actor.toggleCondition(actionId);
    }

    /**
     * Handle consumable action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleConsumableAction(_event, actor, actionId) {
      actor.sheet.rollConsumable(actionId);
    }
  };
});
