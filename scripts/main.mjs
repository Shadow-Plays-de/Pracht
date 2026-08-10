import '../styles/pracht.css';
import calculateFunke, { calculateFunkeBase, getFunkeMod } from './lib/pracht.mjs';
import constants from './lib/constants.mjs';
import { registerPrachtCharacterSheet } from './actor/sheet/prachtSheet.mjs';

const MODULE_ID = constants.MODULE_ID;

/**
 * Overrides system translation strings for Resonanz -> Pracht and Wandlung/Submersion -> Funke.
 */
function overrideSystemTranslations() {
    if (game.i18n?.translations?.SR5) {
        game.i18n.translations.SR5.AttrResonance = "Pracht";
        game.i18n.translations.SR5.Submersion = "Funke";
        game.i18n.translations.SR5.Emerged = "Pracht";
        if (game.i18n.translations.SR5.ActionCategory) {
            game.i18n.translations.SR5.ActionCategory.Resonance = "Pracht";
        }
    }
}

/**
 * Wraps SR5Actor prepareDerivedData to ensure system.attributes.submersion.base
 * & value reflect base Funke (sum of 2 highest attributes), while modifiers are applied during test prep.
 */
function setupActorDataPrep() {
    const SR5ActorClass = CONFIG.Actor?.documentClass || Actor;
    if (SR5ActorClass && SR5ActorClass.prototype) {
        const originalPrepareDerivedData = SR5ActorClass.prototype.prepareDerivedData;
        SR5ActorClass.prototype.prepareDerivedData = function() {
            if (originalPrepareDerivedData) {
                originalPrepareDerivedData.call(this);
            }

            if (this.type === 'character' && this.system?.attributes) {
                const funkeBase = calculateFunkeBase(this);
                if (this.system.attributes.submersion) {
                    this.system.attributes.submersion.base = funkeBase;
                    this.system.attributes.submersion.value = funkeBase;
                }
                if (this.system.technomancer) {
                    this.system.technomancer.submersion = funkeBase;
                }
            }
        };
        console.log(`${MODULE_ID} | Hooked SR5Actor.prototype.prepareDerivedData for Funke base calculation`);
    }
}

Hooks.once('init', function() {
    console.log(`${MODULE_ID} | Initializing SR5 Pracht Module`);
});

// Register sheet, translation overrides & actor prep on setup hook
Hooks.once('setup', function() {
    overrideSystemTranslations();
    setupActorDataPrep();
    registerPrachtCharacterSheet();
});

Hooks.once('ready', async function() {
    console.log(`${MODULE_ID} | SR5 Pracht Module is Ready`);
    
    overrideSystemTranslations();
    setupActorDataPrep();
    registerPrachtCharacterSheet();

    for (const actor of game.actors) {
        if (actor.type === 'character') {
            const funkeBase = calculateFunkeBase(actor);
            if (actor.system?.attributes?.submersion?.base !== funkeBase || actor.system?.attributes?.submersion?.value !== funkeBase) {
                await actor.update({ 
                    'system.attributes.submersion.base': funkeBase,
                    'system.attributes.submersion.value': funkeBase,
                    'system.technomancer.submersion': funkeBase
                });
            }
        }
    }
});

Hooks.on('createActor', async (actor, options, userId) => {
    if (userId !== game.user.id) return;

    if (actor.type === 'character') {
        console.log(`${MODULE_ID} | New character created. Calculating initial Funke base value.`);
        const funkeBase = calculateFunkeBase(actor);
        
        await actor.update({ 
            'system.attributes.submersion.base': funkeBase,
            'system.attributes.submersion.value': funkeBase,
            'system.technomancer.submersion': funkeBase
        });
    }
});

Hooks.on('preUpdateActor', async (actor, changes) => {
    if (actor.type !== 'character') return;

    const freshActor = await fromUuid(actor.uuid);
    if (!freshActor) return;

    const prachtChangePath = 'system.attributes.resonance.base';
    if (foundry.utils.hasProperty(changes, prachtChangePath)) {
        let prachtValue = foundry.utils.getProperty(changes, prachtChangePath);
        const sanitizedPracht = parseInt(prachtValue, 10);
        foundry.utils.setProperty(changes, prachtChangePath, isNaN(sanitizedPracht) ? 0 : sanitizedPracht);
    }

    const relevantChange = Object.keys(foundry.utils.flattenObject(changes)).some(key => 
        key.startsWith('system.attributes') &&
        key.endsWith('.base') &&
        !key.includes('submersion')
    );

    if (relevantChange) {
        const updatedActorData = foundry.utils.mergeObject(freshActor.toObject(), changes);
        const tempActor = new Actor.implementation(updatedActorData); 
        const newFunkeBase = calculateFunkeBase(tempActor);
        
        foundry.utils.setProperty(changes, 'system.attributes.submersion.base', newFunkeBase);
        foundry.utils.setProperty(changes, 'system.attributes.submersion.value', newFunkeBase);
        foundry.utils.setProperty(changes, 'system.technomancer.submersion', newFunkeBase);
    }
});

