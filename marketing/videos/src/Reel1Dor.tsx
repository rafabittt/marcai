import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {Badge, Bg, ChatIcon, CheckCircle, EndCard, Headline, Logo, Safe, Sub, Tap, TimeGrid, WaBubble, useEnter} from './components';
import {C, FONT} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* 1. Gancho */
const Hook: React.FC = () => (
  <Bg theme="dark">
    <Safe>
      <Badge text="PRA DONO DE NEGÓCIO" theme="dark" />
      <Headline theme="dark" size={122} lines={[{t: 'Quantos'}, {t: 'clientes você'}, {t: 'perdeu hoje?', accent: true}]} delay={6} />
    </Safe>
  </Bg>
);

/* 2. O zap explodindo */
const MSGS = [
  {n: 'Ana Paula', m: 'Oi! Tem horário amanhã?'},
  {n: 'Carlos', m: 'Qual o valor do corte?'},
  {n: 'Júlia', m: 'Ainda tem vaga sábado?'},
  {n: 'Rafael', m: 'Pode ser às 15h?'},
  {n: 'Bruna', m: 'Oi?? Tá aí?'},
  {n: 'Marcos', m: 'Consegue me encaixar hoje?'},
  {n: 'Fernanda', m: 'Esqueci o horário, era 10h?'},
];
const STEP = 11;
const START = 22;

const Notif: React.FC<{k: number}> = ({k}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = START + k * STEP;
  const enter = spring({frame: frame - a, fps, config: {damping: 15, stiffness: 170}});
  let idx = 0;
  for (let j = k + 1; j < MSGS.length; j++) idx += spring({frame: frame - (START + j * STEP), fps, config: {damping: 18, stiffness: 160}});
  const y = 560 + idx * 168;
  const o = enter * interpolate(idx, [3.2, 4.4], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        width: 900,
        top: y,
        opacity: o,
        transform: `translateY(${(1 - enter) * -80}px) scale(${interpolate(idx, [0, 4], [1, 0.9], clamp)})`,
        background: 'rgba(255,255,255,0.96)',
        borderRadius: 36,
        padding: '24px 30px',
        display: 'flex',
        gap: 26,
        alignItems: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        fontFamily: FONT,
      }}
    >
      <ChatIcon size={78} />
      <div style={{flex: 1}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 24, color: C.grayText}}>
          <span style={{fontWeight: 700, color: C.ink, fontSize: 31}}>{MSGS[k].n}</span>
          <span>agora</span>
        </div>
        <div style={{fontSize: 31, color: '#333', marginTop: 2}}>{MSGS[k].m}</div>
      </div>
    </div>
  );
};

const Flood: React.FC = () => {
  const frame = useCurrentFrame();
  const unread = Math.round(interpolate(frame, [START, START + STEP * 6 + 10], [1, 37], clamp));
  const cap = useEnter(0);
  return (
    <Bg theme="dark">
      <div style={{position: 'absolute', top: 280, left: 96, right: 96, opacity: cap, fontFamily: FONT}}>
        <div style={{fontSize: 70, fontWeight: 700, color: C.white, letterSpacing: -2, lineHeight: 1.1}}>
          Você atendendo…<br />
          <span style={{color: C.green}}>e o zap não para.</span>
        </div>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, marginTop: 26, background: C.red, color: C.white, borderRadius: 999, padding: '10px 26px', fontSize: 32, fontWeight: 700}}>
          {unread} mensagens não lidas
        </div>
      </div>
      {MSGS.map((_, k) => (
        <Notif key={k} k={k} />
      ))}
    </Bg>
  );
};

/* 3. A virada */
const Turn: React.FC = () => (
  <Bg theme="green">
    <Safe>
      <Headline theme="green" size={132} lines={[{t: 'E se o cliente'}, {t: 'agendasse'}, {t: 'sozinho?', accent: true}]} delay={4} />
    </Safe>
  </Bg>
);

/* 4. O produto: telefone com a UI de agendamento + confirmação no WhatsApp */
const SELECT_AT = 62;
const CONFIRM_AT = 92;
const WA_AT = 108;

const PhoneDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const phone = useEnter(0, {damping: 18, stiffness: 120});
  const ready = frame >= SELECT_AT;
  const pressed = frame >= CONFIRM_AT && frame < CONFIRM_AT + 8;
  const capA = interpolate(frame, [WA_AT - 10, WA_AT], [1, 0], clamp);
  const capB = interpolate(frame, [WA_AT, WA_AT + 10], [0, 1], clamp);
  const dim = interpolate(frame, [WA_AT - 4, WA_AT + 8], [0, 0.45], clamp);
  return (
    <Bg theme="light">
      <div style={{position: 'absolute', top: 250, left: 96, right: 96, fontFamily: FONT, fontWeight: 700, fontSize: 64, letterSpacing: -2, lineHeight: 1.1, color: C.ink}}>
        <div style={{position: 'absolute', opacity: capA}}>
          Ele escolhe o horário.<br />
          <span style={{color: C.green}}>Sem app, sem ligação.</span>
        </div>
        <div style={{position: 'absolute', opacity: capB}}>
          E a confirmação<br />
          <span style={{color: C.green}}>cai no WhatsApp.</span>
        </div>
      </div>

      <div style={{position: 'absolute', left: '50%', top: 470, transform: `translateX(-50%) translateY(${(1 - phone) * 900}px)`}}>
        <div style={{width: 640, height: 1180, borderRadius: 84, background: C.ink, padding: 20, boxShadow: '0 50px 100px rgba(0,0,0,0.22)'}}>
          <div style={{width: '100%', height: '100%', borderRadius: 66, background: C.off, overflow: 'hidden', position: 'relative', fontFamily: FONT}}>
            <div style={{position: 'absolute', top: 18, left: '50%', marginLeft: -90, width: 180, height: 42, borderRadius: 21, background: C.ink}} />
            <div style={{padding: '96px 36px 0'}}>
              <Logo height={46} />
              <div style={{fontSize: 42, fontWeight: 700, color: C.ink, marginTop: 20, letterSpacing: -1}}>Barbearia do Zeca</div>
              <div style={{fontSize: 24, color: C.grayText, marginTop: 2, marginBottom: 26}}>Passo 4 de 5 · Escolha o horário</div>
              <div style={{background: C.white, borderRadius: 26, border: `2.5px solid ${C.green}`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30}}>
                <div>
                  <div style={{fontSize: 32, fontWeight: 700, color: C.ink}}>Corte Masc</div>
                  <div style={{fontSize: 24, color: C.grayText}}>30 min · com Mat</div>
                </div>
                <CheckCircle size={44} />
              </div>
              <TimeGrid delay={14} selectAt={SELECT_AT} btnH={74} font={28} gap={14} labelSize={21} />
              <div
                style={{
                  position: 'relative',
                  marginTop: 6,
                  height: 96,
                  borderRadius: 26,
                  background: C.green,
                  opacity: ready ? 1 : 0.35,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.white,
                  fontWeight: 700,
                  fontSize: 32,
                  transform: `scale(${pressed ? 0.95 : 1})`,
                  overflow: 'hidden',
                }}
              >
                Confirmar agendamento
                <Tap at={CONFIRM_AT} />
              </div>
            </div>
            <div style={{position: 'absolute', inset: 0, background: '#000', opacity: dim}} />
          </div>
        </div>
      </div>

      <div style={{position: 'absolute', left: 70, right: 70, top: 1050, display: 'flex', flexDirection: 'column'}}>
        {frame >= WA_AT - 2 && (
          <WaBubble
            delay={WA_AT}
            sender="Marcaí"
            width={900}
            size={40}
            time="10:31"
            lines={[
              <span key="a" style={{display: 'inline-flex', alignItems: 'center', gap: 14}}>
                <CheckCircle size={40} /> Agendamento confirmado!
              </span>,
              'Corte Masc com Mat',
              'Amanhã às 10:30 · Barbearia do Zeca',
            ]}
          />
        )}
      </div>
    </Bg>
  );
};

export const Reel1Dor: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={75}>
      <Hook />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 12})} />
    <TransitionSeries.Sequence durationInFrames={120}>
      <Flood />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={wipe({direction: 'from-bottom'})} timing={linearTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence durationInFrames={60}>
      <Turn />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={linearTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence durationInFrames={170}>
      <PhoneDemo />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={linearTiming({durationInFrames: 15})} />
    <TransitionSeries.Sequence durationInFrames={90}>
      <EndCard theme="green" />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
// total: 75+120+60+170+90 - (12+15+15+15) = 458
