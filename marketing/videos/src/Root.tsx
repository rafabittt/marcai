import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {Reel1Dor} from './Reel1Dor';
import {Reel2Passos} from './Reel2Passos';
import {Reel3Duvidas} from './Reel3Duvidas';

const reel = {fps: 30, width: 1080, height: 1920} as const;

export const Root: React.FC = () => (
  <>
    <Composition id="Reel1-Dor" component={Reel1Dor} durationInFrames={458} {...reel} />
    <Composition id="Reel2-Passos" component={Reel2Passos} durationInFrames={415} {...reel} />
    <Composition id="Reel3-Duvidas" component={Reel3Duvidas} durationInFrames={367} {...reel} />
  </>
);