// Hook into SR5 test preparation to attach the Funke modifier directly to test pools with a localized label
Hooks.on('sr5_testPrepareBaseValues', (test) => {
    if (!test || !test.actor || test.actor.type !== 'character') return;

    const attr1 = test.data?.attribute1 || test.data?.attribute || test.data?.action?.attribute;
    const attr2 = test.data?.attribute2 || test.data?.action?.attribute2;
    const action = test.action || test.data?.action;

    const isSubmersionTest = attr1 === 'submersion' || attr1 === 'resonance' || attr2 === 'submersion' || attr2 === 'resonance';

    const isResonanceWord = (str) => {
        if (typeof str !== 'string') return false;
        const lower = str.toLowerCase();
        return lower.includes('resonance') || lower.includes('resonanz') || lower.includes('pracht') || lower.includes('funke');
    };

    const isPrachtAction = action && (
        isResonanceWord(action.attribute) ||
        isResonanceWord(action.attribute2) ||
        isResonanceWord(action.limit?.attribute) ||
        (Array.isArray(action.categories) && action.categories.some(isResonanceWord))
    );

    if (isSubmersionTest || isPrachtAction) {
        const funkeMod = getFunkeMod(test.actor);
        if (funkeMod !== 0 && test.data?.pool) {
            const label = game.i18n?.localize('SR5-Pracht.FunkeModLabel') || 'Funke-Modifikator';

            const ModifiableValueClass = foundry.utils.getProperty(game, 'shadowrun5e.modifiers') 
                || globalThis.ModifiableValue;

            if (ModifiableValueClass && typeof ModifiableValueClass.addUnique === 'function') {
                ModifiableValueClass.addUnique(test.data.pool, label, funkeMod);
                if (typeof ModifiableValueClass.calcTotal === 'function') {
                    ModifiableValueClass.calcTotal(test.data.pool, { min: 0 });
                }
            } else {
                const modeAdd = (typeof CONST !== 'undefined' && CONST.ACTIVE_EFFECT_MODES?.ADD) ?? 2;
                if (!Array.isArray(test.data.pool.changes)) test.data.pool.changes = [];
                let existing = test.data.pool.changes.find(c => c.name === label);
                if (existing) {
                    existing.value = funkeMod;
                    existing.enabled = true;
                    existing.mode = modeAdd;
                    delete existing.source;
                    delete existing.invalidated;
                } else {
                    test.data.pool.changes.push({
                        name: label,
                        value: funkeMod,
                        mode: modeAdd,
                        priority: 20,
                        enabled: true
                    });
                }

                let modSum = 0;
                for (const c of test.data.pool.changes) {
                    if (c.enabled !== false && !c.invalidated) {
                        modSum += Number(c.value || 0);
                    }
                }
                test.data.pool.mod = modSum;
                test.data.pool.value = Math.max(0, (test.data.pool.base || 0) + modSum);
            }
        }
    }
});

// Hook into test completion for Pracht/Funke actions to adjust Funke modifier on missed successes
Hooks.on('sr5_afterTestComplete', async (test) => {
    if (!test || !test.actor || test.actor.type !== 'character') return;

    const action = test.action || test.data?.action;
    if (!action) return;

    const isResonanceWord = (str) => {
        if (typeof str !== 'string') return false;
        const lower = str.toLowerCase();
        return lower.includes('resonance') || lower.includes('resonanz') || lower.includes('pracht') || lower.includes('funke');
    };

    const isPrachtAction = isResonanceWord(action.attribute) ||
        isResonanceWord(action.attribute2) ||
        isResonanceWord(action.limit?.attribute) ||
        (Array.isArray(action.categories) && action.categories.some(isResonanceWord));

    if (isPrachtAction) {
        const hits = test.hits ?? test.result?.hits ?? 0;
        const threshold = test.threshold ?? test.data?.threshold ?? 0;
        
        if (threshold > 0 && hits < threshold) {
            const missed = threshold - hits;
            const currentMod = getFunkeMod(test.actor);
            const newMod = currentMod - missed;

            await test.actor.update({
                'system.attributes.submersion.mod': newMod,
                [`flags.${MODULE_ID}.funkeMod`]: newMod
            });
            console.log(`${MODULE_ID} | Action test missed by ${missed}. Reduced Funke modifier to ${newMod}`);
        }
    }
});