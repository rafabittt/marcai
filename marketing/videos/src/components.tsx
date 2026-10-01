import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, Theme, accentOf, bgOf, inkOf, mutedOf} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const useEnter = (delay = 0, config: object = {damping: 200}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config});
};

/* Fundo da marca com dois círculos suaves em deriva lenta (padrão dos carrosséis). */
export const Bg: React.FC<{theme: Theme; children?: React.ReactNode}> = ({theme, children}) => {
  const frame = useCurrentFrame();
  const d = Math.sin(frame / 45) * 24;
  const circ = theme === 'green' ? 'rgba(0,0,0,0.05)' : 'rgba(37,211,102,0.08)';
  return (
    <AbsoluteFill style={{backgroundColor: bgOf(theme), fontFamily: FONT, overflow: 'hidden'}}>
      <div style={{position: 'absolute', width: 980, height: 980, borderRadius: '50%', background: circ, right: -380 + d, top: -260}} />
      <div style={{position: 'absolute', width: 760, height: 760, borderRadius: '50%', background: circ, left: -340, bottom: -240 - d}} />
      {children}
    </AbsoluteFill>
  );
};

/* Área segura de Reels: conteúdo entre ~260px e ~1560px de altura. */
export const Safe: React.FC<{children: React.ReactNode; justify?: 'center' | 'flex-start'; top?: number}> = ({children, justify = 'center', top = 260}) => (
  <AbsoluteFill style={{padding: `${top}px 96px 360px`, display: 'flex', flexDirection: 'column', justifyContent: justify}}>{children}</AbsoluteFill>
);

export const Badge: React.FC<{text: string; theme: Theme; delay?: number}> = ({text, theme, delay = 0}) => {
  const s = useEnter(delay);
  const bg = theme === 'dark' ? C.badgeDark : theme === 'green' ? 'rgba(0,0,0,0.16)' : C.ink;
  const fg = theme === 'green' ? C.white : C.green;
  return (
    <div style={{alignSelf: 'flex-start', padding: '16px 34px', borderRadius: 999, background: bg, color: fg, fontWeight: 700, fontSize: 32, letterSpacing: 3, opacity: s, transform: `translateY(${(1 - s) * 30}px)`, marginBottom: 44}}>
      {text}
    </div>
  );
};

