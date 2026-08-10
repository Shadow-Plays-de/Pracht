import calculateFunke, { calculateFunkeBase, getFunkeMod } from '../../lib/pracht.mjs';
import constants from '../../lib/constants.mjs';

const MODULE_ID = constants.MODULE_ID;

/**
 * Finds the system's SR5CharacterSheet class reliably across CONFIG and Actors collections.
 */
export function getSR5CharacterSheetClass() {
    // 1. Search CONFIG.Actor.sheetClasses
    if (CONFIG.Actor?.sheetClasses) {
        for (const typeKey of Object.keys(CONFIG.Actor.sheetClasses)) {
            const sheetMap = CONFIG.Actor.sheetClasses[typeKey];
            if (!sheetMap) continue;
            for (const key of Object.keys(sheetMap)) {
                const entry = sheetMap[key];
                const cls = entry?.cls || (typeof entry === 'function' ? entry : null);
                if (cls && (cls.name === 'SR5CharacterSheet' || cls.prototype?.constructor?.name === 'SR5CharacterSheet')) {
                    return cls;
                }
            }
        }
    }

    // 2. Search DocumentSheetConfig registered sheets
    try {
        const DocumentSheetConfig = foundry.applications?.apps?.DocumentSheetConfig;
        if (DocumentSheetConfig?.getRegisteredSheets) {
            const registered = DocumentSheetConfig.getRegisteredSheets(Actor);
            for (const cls of (registered || [])) {
                if (cls && (cls.name === 'SR5CharacterSheet' || cls.prototype?.constructor?.name === 'SR5CharacterSheet')) {
                    return cls;
                }
            }
        }
    } catch (e) {}

    // 3. Search Actors.registeredSheets
    try {
        const registered = foundry.documents.collections.Actors?.registeredSheets || Actors?.registeredSheets;
        if (registered) {
            for (const cls of registered) {
                if (cls && (cls.name === 'SR5CharacterSheet' || cls.prototype?.constructor?.name === 'SR5CharacterSheet')) {
                    return cls;
                }
            }
        }
    } catch (e) {}

    // 4. Fallback: inspect character actor sheet instances
    if (game.actors) {
        for (const actor of game.actors) {
            if (actor.type === 'character' && actor.sheet) {
                const cls = actor.sheet.constructor;
                if (cls && cls.name !== 'ActorSheet') {
                    return cls;
                }
            }
        }
    }

    return null;
}

let isPrachtSheetRegistered = false;

/**
 * Subclasses SR5CharacterSheet to natively add the Pracht tab for character actors.
 */
export function registerPrachtCharacterSheet() {
    if (isPrachtSheetRegistered) return true;

    const SR5CharacterSheet = getSR5CharacterSheetClass();

    if (!SR5CharacterSheet) {
        console.error(`${MODULE_ID} | SR5CharacterSheet class could not be found to extend!`);
        return false;
    }

    class PrachtCharacterSheet extends SR5CharacterSheet {
        static get DEFAULT_OPTIONS() {
            return {
                ...super.DEFAULT_OPTIONS,
                actions: {
                    ...super.DEFAULT_OPTIONS?.actions,
                    adjustFunkeMod: PrachtCharacterSheet.#adjustFunkeMod
                }
            };
        }

        static async #adjustFunkeMod(event) {
            event.preventDefault();
            const btn = event.target.closest('[data-delta]');
            if (!btn) return;
            const delta = parseInt(btn.dataset.delta, 10);
            if (isNaN(delta) || delta === 0) return;

            const currentMod = getFunkeMod(this.actor);
            const newMod = currentMod + delta;

            await this.actor.update({
                'system.attributes.submersion.mod': newMod,
                [`flags.${MODULE_ID}.funkeMod`]: newMod
            });
        }

        static get TABS() {
            const tabs = foundry.utils.deepClone(super.TABS);
            if (tabs?.primary?.tabs) {
                const skillsIdx = tabs.primary.tabs.findIndex(t => t.id === 'skills');
                const prachtTab = {
                    id: 'pracht',
                    label: '',
                    icon: 'fas fa-sun',
                    tooltip: '',
                    cssClass: 'skinny'
                };
                if (skillsIdx !== -1) {
                    tabs.primary.tabs.splice(skillsIdx + 1, 0, prachtTab);
                } else {
                    tabs.primary.tabs.push(prachtTab);
                }
            }
            return tabs;
        }

        static get PARTS() {
            return {
                ...super.PARTS,
                pracht: {
                    template: 'modules/sr5-pracht/templates/actor/tabs/pracht.hbs',
                    templates: [
                        'systems/shadowrun5e/dist/templates/v2/list-items/action/header.hbs',
                        'systems/shadowrun5e/dist/templates/v2/list-items/action/item.hbs'
                    ],
                    scrollable: ['#pracht-actions-scroll']
                }
            };
        }

        async _preparePartContext(partId, context, options) {
            const partContext = await super._preparePartContext(partId, context, options);

            if (partId === 'pracht') {
                partContext.prachtValue = this.actor.system?.attributes?.resonance?.base ?? 0;
                partContext.funkeBase = calculateFunkeBase(this.actor);
                partContext.funkeMod = getFunkeMod(this.actor);
                partContext.funkeValue = calculateFunke(this.actor);
                partContext.funkeModFormatted = partContext.funkeMod > 0 ? `+${partContext.funkeMod}` : `${partContext.funkeMod}`;
                partContext.prachtActions = await this._preparePrachtActions();
            }

            return partContext;
        }

        async _preparePrachtActions() {
            const actions = this.actor.itemsForType?.get('action') 
                || this.actor.items.filter(i => i.type === 'action');

            const prachtActions = [];
            const isResonanceWord = (str) => {
                if (typeof str !== 'string') return false;
                const lower = str.toLowerCase();
                return lower.includes('resonance') || lower.includes('resonanz') || lower.includes('pracht') || lower.includes('funke');
            };

            for (const item of actions) {
                const actionData = item.system?.action;
                if (!actionData) continue;

                const hasCategory = (typeof item.hasActionCategory === 'function' && (
                    item.hasActionCategory('resonance') || 
                    item.hasActionCategory('pracht') || 
                    item.hasActionCategory('funke')
                )) || (Array.isArray(actionData.categories) && actionData.categories.some(isResonanceWord));

                const usesAttribute = isResonanceWord(actionData.attribute) 
                    || isResonanceWord(actionData.attribute2) 
                    || isResonanceWord(actionData.limit?.attribute);

                if (hasCategory || usesAttribute) {
                    const enrichedDesc = item.system?.description?.value 
                        ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(item.system.description.value) 
                        : '';

                    prachtActions.push({
                        name: item.name,
                        description: enrichedDesc,
                        action: item
                    });
                }
            }

            const sortFn = foundry.utils.Helpers?.sortByName?.bind(foundry.utils.Helpers) 
                || ((a, b) => a.name.localeCompare(b.name));
            return prachtActions.sort(sortFn);
        }
    }

    foundry.documents.collections.Actors.registerSheet("sr5-pracht", PrachtCharacterSheet, {
        label: "SR5-Pracht Character Sheet",
        makeDefault: true,
        types: ['character']
    });

    isPrachtSheetRegistered = true;
    console.log(`${MODULE_ID} | Successfully registered PrachtCharacterSheet for character actors`);
    return true;
}
