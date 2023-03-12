import { GuideProps, Section, SubSection } from 'interface/guide';
import { TALENTS_DEMON_HUNTER } from 'common/TALENTS/demonhunter';
import { ResourceLink, SpellLink } from 'interface';
import PreparationSection from 'interface/guide/components/Preparation/PreparationSection';
import { t, Trans } from '@lingui/macro';
import { explanationAndDataSubsection } from 'interface/guide/components/ExplanationRow';
import FuryCapWaste from 'analysis/retail/demonhunter/shared/guide/FuryCapWaste';
import CombatLogParser from './CombatLogParser';
import CooldownGraphSubsection from './guide/CooldownGraphSubSection';
import {
  GOOD_TIME_AT_FURY_CAP,
  OK_TIME_AT_FURY_CAP,
  PERFECT_TIME_AT_FURY_CAP,
} from './modules/resourcetracker/FuryTracker';
import HideExplanationsToggle from 'interface/guide/components/HideExplanationsToggle';
import CooldownUsage from 'parser/core/MajorCooldowns/CooldownUsage';
import RESOURCE_TYPES from 'game/RESOURCE_TYPES';

export default function Guide({ modules, events, info }: GuideProps<typeof CombatLogParser>) {
  return (
    <>
      <ResourceUsageSection modules={modules} events={events} info={info} />
      <CooldownSection modules={modules} events={events} info={info} />
      <RotationSection modules={modules} events={events} info={info} />
      <PreparationSection />
    </>
  );
}

function ResourceUsageSection({ modules }: GuideProps<typeof CombatLogParser>) {
  const percentAtFuryCap = modules.furyTracker.percentAtCap;
  const percentAtFuryCapPerformance = modules.furyTracker.percentAtCapPerformance;
  const furyWasted = modules.furyTracker.wasted;
  return (
    <Section
      title={t({
        id: 'guide.demonhunter.havoc.sections.resources.title',
        message: 'Resource Use',
      })}
    >
      <SubSection
        title={t({
          id: 'guide.demonhunter.havoc.sections.resources.fury.title',
          message: 'Fury',
        })}
      >
        <p>
          <Trans id="guide.demonhunter.havoc.sections.resources.fury.summary">
            Havoc's primary resource is <ResourceLink id={RESOURCE_TYPES.FURY.id} />. You should
            avoid capping <ResourceLink id={RESOURCE_TYPES.FURY.id} /> - lost{' '}
            <ResourceLink id={RESOURCE_TYPES.FURY.id} /> generation is lost DPS.
          </Trans>
        </p>
        <FuryCapWaste
          percentAtCap={percentAtFuryCap}
          percentAtCapPerformance={percentAtFuryCapPerformance}
          wasted={furyWasted}
          perfectTimeAtFuryCap={PERFECT_TIME_AT_FURY_CAP}
          goodTimeAtFuryCap={GOOD_TIME_AT_FURY_CAP}
          okTimeAtFuryCap={OK_TIME_AT_FURY_CAP}
        />
        {modules.furyGraph.plot}
      </SubSection>
    </Section>
  );
}

function CooldownSection({ modules, info }: GuideProps<typeof CombatLogParser>) {
  return (
    <Section
      title={t({
        id: 'guide.demonhunter.havoc.sections.cooldowns.title',
        message: 'Cooldowns',
      })}
    >
      <HideExplanationsToggle id="hide-explanations-cooldowns" />
      <CooldownGraphSubsection />
      <CooldownUsage analyzer={modules.essenceBreak} />
      <CooldownUsage analyzer={modules.eyeBeam} />
      {info.combatant.hasTalent(TALENTS_DEMON_HUNTER.ELYSIAN_DECREE_TALENT) &&
        explanationAndDataSubsection(
          <div>
            Per-cast breakdown for <SpellLink id={TALENTS_DEMON_HUNTER.ELYSIAN_DECREE_TALENT} />{' '}
            coming soon!
          </div>,
          <></>,
        )}
      {info.combatant.hasTalent(TALENTS_DEMON_HUNTER.GLAIVE_TEMPEST_TALENT) &&
        explanationAndDataSubsection(
          <div>
            Per-cast breakdown for <SpellLink id={TALENTS_DEMON_HUNTER.GLAIVE_TEMPEST_TALENT} />{' '}
            coming soon!
          </div>,
          <></>,
        )}
      {info.combatant.hasTalent(TALENTS_DEMON_HUNTER.FEL_BARRAGE_TALENT) &&
        explanationAndDataSubsection(
          <div>
            Per-cast breakdown for <SpellLink id={TALENTS_DEMON_HUNTER.FEL_BARRAGE_TALENT} /> coming
            soon!
          </div>,
          <></>,
        )}
    </Section>
  );
}

function RotationSection({ modules }: GuideProps<typeof CombatLogParser>) {
  return (
    <Section
      title={t({
        id: 'guide.demonhunter.havoc.sections.rotation.title',
        message: 'Rotation',
      })}
    >
      <HideExplanationsToggle id="hide-explanations-rotations" />
      {modules.throwGlaive.guideSubsection()}
      {modules.momentum.guideSubsection()}
    </Section>
  );
}
