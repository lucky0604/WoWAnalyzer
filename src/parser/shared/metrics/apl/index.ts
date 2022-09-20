import type Spell from 'common/SPELLS/Spell';
import {
  AnyEvent,
  EventType,
  UpdateSpellUsableEvent,
  CastEvent,
  BeginChannelEvent,
  UpdateSpellUsableType,
} from 'parser/core/Events';
import metric, { Info } from 'parser/core/metric';
import { ReactChild } from 'react';

export type PlayerInfo = Pick<Info, 'playerId' | 'combatant' | 'abilities'>;
export enum Tense {
  Past,
  Present,
}

/**
 * An event that triggers checking the APL. For instant cast spells and
 * abilities, this is `CastEvent`. For abilities with cast times,
 * `BeginChannelEvent` is used. This should be largely automatic because the
 * `BeginChannelEvent` comes first for cast-time spells and channels.
 */
export type AplTriggerEvent = CastEvent | BeginChannelEvent;

/**
 * A Condition can be used to determine whether a [[Rule]] can applies to the
 * current fight situation. See [[buffPresent]] for a simple example.
 *
 * Each condition must have an `init` function that creates an initial state
 * object, along with an `update` method that produces a *new* state object (it
 * should avoid mutation unless absolutely needed), and a `validate` method that
 * checks whether the condition applies to the current event.
 *
 * In the simplest case, T is `boolean` and `validate = (state, _event) => state`.
 **/
export interface Condition<T> {
  key: string;
  lookahead?: number;
  // produce the initial state object
  init: (info: PlayerInfo) => T;
  // Update the internal condition state
  update: (state: T, event: AnyEvent) => T;
  // validate whether the condition applies for the supplied event.
  validate: (state: T, event: AplTriggerEvent, spell: Spell, lookahead: AnyEvent[]) => boolean;
  // describe the condition. it should fit following "This rule was active because..."
  describe: (tense?: Tense) => ReactChild;
  // tooltip description for checklist
  tooltip?: () => ReactChild | undefined;
}
export type StateFor<T> = T extends (...args: any[]) => Condition<infer R> ? R : never;

/**
 * What kind of thing is being "targeted" by this APL rule. Usually, this is Spell, which means that you want them to cast a particular spell.
 * Sometimes, you will use SpellList instead, which means cast any of a list of spells.
 */
export enum TargetType {
  /**
   * Cast the specified spell.
   */
  Spell,
  /**
   * Cast *any of* the specified spells.
   */
  SpellList,
}

type SpellTarget = {
  type: TargetType.Spell;
  target: Spell;
};

type SpellListTarget = {
  type: TargetType.SpellList;
  target: Spell[];
};

export type AplTarget = SpellTarget | SpellListTarget;

export type InternalRule = {
  spell: AplTarget;
  condition?: Condition<any>;
};

export interface ConditionalRule {
  spell: Spell | Spell[];
  condition: Condition<any>;
}

export type Rule = Spell | Spell[] | ConditionalRule;

export interface Apl {
  conditions?: Array<Condition<any>>;
  rules: InternalRule[];
}

/**
 * Convert an external rule to an internal rule.
 *
 * Internal rules have a more rigid format to make the rest of the code easier to maintain.
 */
function internalizeRule(rule: Rule): InternalRule {
  if ('condition' in rule) {
    // conditional rule
    const { spell } = internalizeRule(rule.spell);

    return { ...rule, spell };
  } else {
    if (Array.isArray(rule)) {
      // spell list
      return {
        spell: {
          type: TargetType.SpellList,
          target: rule,
        },
      };
    } else {
      // spell object, not a list
      return {
        spell: {
          type: TargetType.Spell,
          target: rule,
        },
      };
    }
  }
}

/**
 * Build an APL from a list of Rule objects.
 *
 * Use this instead of direct construction because it will maintain the
 * `conditions` key for you automatically.
 */