/* Título palavra por palavra. lines: [{t, accent}] — accent pinta a linha com a cor de destaque do tema. */
export const Headline: React.FC<{
  lines: {t: string; accent?: boolean}[];
  theme: Theme;
  delay?: number;
  size?: number;
  stagger?: number;
  align?: 'left' | 'center';
}> = ({lines, theme, delay = 0, size = 124, stagger = 3, align = 'left'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  let i = 0;
  return (
    <div style={{fontWeight: 700, fontSize: size, lineHeight: 1.06, letterSpacing: -size * 0.035, color: inkOf(theme), textAlign: align}}>
      {lines.map((l, li) => (
        <div key={li}>
          {l.t.split(' ').map((w, wi) => {
            const s = spring({frame: frame - (delay + i++ * stagger), fps, config: {damping: 14, stiffness: 140, mass: 0.6}});
            return (
              <span
                key={wi}
                style={{
                  display: 'inline-block',
                  margin: align === 'center' ? `0 ${size * 0.12}px` : `0 ${size * 0.24}px 0 0`,
                  color: l.accent ? accentOf(theme) : undefined,
                  opacity: interpolate(s, [0, 0.6], [0, 1], clamp),
                  transform: `translateY(${(1 - s) * 70}px)`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Sub: React.FC<{children: React.ReactNode; theme: Theme; delay?: number; size?: number; align?: 'left' | 'center'}> = ({children, theme, delay = 0, size = 46, align = 'left'}) => {
  const s = useEnter(delay);
  return (
    <div style={{fontSize: size, fontWeight: 500, lineHeight: 1.35, color: mutedOf(theme), marginTop: 40, opacity: s, transform: `translateY(${(1 - s) * 24}px)`, textAlign: align}}>
      {children}
    </div>
  );
};

export const CheckCircle: React.FC<{size?: number; bg?: string; fg?: string}> = ({size = 44, bg = C.green, fg = C.white}) => (
  <svg width={size} height={size} viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="22" fill={bg} />
    <path d="M13 22.5l6 6 12-13" fill="none" stroke={fg} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChatIcon: React.FC<{size?: number}> = ({size = 84}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.26, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z" fill={C.white} />
    </svg>
  </div>
);

/* Círculo de toque (feedback de clique). */
export const Tap: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -4 || t > 18) return null;
  const s = interpolate(t, [-4, 18], [0.4, 1.8], clamp);
  const o = interpolate(t, [-4, 2, 18], [0, 0.55, 0], clamp);
  return (
    <div style={{position: 'absolute', left: '50%', top: '50%', width: 120, height: 120, marginLeft: -60, marginTop: -60, borderRadius: '50%', background: C.ink, opacity: o, transform: `scale(${s})`, pointerEvents: 'none'}} />
  );
};

/* Bolha de WhatsApp. */
export const WaBubble: React.FC<{
  sender?: string;
  lines: React.ReactNode[];
  delay: number;
  out?: boolean;
  time?: string;
  width?: number;
  size?: number;
}> = ({sender, lines, delay, out = false, time = '10:30', width = 820, size = 38}) => {
  const s = useEnter(delay, {damping: 13, stiffness: 160, mass: 0.7});
  return (
    <div
      style={{
        width,
        alignSelf: out ? 'flex-end' : 'flex-start',
        background: out ? C.waOut : C.white,
        borderRadius: 34,
        borderTopLeftRadius: out ? 34 : 8,
        borderTopRightRadius: out ? 8 : 34,
        padding: '28px 34px 18px',
        boxShadow: '0 18px 50px rgba(0,0,0,0.18)',
        opacity: interpolate(s, [0, 0.5], [0, 1], clamp),
        transform: `scale(${interpolate(s, [0, 1], [0.7, 1])}) translateY(${(1 - s) * 40}px)`,
        transformOrigin: out ? 'right bottom' : 'left bottom',
        fontFamily: FONT,
      }}
    >
      {sender && <div style={{color: C.greenDark, fontWeight: 700, fontSize: size * 0.82, marginBottom: 8}}>{sender}</div>}
      {lines.map((l, i) => (
        <div key={i} style={{fontSize: size, lineHeight: 1.35, color: '#111b21', fontWeight: i === 0 ? 700 : 400}}>{l}</div>
      ))}
      <div style={{textAlign: 'right', fontSize: size * 0.6, color: '#667781', marginTop: 6}}>{time}{out ? '  ✓✓' : ''}</div>
    </div>
  );
};

/* Grade de horários da UI nova (Manhã / Tarde) com seleção animada. */
export const TimeGrid: React.FC<{
  delay: number;
  selectAt: number;
  selected?: string;
  btnH?: number;
  font?: number;
  gap?: number;
  labelSize?: number;
}> = ({delay, selectAt, selected = '10:30', btnH = 92, font = 36, gap = 18, labelSize = 26}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const blocos: [string, string[]][] = [
    ['MANHÃ', ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']],
    ['TARDE', ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30']],
  ];
  let k = 0;
  return (
    <div>
      {blocos.map(([label, hs]) => (
        <div key={label} style={{marginBottom: gap * 1.6}}>
          <div style={{fontSize: labelSize, fontWeight: 700, letterSpacing: 3, color: C.gray, marginBottom: gap * 0.8}}>{label}</div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap}}>
            {hs.map((h) => {
              const s = spring({frame: frame - (delay + k++ * 2), fps, config: {damping: 200}});
              const on = h === selected && frame >= selectAt;
              const pop = on ? spring({frame: frame - selectAt, fps, config: {damping: 9, stiffness: 220}}) : 0;
              return (
                <div
                  key={h}
                  style={{
                    position: 'relative',
                    height: btnH,
                    borderRadius: btnH * 0.24,
                    border: `2.5px solid ${on ? C.green : C.line}`,
                    background: on ? C.green : C.white,
                    color: on ? C.white : C.ink,
                    fontSize: font,
                    fontWeight: on ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: s,
                    transform: `translateY(${(1 - s) * 20}px) scale(${1 + pop * 0.06 - (on ? 0.06 : 0)})`,
                    overflow: 'hidden',
                  }}
                >
                  {h}
                  {h === selected && <Tap at={selectAt} />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export const Logo: React.FC<{height?: number; white?: boolean}> = ({height = 90, white = false}) => (
  <Img src={staticFile('logo.png')} style={{height, filter: white ? 'brightness(0) invert(1)' : undefined}} />
);

/* Cartão final de CTA — mesmo em todos os vídeos. */
export const EndCard: React.FC<{theme?: Theme; title?: {t: string; accent?: boolean}[]}> = ({
  theme = 'green',
  title = [{t: 'Crie seu link'}, {t: 'grátis hoje.', accent: true}],
}) => {
  const logo = useEnter(0);
  const pill = useEnter(22, {damping: 12, stiffness: 140});
  const foot = useEnter(34);
  return (
    <Bg theme={theme}>
      <Safe>
        <div style={{opacity: logo, transform: `translateY(${(1 - logo) * 20}px)`, marginBottom: 70}}>
          <Logo height={96} white={theme !== 'light'} />
        </div>
        <Headline lines={title} theme={theme} delay={6} size={128} />
        <div
          style={{
            marginTop: 70,
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: 26,
            background: theme === 'dark' ? C.green : C.ink,
            borderRadius: 999,
            padding: '30px 34px 30px 52px',
            transform: `scale(${pill})`,
            transformOrigin: 'left center',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          }}
        >
          <span style={{color: theme === 'dark' ? C.ink : C.green, fontWeight: 700, fontSize: 58, letterSpacing: -1}}>marcai.net.br</span>
          <div style={{width: 76, height: 76, borderRadius: '50%', background: theme === 'dark' ? C.ink : C.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width="40" height="40" viewBox="0 0 24 24">
              <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke={theme === 'dark' ? C.green : C.ink} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div style={{marginTop: 48, opacity: foot, fontSize: 38, fontWeight: 500, color: mutedOf(theme)}}>
          Grátis pra começar · sem cartão · sem app
        </div>
        <div style={{marginTop: 18, opacity: foot, fontSize: 40, fontWeight: 700, color: inkOf(theme)}}>@usemarcai</div>
      </Safe>
    </Bg>
  );
};
