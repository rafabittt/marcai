import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {Badge, Bg, CheckCircle, EndCard, Headline, Safe, Sub, TimeGrid, WaBubble, useEnter} from './components';
import {C, FONT, Theme} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* Número gigante decorativo (opacidade baixa), padrão do carrossel 52. */
const BigNum: React.FC<{n: string; theme: Theme}> = ({n, theme}) => {
  const s = useEnter(0, {damping: 20});
  const color = theme === 'green' ? '#000' : C.green;
  return (
    <div style={{position: 'absolute', right: -40, bottom: 120, fontFamily: FONT, fontWeight: 700, fontSize: 760, lineHeight: 1, letterSpacing: -40, color, opacity: 0.07 * s, transform: `translateY(${(1 - s) * 80}px)`}}>
      {n}
    </div>
  );
};

const Intro: React.FC = () => (
  <Bg theme="light">
    <Safe>
      <Badge text="COMO FUNCIONA" theme="light" />
      <Headline theme="light" size={140} lines={[{t: '3 passos.'}, {t: 'Zero', accent: true}, {t: 'enrolação.', accent: true}]} delay={6} />
    </Safe>
  </Bg>
);

const URL = 'marcai.net.br/agendar/zeca';
const Passo1: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = Math.floor(interpolate(frame, [30, 62], [0, URL.length], clamp));
  const copied = frame >= 74;
  const card = useEnter(24);
  const toast = useEnter(74, {damping: 12, stiffness: 160});
  return (
    <Bg theme="dark">
      <BigNum n="01" theme="dark" />
      <Safe>
        <Badge text="PASSO 01" theme="dark" />
        <Headline theme="dark" size={120} lines={[{t: 'Você cria'}, {t: 'seu link.', accent: true}]} delay={4} />
        <Sub theme="dark" delay={14}>Cadastra serviços e horários uma vez. Pronto.</Sub>
        <div style={{marginTop: 60, background: C.white, borderRadius: 30, padding: '30px 30px 30px 36px', display: 'flex', alignItems: 'center', gap: 20, opacity: card, transform: `translateY(${(1 - card) * 30}px)`}}>
          <div style={{flex: 1, fontSize: 38, fontWeight: 500, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden'}}>
            {URL.slice(0, chars)}
            <span style={{opacity: frame % 20 < 10 && chars < URL.length ? 1 : 0, color: C.green}}>|</span>
          </div>
          <div style={{background: copied ? C.green : C.ink, color: C.white, borderRadius: 18, padding: '18px 26px', fontSize: 30, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, transform: `scale(${copied ? 0.96 + toast * 0.04 : 1})`}}>
            {copied ? <><CheckCircle size={32} bg={C.white} fg={C.green} /> Copiado</> : 'Copiar'}
          </div>
        </div>
      </Safe>
    </Bg>
  );
};

const Passo2: React.FC = () => (
  <Bg theme="light">
    <BigNum n="02" theme="light" />
    <Safe>
      <Badge text="PASSO 02" theme="light" />
      <Headline theme="light" size={120} lines={[{t: 'O cliente'}, {t: 'agenda sozinho.', accent: true}]} delay={4} />
      <Sub theme="light" delay={14}>Abre o link no celular. Sem app, sem cadastro.</Sub>
      <div style={{marginTop: 60}}>
        <TimeGrid delay={22} selectAt={66} />
      </div>
    </Safe>
  </Bg>
);

const Passo3: React.FC = () => (
  <Bg theme="green">
    <BigNum n="03" theme="green" />
    <Safe>
      <Badge text="PASSO 03" theme="green" />
      <Headline theme="green" size={120} lines={[{t: 'Cai no seu'}, {t: 'WhatsApp.', accent: true}]} delay={4} />
      <div style={{marginTop: 60, display: 'flex', flexDirection: 'column', gap: 34}}>
        <div style={{fontSize: 28, fontWeight: 700, letterSpacing: 3, color: 'rgba(0,0,0,0.55)'}}>PRO CLIENTE</div>
        <WaBubble
          delay={22}
          sender="Barbearia do Zeca"
          width={880}
          size={36}
          lines={['Agendamento confirmado!', 'Corte Masc com Mat · amanhã às 10:30']}
        />
        <div style={{fontSize: 28, fontWeight: 700, letterSpacing: 3, color: 'rgba(0,0,0,0.55)', marginTop: 10}}>PRA VOCÊ</div>
        <WaBubble delay={44} sender="Marcaí" width={880} size={36} time="10:31" lines={['Novo agendamento', 'Michael · Corte Masc · amanhã 10:30']} />
      </div>
    </Safe>
  </Bg>
);

export const Reel2Passos: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={60}>
      <Intro />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={linearTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence durationInFrames={110}>
      <Passo1 />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={linearTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence durationInFrames={110}>
      <Passo2 />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={linearTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence durationInFrames={105}>
      <Passo3 />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence durationInFrames={90}>
      <EndCard theme="dark" title={[{t: 'Comece'}, {t: 'grátis hoje.', accent: true}]} />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
// total: 60+110+110+105+90 - 60 = 415
