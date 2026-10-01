import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {fade} from '@remotion/transitions/fade';
import {Badge, Bg, EndCard, Headline, Safe, Sub} from './components';
import {C, FONT, Theme, accentOf, inkOf, mutedOf} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Intro: React.FC = () => (
  <Bg theme="green">
    <Safe>
      <Badge text="TIRA A DÚVIDA" theme="green" />
      <Headline theme="green" size={132} lines={[{t: '3 perguntas'}, {t: 'que todo'}, {t: 'dono faz.', accent: true}]} delay={6} />
    </Safe>
  </Bg>
);

const QA: React.FC<{theme: Theme; n: string; q: string; a: string; sub: string}> = ({theme, n, q, a, sub}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const typed = Math.floor(interpolate(frame, [6, 34], [0, q.length], clamp));
  const ANS = 40;
  const slam = spring({frame: frame - ANS, fps, config: {damping: 11, stiffness: 180, mass: 0.8}});
  return (
    <Bg theme={theme}>
      <Safe>
        <div style={{fontSize: 32, fontWeight: 700, letterSpacing: 3, color: mutedOf(theme), marginBottom: 30}}>PERGUNTA {n}</div>
        <div style={{fontFamily: FONT, fontSize: 66, fontWeight: 500, lineHeight: 1.2, color: inkOf(theme), minHeight: 170}}>
          “{q.slice(0, typed)}
          {typed >= q.length ? '”' : <span style={{color: accentOf(theme), opacity: frame % 16 < 8 ? 1 : 0}}>|</span>}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 300,
            lineHeight: 1,
            letterSpacing: -12,
            marginTop: 50,
            color: accentOf(theme),
            opacity: interpolate(slam, [0, 0.3], [0, 1], clamp),
            transform: `scale(${interpolate(slam, [0, 1], [1.7, 1])})`,
            transformOrigin: 'left center',
          }}
        >
          {a}
        </div>
        {frame >= ANS + 8 && (
          <Sub theme={theme} delay={ANS + 10} size={48}>
            {sub}
          </Sub>
        )}
      </Safe>
    </Bg>
  );
};

export const Reel3Duvidas: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={60}>
      <Intro />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={linearTiming({durationInFrames: 12})} />
    <TransitionSeries.Sequence durationInFrames={90}>
      <QA theme="dark" n="01" q="Meu cliente precisa baixar app?" a="Não." sub="Ele abre o link no navegador do celular." />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={linearTiming({durationInFrames: 12})} />
    <TransitionSeries.Sequence durationInFrames={90}>
      <QA theme="light" n="02" q="Funciona no meu WhatsApp normal?" a="Sim." sub="Pessoal ou Business, tanto faz." />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={linearTiming({durationInFrames: 12})} />
    <TransitionSeries.Sequence durationInFrames={90}>
      <QA theme="green" n="03" q="Quanto custa pra começar?" a="Nada." sub="Plano grátis pra testar. Sem cartão." />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 12})} />
    <TransitionSeries.Sequence durationInFrames={85}>
      <EndCard theme="dark" title={[{t: 'Sem desculpa.'}, {t: 'Bora?', accent: true}]} />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
// total: 60+90*3+85 - 48 = 367
