import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

loadFont({family: 'Poppins', url: staticFile('fonts/Poppins-Regular.ttf'), weight: '400'});
loadFont({family: 'Poppins', url: staticFile('fonts/Poppins-Medium.ttf'), weight: '500'});
loadFont({family: 'Poppins', url: staticFile('fonts/Poppins-Bold.ttf'), weight: '700'});
