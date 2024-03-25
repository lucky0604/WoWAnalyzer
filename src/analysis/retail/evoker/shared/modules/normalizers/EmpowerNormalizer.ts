import TALENTS from 'common/TALENTS/evoker';
import {
  AnyEvent,
  CastEvent,
  EmpowerEndEvent,
  EventType,
  GetRelatedEvent,
  HasRelatedEvent,
} from 'parser/core/Events';
import { Options } from 'parser/core/Module';
import EventLinkNormalizer, { EventLink } from 'parser/core/EventLinkNormalizer';
import { EMPOWERS } from '../../constants';

export const TIP_THE_SCALES_CONSUME = 'TipTheScalesConsume';
export const EMPOWERED_CAST = 'EmpoweredCast';

const EMPOWERED_CAST_BUFFER = 6000;
const TIP_THE_SCALES_CONSUME_BUFFER = 25;

const EVENT_LINKS: EventLink[] = [
  {
    linkRelation: TIP_THE_SCALES_CONSUME,
    reverseLinkRelation: TIP_THE_SCALES_CONSUME,
    linkingEventId: TALENTS.TIP_THE_SCALES_TALENT.id,
    linkingEventType: [EventType.RemoveBuff, EventType.RemoveBuffStack],
    referencedEventId: EMPOWERS,
    referencedEventType: EventType.Cast,
    anyTarget: true,
    forwardBufferMs: TIP_THE_SCALES_CONSUME_BUFFER,
    backwardBufferMs: TIP_THE_SCALES_CONSUME_BUFFER,
    maximumLinks: 1,
    isActive(c) {
      return c.hasTalent(TALENTS.TIP_THE_SCALES_TALENT);
    },
  },
  {
    linkRelation: EMPOWERED_CAST,
    reverseLinkRelation: EMPOWERED_CAST,
    linkingEventId: EMPOWERS,
    linkingEventType: EventType.EmpowerEnd,
    referencedEventId: EMPOWERS,
    referencedEventType: EventType.Cast,
    /** We only look backwards from the empowerEnd event to not accidentally add the link to a cancelled cast */
    backwardBufferMs: EMPOWERED_CAST_BUFFER,
    anyTarget: true,
    maximumLinks: 1,
    additionalCondition(linkingEvent, referencedEvent) {
      return (
        (linkingEvent as EmpowerEndEvent).ability.guid ===
        (referencedEvent as CastEvent).ability.guid
      );
    },
  },
];

/** Creates links between cast Events and EmpowerEnd events for Empowers which can then be
 * used to verify whether the cast was finished or cancelled - will also create links between
 * Empower cast that consumed Tip the Scales.
 *
 * Empowers cast with Tip the Scales doesn't produce an EmpowerEnd event, only Cast event
 * so we will also create fabricate the missing EmpowerEnd events. */
class EmpowerNormalizer extends EventLinkNormalizer {
  constructor(options: Options) {
    super(options, EVENT_LINKS);
    this.priority -= 100;
  }

  /** Create EmpowerEnd events for Empowers cast with Tip the Scales
   * Also creates EMPOWERED_CAST link between the Cast and EmpowerEnd event */
  normalize(rawEvents: AnyEvent[]): AnyEvent[] {
    const events = super.normalize(rawEvents);
    const fixedEvents: any[] = [];
    const hasFont =
      this.owner.selectedCombatant.hasTalent(TALENTS.FONT_OF_MAGIC_AUGMENTATION_TALENT) ||
      this.owner.selectedCombatant.hasTalent(TALENTS.FONT_OF_MAGIC_DEVASTATION_TALENT) ||
      this.owner.selectedCombatant.hasTalent(TALENTS.FONT_OF_MAGIC_PRESERVATION_TALENT);

    events.forEach((event) => {
      if (event.type !== EventType.Cast || !isFromTipTheScales(event)) {
        fixedEvents.push(event);
        return;
      }

      const currentLinks = event._linkedEvents ?? [];
      const fabricatedEvent: EmpowerEndEvent = {
        ...event,
        type: EventType.EmpowerEnd,
        empowermentLevel: hasFont ? 4 : 3,
        __fabricated: true,
        _linkedEvents: [{ relation: EMPOWERED_CAST, event: event }],
      };

      event._linkedEvents = [...currentLinks, { relation: EMPOWERED_CAST, event: fabricatedEvent }];

      fixedEvents.push(event);
      fixedEvents.push(fabricatedEvent);
    });
    return fixedEvents;
  }
}

/** Returns true if the Empower was instant cast with Tip the Scales */
export function isFromTipTheScales(event: CastEvent): boolean {
  return HasRelatedEvent(event, TIP_THE_SCALES_CONSUME);
}

/** Use this to verify if an Empower was cancelled or finished casting.
 *
 * Returns true if the Empower was instant cast with Tip the Scales or if it has an associated empowerEnd event  */
export function empowerFinishedCasting(event: CastEvent): boolean {
  return HasRelatedEvent(event, EMPOWERED_CAST) || isFromTipTheScales(event);
}

/** Get the associated empowerEnd event for an Empower cast */
export function getEmpowerEndEvent(event: CastEvent): EmpowerEndEvent | undefined {
  return GetRelatedEvent<EmpowerEndEvent>(event, EMPOWERED_CAST);
}

export default EmpowerNormalizer;
