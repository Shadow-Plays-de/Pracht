import constants from './constants.mjs';

const MODULE_ID = constants.MODULE_ID;

/**
 * Calculates base Funke value (sum of two highest physical or mental attributes).
 * @param {Actor} actor
 * @returns {number}
 */
export function calculateFunkeBase(actor) {
    if (!actor?.system?.attributes) return 0;
    const attributes = actor.system.attributes;
    const attributeValues = [
        attributes.body?.base ?? 0,
        attributes.agility?.base ?? 0,
        attributes.reaction?.base ?? 0,
        attributes.strength?.base ?? 0,
        attributes.willpower?.base ?? 0,
        attributes.logic?.base ?? 0,
        attributes.intuition?.base ?? 0,
        attributes.charisma?.base ?? 0
    ];
    attributeValues.sort((a, b) => b - a);
    return (attributeValues[0] || 0) + (attributeValues[1] || 0);
}

/**
 * Retrieves current Funke modifier from actor.
 * @param {Actor} actor
 * @returns {number}
 */
export function getFunkeMod(actor) {
    if (!actor) return 0;
    const attrMod = actor.system?.attributes?.submersion?.mod;
    if (typeof attrMod === 'number' && !isNaN(attrMod)) return attrMod;
    const flagMod = typeof actor.getFlag === 'function' ? actor.getFlag(MODULE_ID, 'funkeMod') : 0;
    if (typeof flagMod === 'number' && !isNaN(flagMod)) return flagMod;
    return 0;
}

/**
 * Calculates total value for the "Funke" attribute (Base + Modifier).
 * @param {Actor} actor
 * @returns {number}
 */
export default function calculateFunke(actor) {
    const base = calculateFunkeBase(actor);
    const mod = getFunkeMod(actor);
    return base + mod;
}