export let RollHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
     */
    RollHandler = class RollHandler extends coreModule.api.RollHandler {
        /**
         * Handle action click
         * Called by Token Action HUD Core when an action is left or right-clicked
         * @override
         * @param {object} event        The event
         * @param {string} encodedValue The encoded value
         */
        async handleActionClick(event, encodedValue) {
            const [actionTypeId, actionId] = encodedValue.split('|')

            const renderable = ['item']

            if (renderable.includes(actionTypeId) && this.isRenderItem()) {
                return this.doRenderItem(this.actor, actionId)
            }

            const knownCharacters = ['character', 'monster']

            // If single actor is selected
            if (this.actor) {
                await this.#handleAction(event, this.actor, this.token, actionTypeId, actionId)
                return
            }

            // If multiple actors are selected
            const controlledTokens = canvas.tokens.controlled
                .filter((token) => knownCharacters.includes(token.actor?.type))

            if (actionTypeId === 'utility' && actionId === 'initiative') {
                this.#handleGroupInitiative(controlledTokens)
            } else {
                for (const token of controlledTokens) {
                    const actor = token.actor
                    await this.#handleAction(event, actor, token, actionTypeId, actionId)
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
         * @param {string} actionTypeId The action type id
         * @param {string} actionId     The actionId
         */
        async #handleAction(event, actor, token, actionTypeId, actionId) {
            switch (actionTypeId) {
                case 'attributes':
                    this.#handleAttributeAction(event, actor, actionId)
                    break
                case 'skills':
                    this.#handleSkillAction(event, actor, actionId)
                    break
                case 'armor':
                    this.#handleArmorAction(event, actor, actionId)
                    break
                case 'weapon':
                    this.#handleWeaponAction(event, actor, actionId)
                    break
                case 'monsterAttack':
                    this.#handleMonsterAttackAction(event, actor, actionId)
                    break
                case 'action':
                    this.#handleCombatAction(event, actor, actionId)
                    break
                case 'spell':
                    this.#handleSpellAction(event, actor, actionId)
                    break
                case 'condition':
                    this.#handleConditionAction(event, actor, actionId)
                    break
                case 'consumable':
                    this.#handleConsumableAction(event, actor, actionId)
                    break
                case 'utility':
                    this.#handleUtilityAction(actor, token, actionId)
                    break
            }
        }

        /**
         * Handle item action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleItemAction(event, actor, actionId) {
            const item = actor.items.get(actionId)
            item.toChat(event)
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
                case 'rests':
                    actor.rest();
                    break
                case 'pride':
                    actor.sheet.rollPride();
                    break;
                case 'reputation':
                    actor.sheet.rollReputation();
                    break;
                case 'initiative':
                    const combatants = [...game.combat?.combatants?.entries()]
                    if (combatants.length) {
                        const pendingCombatants = combatants.filter(([key, combatant]) => !combatant.initiative)
                        const combatantId = pendingCombatants.find(([key, combatant]) => combatant.actorId === actor.id)?.[0]
                        if (combatantId) game.combat.rollInitiative(combatantId);
                    }
                    break;
                case 'endTurn':
                    if (game.combat?.current?.tokenId === token.id) {
                        await game.combat?.nextTurn()
                    }
                    break
            }
        }

        /**
         * Handle group initiative action
         * @private
         * @param {object} tokens    The tokens
         */
        async #handleGroupInitiative(tokens) {
            const combatants = [...game.combat?.combatants?.entries()]
            if (combatants.length) {
                const combatantsId = [];
                for (const token of tokens) {
                    const actorId = token.document.actorId;
                    const combatantId = combatants.find(([key, combatant]) => combatant.actorId === actorId)?.[0];
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
        #handleAttributeAction(event, actor, actionId) {
            actor.sheet.rollAttribute(actionId);
        }

        /**
         * Handle skill action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleSkillAction(event, actor, actionId) {
            actor.sheet.rollSkill(actionId);
        }

        /**
         * Handle armor action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleArmorAction(event, actor, actionId) {
            if (actionId === 'all' || actionId === 'monster') {
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
         */
        #handleWeaponAction(event, actor, actionId) {
            actor.sheet.rollGear(actionId);
        }

        /**
         * Handle monster attack
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleMonsterAttackAction(event, actor, actionId) {
            if (actionId === 'random') {
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
        #handleCombatAction(event, actor, actionId) {
            actor.sheet.rollAction(actionId);
        }

        /**
         * Handle spell action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleSpellAction(event, actor, actionId) {
            actor.sheet.rollSpell(actionId);
        }

        /**
         * Handle condition action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleConditionAction(event, actor, actionId) {
            actor.toggleCondition(actionId);
        }

        /**
         * Handle consumable action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleConsumableAction(event, actor, actionId) {
            actor.sheet.rollConsumable(actionId);
        }
    }
})
