import {language} from './i18n.mjs';
// Enable individual English guides only after documented human review.
export function guideLanguageAvailable(){return language()==='de';}
