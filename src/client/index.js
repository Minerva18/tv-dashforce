//use the synthetic shadow DOM in order for other components to inherit SLDS styling from index.html
import '@lwc/synthetic-shadow';

import { buildCustomElementConstructor } from 'lwc';
import MyApp from 'my/app';

customElements.define('my-app', buildCustomElementConstructor(MyApp));
