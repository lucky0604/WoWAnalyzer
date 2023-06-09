import SPELLS from 'common/SPELLS/classic/warlock';
import CoreAbilities from 'parser/core/modules/Abilities';
import SPELL_CATEGORY from 'parser/core/SPELL_CATEGORY';

class Abilities extends CoreAbilities {
  nemesisCD(spellId: number, demoPoints: number, cooldown: number) {
    if (spellId === SPELLS.FEL_DOMINATION.id || SPELLS.DEMONIC_EMPOWERMENT.id) {
      if (demoPoints >= 43) {return cooldown * 0.7;}
      if (demoPoints === 42) {return cooldown * 0.8;}
      if (demoPoints === 41) {return cooldown * 0.9;}
    }
    if (spellId === SPELLS.METAMORPHOSIS.id) {
      if (demoPoints >= 54) {return cooldown * 0.7;}
      if (demoPoints === 53) {return cooldown * 0.8;}
      if (demoPoints === 52) {return cooldown * 0.9;}
    }
    return cooldown;
  }

  spellbook() {
    const demoPoints = this.selectedCombatant.talentPoints[1];
    return [
      // Rotational
      {
        spell: [SPELLS.SHADOW_BOLT.id, ...SPELLS.SHADOW_BOLT.lowRanks],
        category: SPELL_CATEGORY.ROTATIONAL,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.CORRUPTION.id, ...SPELLS.CORRUPTION.lowRanks],
        category: SPELL_CATEGORY.ROTATIONAL,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.CURSE_OF_AGONY.id, ...SPELLS.CURSE_OF_AGONY.lowRanks],
        category: SPELL_CATEGORY.ROTATIONAL,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.IMMOLATE.id, ...SPELLS.IMMOLATE.lowRanks],
        category: SPELL_CATEGORY.ROTATIONAL,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.INCINERATE.id, ...SPELLS.INCINERATE.lowRanks],
        category: SPELL_CATEGORY.ROTATIONAL,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.SOUL_FIRE.id, ...SPELLS.SOUL_FIRE.lowRanks],
        category: SPELL_CATEGORY.ROTATIONAL,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.LIFE_TAP.id, ...SPELLS.LIFE_TAP.lowRanks],
        category: SPELL_CATEGORY.ROTATIONAL,
        gcd: { base: 1500 },
      },
      // Rotational AOE
      {
        spell: [SPELLS.SEED_OF_CORRUPTION.id],
        category: SPELL_CATEGORY.ROTATIONAL_AOE,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.SHADOWFLAME.id, ...SPELLS.SHADOWFLAME.lowRanks],
        category: SPELL_CATEGORY.ROTATIONAL_AOE,
        gcd: { base: 1500 },
      },
      // Cooldowns
      {
        spell: [SPELLS.DEMONIC_EMPOWERMENT.id],
        enabled: demoPoints >= 30,
        category: SPELL_CATEGORY.COOLDOWNS,
        gcd: null,
        cooldown: this.nemesisCD(SPELLS.DEMONIC_EMPOWERMENT.id, demoPoints, 60),
      },
      {
        spell: [SPELLS.METAMORPHOSIS.id],
        enabled: demoPoints >= 50,
        category: SPELL_CATEGORY.COOLDOWNS,
        gcd: null,
        cooldown: this.nemesisCD(SPELLS.METAMORPHOSIS.id, demoPoints, 180),
      },
      {
        spell: [SPELLS.IMMOLATION_AURA.id],
        enabled: demoPoints >= 50,
        category: SPELL_CATEGORY.COOLDOWNS,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.SHADOW_CLEAVE.id],
        enabled: demoPoints >= 50,
        category: SPELL_CATEGORY.COOLDOWNS,
        gcd: null,
      },
      // Defensive
      {
        spell: [SPELLS.SOULSHATTER.id],
        category: SPELL_CATEGORY.DEFENSIVE,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.DEATH_COIL.id, ...SPELLS.DEATH_COIL.lowRanks],
        category: SPELL_CATEGORY.DEFENSIVE,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.SHADOW_WARD.id, ...SPELLS.SHADOW_WARD.lowRanks],
        category: SPELL_CATEGORY.DEFENSIVE,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.BANISH.id, ...SPELLS.BANISH.lowRanks],
        category: SPELL_CATEGORY.DEFENSIVE,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.FEAR.id, ...SPELLS.FEAR.lowRanks],
        category: SPELL_CATEGORY.DEFENSIVE,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.HOWL_OF_TERROR.id, ...SPELLS.HOWL_OF_TERROR.lowRanks],
        category: SPELL_CATEGORY.DEFENSIVE,
        gcd: { base: 1500 },
      },
      // Other spells (not apart of the normal rotation)
      {
        spell: [SPELLS.CURSE_OF_DOOM.id, ...SPELLS.CURSE_OF_DOOM.lowRanks],
        category: SPELL_CATEGORY.OTHERS,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.DRAIN_SOUL.id, ...SPELLS.DRAIN_SOUL.lowRanks],
        category: SPELL_CATEGORY.OTHERS,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.SEARING_PAIN.id, ...SPELLS.SEARING_PAIN.lowRanks],
        category: SPELL_CATEGORY.OTHERS,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.HELLFIRE.id, ...SPELLS.HELLFIRE.lowRanks],
        category: SPELL_CATEGORY.OTHERS,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.RAIN_OF_FIRE.id, ...SPELLS.RAIN_OF_FIRE.lowRanks],
        category: SPELL_CATEGORY.OTHERS,
        gcd: { base: 1500 },
      },
      // Utility
      {
        spell: [SPELLS.CURSE_OF_THE_ELEMENTS.id, ...SPELLS.CURSE_OF_THE_ELEMENTS.lowRanks],
        category: SPELL_CATEGORY.UTILITY,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.DEMONIC_CIRCLE_SUMMON.id],
        category: SPELL_CATEGORY.UTILITY,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.DEMONIC_CIRCLE_TELEPORT.id],
        category: SPELL_CATEGORY.UTILITY,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.DRAIN_LIFE.id, ...SPELLS.DRAIN_LIFE.lowRanks],
        category: SPELL_CATEGORY.UTILITY,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.SOUL_LINK.id],
        enabled: demoPoints >= 10,
        category: SPELL_CATEGORY.UTILITY,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.CHALLENGING_HOWL.id],
        enabled: demoPoints >= 50,
        category: SPELL_CATEGORY.UTILITY,
        gcd: { base: 1500 },
      },
      // Pet Related
      {
        spell: [SPELLS.FEL_DOMINATION.id],
        enabled: demoPoints >= 10,
        category: SPELL_CATEGORY.UTILITY,
        gcd: null,
      },
      {
        spell: [SPELLS.HEALTH_FUNNEL.id, ...SPELLS.HEALTH_FUNNEL.lowRanks],
        category: SPELL_CATEGORY.UTILITY,
        gcd: { base: 1500 },
      },
      {
        spell: [SPELLS.SUMMON_FELGUARD.id],
        enabled: demoPoints >= 40,
        category: SPELL_CATEGORY.UTILITY,
        gcd: { base: 1500 },
      },
      // Consumable
    ];
  }
}

export default Abilities;