export function build(rules: Rule[]): Apl {
  const conditionMap = rules
    .filter((rule) => 'condition' in rule)
    .map((rule) => (rule as ConditionalRule).condition)
    .reduce((cnds: { [k: string]: Condition<any> }, cnd) => {
      cnds[cnd.key] = cnd;
      return cnds;
    }, {});
  const conditions = Object.values<Condition<any>>(conditionMap);

  const internalRules = rules.map(internalizeRule);

  return { rules: internalRules, conditions };
}

export enum ResultKind {
  Success,
  Violation,
}

export interface Violation {
  kind: ResultKind.Violation;
  actualCast: AplTriggerEvent;
  /**
   * The list of spells that could have been cast to satisfy the rule. Does not include spells that were on cooldown.
   */
  expectedCast: Spell[];
  rule: InternalRule;
}

type ConditionState = { [key: string]: any };
type AbilityState = { [spellId: number]: UpdateSpellUsableEvent };

export interface Success {
  kind: ResultKind.Success;
  rule: InternalRule;
  actualCast: AplTriggerEvent;
}

interface CheckState {
  successes: Success[];
  violations: Violation[];
  conditionState: ConditionState;
  abilityState: AbilityState;
  mostRecentBeginCast?: BeginChannelEvent;
}

export type CheckResult = Pick<CheckState, 'successes' | 'violations'>;

function initState(apl: Apl, info: PlayerInfo): ConditionState {
  return (
    apl.conditions?.reduce((state: ConditionState, cnd: Condition<any>) => {
      state[cnd.key] = cnd.init(info);
      return state;
    }, {}) || {}
  );
}

function updateState(apl: Apl, oldState: ConditionState, event: AnyEvent): ConditionState {
  return (
    apl.conditions?.reduce((state: ConditionState, cnd: Condition<any>) => {
      state[cnd.key] = cnd.update(oldState[cnd.key], event);
      return state;
    }, {}) || {}
  );
}

/**
 * If `tense` is `Tense.Present`, return `a`. Otherwise `b`.
 **/
export function tenseAlt<T>(tense: Tense | undefined, a: T, b: T): T {
  return tense === Tense.Present ? a : b;
}
export const spells = (rule: InternalRule): Spell[] =>
  rule.spell.type === TargetType.SpellList ? rule.spell.target : [rule.spell.target];

export function lookaheadSlice(
  events: AnyEvent[],
  startIx: number,
  duration: number | undefined,
): AnyEvent[] {
  if (!duration) {
    return [];
  }

  const event = events[startIx];
  const future = events.slice(startIx);
  const laterIndex = future.findIndex(({ timestamp }) => timestamp > event.timestamp + duration);
  if (laterIndex > 0) {
    return future.slice(0, laterIndex);
  } else {
    return future;
  }
}

/**
 * Check whether a rule applies to the given cast. There are two checks:
 *
 * 1. The spell the rule governs is available, and
 * 2. The condition for the rule is validated *or* the rule is unconditional.
 *
 * Note that if a spell is cast that we think is unavailable, we'll assume our data is stale and apply the rule anyway.
 *
 * @returns false when no spells are available. Otherwise, the list of available spells.
 **/
function ruleApplies(
  rule: InternalRule,
  abilities: Set<number>,
  result: CheckState,
  events: AnyEvent[],
  eventIndex: number,
): Spell[] | false {
  const event = events[eventIndex];
  if (event.type !== EventType.Cast && event.type !== EventType.BeginChannel) {
    console.error('attempted to apply APL rule to non-cast event, ignoring', event);
    return false;
  }
  const availableSpells = spells(rule).filter(
    (spell) =>
      abilities.has(spell.id) &&
      (spell.id === event.ability.guid ||
        result.abilityState[spell.id] === undefined ||
        result.abilityState[spell.id].isAvailable) &&
      (rule.condition?.validate(
        result.conditionState[rule.condition.key],
        event,
        spell,
        lookaheadSlice(events, eventIndex, rule.condition.lookahead),
      ) ??
        true),
  );

  if (availableSpells.length === 0) {
    return false;
  }

  return availableSpells;
}

