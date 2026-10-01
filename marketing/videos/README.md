# Marcaí — vídeos (Remotion)

Reels 1080x1920 no padrão da marca (verde #25D366, preto #0a0a0a, Poppins, logo oficial).

## Rodar
    npm install
    npm run studio          # abre o editor no navegador, com preview e timeline
    npm run render:all      # gera os 3 MP4 em out/

## Onde mexer
- src/theme.ts        — cores e fonte da marca
- src/components.tsx  — peças reutilizáveis: Bg, Badge, Headline, Sub, WaBubble,
                        TimeGrid (botões de horário da UI real), EndCard (CTA)
- src/Reel*.tsx       — um arquivo por vídeo; copie um pra criar um novo
- src/Root.tsx        — registra cada vídeo (id, duração em frames, 30fps)

Área segura de Reels: deixe texto entre ~260px e ~1560px de altura (o
componente Safe já faz isso). Os vídeos saem SEM áudio de propósito: adicione
um áudio em alta direto no Instagram, que ajuda no alcance.

Licença: Remotion é gratuito para pessoa física e empresa com até 3 funcionários.