type ApplicableRule = {
  rule: InternalRule;
  availableSpells: Spell[];
};

/**
 * Find the first applicable rule. See also: `ruleApplies`
 **/
function applicableRule(
  apl: Apl,
  abilities: Set<number>,
  result: CheckState,
  events: AnyEvent[],
  eventIndex: number,
): ApplicableRule | undefined {
  for (const rule of apl.rules) {
    const availableSpells = ruleApplies(rule, abilities, result, events, eventIndex);
    if (availableSpells !== false) {
      return { rule, availableSpells };
    }
  }
}

function updateAbilities(state: AbilityState, event: AnyEvent): AbilityState {
  if (event.type === EventType.UpdateSpellUsable) {
    state[event.ability.guid] = event;
  }
  return state;
}

const aplCheck = (apl: Apl) =>
  metric<[PlayerInfo], CheckResult>((events, info) => {
    // sort event history. this is a workaround for event dispatch happening
    // out of order, mostly due to SpellUsable. eventually that will be made a
    // normalizer and this can go away.
    events.sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        if (
          a.type === EventType.Cast &&
          b.type === EventType.UpdateSpellUsable &&
          b.updateType === UpdateSpellUsableType.EndCooldown
        ) {
          return 1;
        } else {
          return 0;
        }
      } else {
        return a.timestamp - b.timestamp;
      }
    });

    // rules for spells that aren't known are automatically ignored
    const abilities = new Set(
      info.abilities
        .filter((ability) => ability.enabled)
        .flatMap((ability) =>
          typeof ability.spell === 'number' ? [ability.spell] : ability.spell,
        ),
    );
    const applicableSpells = new Set(
      apl.rules.flatMap((rule) => spells(rule)).map((spell) => spell.id),
    );

    return events.reduce<CheckState>(
      (result, event, eventIndex) => {
        if (
          (event.type === EventType.BeginChannel ||
            (event.type === EventType.Cast &&
              event.ability.guid !== result.mostRecentBeginCast?.ability.guid)) &&
          applicableSpells.has(event.ability.guid)
        ) {
          const applicable = applicableRule(apl, abilities, result, events, eventIndex);
          if (applicable) {
            const { rule, availableSpells } = applicable;

            if (
              spells(rule).some(
                (spell) =>
                  result.abilityState[spell.id] !== undefined &&
                  !result.abilityState[spell.id].isAvailable,
              ) &&
              process.env.NODE_ENV === 'development'
            ) {
              console.warn(
                'inconsistent ability state in APL checker:',
                spells(rule).map((spell) => result.abilityState[spell.id]),
                rule,
                event,
              );
            }
            if (spells(rule).some((spell) => spell.id === event.ability.guid)) {
              // the player cast the correct spell
              result.successes.push({ rule, actualCast: event, kind: ResultKind.Success });
            } else if (
              info.combatant === undefined ||
              event.timestamp >= info.combatant.owner.fight.start_time
            ) {
              // condition prevents punishing precast spells
              result.violations.push({
                kind: ResultKind.Violation,
                rule,
                expectedCast: availableSpells,
                actualCast: event,
              });
            }
          }
        }

        if (event.type === EventType.BeginChannel) {
          result.mostRecentBeginCast = event;
        } else if (event.type === EventType.EndChannel) {
          result.mostRecentBeginCast = undefined;
        }

        result.abilityState = updateAbilities(result.abilityState, event);
        result.conditionState = updateState(apl, result.conditionState, event);

        return result;
      },
      { successes: [], violations: [], abilityState: {}, conditionState: initState(apl, info) },
    );
  });

export default aplCheck;
